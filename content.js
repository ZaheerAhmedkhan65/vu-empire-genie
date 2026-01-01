//content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case "GET_GDB_CONTENT":
      sendResponse({ content: extractGDBContent() });
      break;

    case "PROCESS_QUIZ":
      sendResponse(processQuizContent());
      break;

    case "HIGHLIGHT_CORRECT_ANSWER":
      highlightCorrectAnswer();
      sendResponse({ success: true });
      break;

    case "SELECT_CORRECT_ANSWER":
      selectCorrectAnswer(request.answer);
      sendResponse({ success: true });
      break;

    case "FILL_CKEDITOR":
      fillCKEditor(request.content);
      sendResponse({ success: true });
      break;

    case "MARK_LECTURE_VIEWED":
      sendResponse(markLectureAsViewed());
      break;

    default:
      sendResponse({ error: "Unknown request type" });
  }

  return true;
});

function extractGDBContent() {
  // VU LMS specific GDB selectors
  const selectors = [
    "#MainContent_divDescription",
    "#lblQuestion",
    ".question-text",
    ".gdb-question",
    "[id*='Question']",
    "[class*='question']"
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.innerText.trim().length > 20) {
      return element.innerText.trim();
    }
  }

  // Fallback: Look for text containing "Question" or "GDB"
  const allText = document.body.innerText;
  const lines = allText.split('\n');

  for (const line of lines) {
    if ((line.includes('Question') || line.includes('GDB') || line.includes('Discuss')) &&
      line.length > 30 && line.length < 1000) {
      return line.trim();
    }
  }

  return "No GDB question found on this page.";
}

function processQuizContent() {
  // Use the improved quiz extraction logic from inject_ui.js
  const quizData = extractQuizData();

  if (!quizData) {
    return {
      question: "Could not extract quiz question",
      options: ["Extraction failed"],
      correctAnswer: null,
      needsAI: true,
      questionText: "No quiz content found",
      error: true
    };
  }

  // Extract course info
  const courseInfo = getCourseCode();

  // Try to find current selection
  const selectedOption = getSelectedOption();

  return {
    question: quizData.question || "Quiz Question",
    options: quizData.options || [],
    correctAnswer: selectedOption,
    needsAI: !selectedOption,
    questionText: quizData.formattedText || quizData.question,
    courseCode: courseInfo.code,
    courseName: courseInfo.fullName,
    formattedText: quizData.formattedText
  };
}

// Improved quiz extraction functions from inject_ui.js
function extractQuizData() {
  // Quiz helper functions (matching inject_ui.js logic)
  const getQuestionWrapper = () => document.querySelector("textarea[id^='txtQuestion'], div > table > tbody > tr > td > table > tbody > tr > td > div:first-child, div > table p");

  const parseMathJax = (element) => {
    element = element.cloneNode(true);
    Array.from(element.querySelectorAll("script")).forEach(script => {
      const span = document.createElement("span");
      span.textContent = reconstructLatex(script.textContent);
      script.replaceWith(span);
    });
    Array.from(element.querySelectorAll(".MathJax_Display, .MathJax_Preview, .MathJax")).forEach(el => el.remove());
    return element.textContent;
  };

  const hasMathJax = (element) => element?.querySelector(".MathJax_Preview") instanceof Element;

  const isLatexString = (str) => /\$(.*|\n)+\$/g.test(str) || /\\\((.*|\n)+\)/g.test(str) || /^\$\$(.*|\n)+?/gi.test(str) && /\$\$$/g.test(str) || /^\\\[(.*|\n)+?/gi.test(str) && /\\]$/g.test(str);

  const reconstructLatex = (str) => typeof str !== "string" ? str : (str = str.trim(), isLatexString(str) ? str : `\\[${str}\\]`);

  const getQuestionText = () => {
    let questionText;
    let textareas = Array.from(document.querySelectorAll("textarea[id^='txtQuestion']"));

    if (textareas.length) {
      textareas.filter(el => el.style.display !== "none" && el.style.opacity === "").forEach(el => {
        if (el.value && el.value.trim()) {
          questionText = el.value.trim();
        }
      });
    } else {
      let wrapper = document.querySelector("div > table > tbody > tr > td > table > tbody > tr > td > div:first-child") || getQuestionWrapper();
      if (!wrapper) return questionText;

      const mathJaxPresent = hasMathJax(wrapper);
      textareas = Array.from(wrapper.querySelectorAll("textarea, p"));
      let children = Array.from(wrapper.children).filter(el => el.style.display !== "none" && el.style.opacity === "" && el.firstElementChild && el.innerText);
      children = children.map(el => {
        if (el.children.length > 0) {
          let child = Array.from(el.children).filter(child => child.style.display !== "none" && child.style.opacity === "" && child.innerText);
          return child.length > 0 ? child[0].textContent.trim() : null;
        }
        return el.style.display !== "none" ? el.textContent.trim() : null;
      });

      if (textareas.length && !children.length) {
        textareas.filter(el => el.style.display !== "none" && el.style.opacity === "").forEach(el => {
          if (el.value && el.value.trim()) {
            questionText = el.value.trim();
          }
        });
      }

      questionText = children.length > 0 ? children[0]?.trim() : questionText;

      if (mathJaxPresent) {
        const mathJaxElement = wrapper.querySelector(".MathJax_Preview")?.parentElement;
        questionText = mathJaxElement ? parseMathJax(mathJaxElement) : reconstructLatex(wrapper.querySelector("script")?.textContent) ?? questionText;
      }
    }
    return questionText;
  };

  const getAnswerText = (element) => {
    if (!element) return null;
    let text = "value" in element ? element.value.trim() : element.textContent.trim();
    const mathJaxPresent = element.querySelector(".MathJax_Preview") instanceof Element;

    if (mathJaxPresent) {
      const mathJaxElement = element.querySelector(".MathJax_Preview").parentElement;
      text = parseMathJax(mathJaxElement);
    }

    return { text: text?.trim() };
  };

  const getAnswersText = () => {
    const answersElements = Array.from(document.querySelectorAll("table table table td > div span[id^='lblExpression'], textarea[name^='lblAnswer']"));
    return answersElements.map(getAnswerText).filter(answer => answer !== undefined && answer !== null);
  };

  // Get question and answers
  const questionText = getQuestionText();
  const answersText = getAnswersText();

  if (!questionText || !answersText.length) {
    return null;
  }

  // Format the text
  const formattedText = `${questionText}\n\n${answersText.map(answer => answer.text).join("\n\n")}`;

  return {
    question: questionText,
    options: answersText.map(a => a.text),
    formattedText: formattedText
  };
}

function getCourseCode() {
  const courseEl = document.querySelector("#lblCourseCode, #m_lblCourseCode");
  if (!courseEl) return { code: 'UNKNOWN', fullName: 'UNKNOWN' };

  const fullText = courseEl.textContent.trim();
  // Extract just the course code (e.g., "CS607" from "CS607 - Artificial Intelligence (Semester Quiz # 2)")
  const codeMatch = fullText.match(/^([A-Z]{2,4}\d{3,4})/);
  const code = codeMatch ? codeMatch[1] : fullText;

  return { code: code, fullName: fullText };
}

function getSelectedOption() {
  const checkedInput = document.querySelector("table table table td > span input[id^='radioBtn']:checked");
  if (checkedInput) {
    const answerSpan = checkedInput.parentElement?.nextElementSibling?.querySelector("span[id^='lblExpression']");
    return answerSpan ? answerSpan.textContent.trim() : null;
  }
  return null;
}

function highlightCorrectAnswer() {
  // Remove existing highlights
  document.querySelectorAll('.vu-highlight-correct').forEach(el => {
    el.classList.remove('vu-highlight-correct');
  });

  // Add highlight style
  const style = document.createElement('style');
  style.textContent = `
    .vu-highlight-correct {
      background-color: #d4edda !important;
      border: 2px solid #28a745 !important;
      padding: 8px !important;
      border-radius: 6px !important;
      font-weight: bold !important;
      color: #155724 !important;
    }
    .vu-highlight-option {
      background-color: #fff3cd !important;
      border-left: 4px solid #ffc107 !important;
      padding: 5px 10px !important;
      margin: 5px 0 !important;
    }
  `;
  document.head.appendChild(style);

  // Find and highlight correct elements
  const correctSelectors = [
    '.correct',
    '.right-answer',
    '.answer-correct',
    '[style*="green"]',
    '[color*="green"]',
    'input:checked + label',
    'input:checked ~ label'
  ];

  let highlighted = false;

  correctSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      el.classList.add('vu-highlight-correct');
      highlighted = true;
    });
  });

  if (highlighted) {
    alert('✓ Correct answer(s) highlighted in green!');
  } else {
    alert('No correct answer indicators found. Try using AI analysis.');
  }
}

function selectCorrectAnswer(answer) {
  if (!answer) return;

  // Try different methods to select the answer

  // Method 1: Radio buttons with labels containing answer text
  const radioButtons = document.querySelectorAll('input[type="radio"]');
  for (const radio of radioButtons) {
    // Find associated label
    let label = null;
    if (radio.id) {
      label = document.querySelector(`label[for="${radio.id}"]`);
    }
    if (!label) {
      label = radio.closest('label') || radio.parentElement.querySelector('label');
    }

    if (label && label.textContent.includes(answer)) {
      radio.click();
      radio.checked = true;
      alert(`✓ Selected answer: ${answer}`);
      return true;
    }
  }

  // Method 2: Match by option letter (A, B, C, D)
  const optionLetter = answer.trim().charAt(0).toUpperCase();
  if (['A', 'B', 'C', 'D'].includes(optionLetter)) {
    // Try to find option with this letter
    const optionPatterns = [
      `input[value*="${optionLetter}"]`,
      `input[id*="${optionLetter}"]`,
      `input[name*="${optionLetter}"]`
    ];

    for (const pattern of optionPatterns) {
      const input = document.querySelector(pattern);
      if (input && input.type === 'radio') {
        input.click();
        input.checked = true;
        alert(`✓ Selected option ${optionLetter}`);
        return true;
      }
    }
  }

  alert('Could not automatically select the answer. Please select manually.');
  return false;
}

function fillCKEditor(content) {
  // VU LMS uses CKEDITOR for GDB responses
  const editorSelectors = [
    '#cke_contents_CKEditor1 iframe',
    'iframe[title*="editor"]',
    'iframe[src*="editor"]',
    '.cke_wysiwyg_frame'
  ];

  let editorFrame = null;

  for (const selector of editorSelectors) {
    editorFrame = document.querySelector(selector);
    if (editorFrame) break;
  }

  if (editorFrame) {
    try {
      const editorDoc = editorFrame.contentDocument || editorFrame.contentWindow.document;
      const editorBody = editorDoc.body;

      // Convert markdown to HTML for CKEDITOR
      const htmlContent = convertMarkdownToHTML(content);

      // Set the content
      editorBody.innerHTML = htmlContent;

      // Trigger change events
      editorBody.dispatchEvent(new Event('input', { bubbles: true }));
      editorBody.dispatchEvent(new Event('change', { bubbles: true }));

      // Also try to set via CKEDITOR API if available
      if (typeof CKEDITOR !== 'undefined') {
        for (const instance in CKEDITOR.instances) {
          if (CKEDITOR.instances[instance]) {
            CKEDITOR.instances[instance].setData(htmlContent);
          }
        }
      }

      console.log('✓ CKEDITOR filled with solution');
      return true;
    } catch (error) {
      console.error('Error filling CKEDITOR:', error);
    }
  }

  // Fallback: Try to find textarea
  const textareas = document.querySelectorAll('textarea');
  for (const textarea of textareas) {
    if (textarea.offsetHeight > 100) { // Likely the editor textarea
      textarea.value = content;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      alert('✓ Solution filled in text editor');
      return true;
    }
  }

  alert('Could not find editor. Please copy and paste manually.');
  return false;
}

function convertMarkdownToHTML(markdown) {
  // Simple markdown to HTML conversion
  return markdown
    .replace(/^# (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h4>$1</h4>')
    .replace(/^### (.*$)/gm, '<h5>$1</h5>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^\* (.*$)/gm, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$&</ul>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
}

function markLectureAsViewed() {
  // VU Lecture Viewer specific
  const pageUrl = window.location.href;

  if (!pageUrl.includes('LessonViewer.aspx')) {
    return { success: false, message: "Not on lecture viewer page" };
  }

  // Try different methods to mark as viewed

  // Method 1: Checkbox method
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  for (const checkbox of checkboxes) {
    const label = checkbox.nextElementSibling;
    if (label &&
      (label.textContent.includes('Mark as Viewed') ||
        label.textContent.includes('Completed') ||
        checkbox.id.includes('Complete') ||
        checkbox.name.includes('Complete'))) {
      if (!checkbox.checked) {
        checkbox.click();
        checkbox.checked = true;
        return {
          success: true,
          message: "Lecture marked as viewed",
          nextAction: "You can now proceed to next lecture"
        };
      } else {
        return {
          success: true,
          message: "Already marked as viewed",
          nextAction: "Lecture is already completed"
        };
      }
    }
  }

  // Method 2: Button method
  const buttons = document.querySelectorAll('button, input[type="button"], a.btn');
  for (const btn of buttons) {
    const btnText = btn.textContent || btn.value || btn.innerText;
    if (btnText &&
      (btnText.includes('Mark as Viewed') ||
        btnText.includes('Complete Lesson') ||
        btnText.includes('Finish Lecture'))) {
      btn.click();
      return {
        success: true,
        message: "Lecture marked as viewed",
        nextAction: "Page will update automatically"
      };
    }
  }

  // Method 3: VU specific buttons
  const vuButtons = [
    '#btnMarkAsComplete',
    '#btnComplete',
    '#MainContent_btnComplete',
    '[id*="Complete"]',
    '[onclick*="Complete"]'
  ];

  for (const selector of vuButtons) {
    const btn = document.querySelector(selector);
    if (btn) {
      btn.click();
      return {
        success: true,
        message: "Lecture marked as viewed",
        nextAction: "Please wait for confirmation"
      };
    }
  }

  return {
    success: false,
    message: "Could not find mark as viewed button"
  };
}

// Auto-detect page type on load
(function autoDetectPage() {
  const url = window.location.href;

  if (url.includes('GDB/StudentMessage.aspx')) {
    console.log('VU GDB page detected');
    // You could add auto-extraction here
  } else if (url.includes('Quiz/')) {
    console.log('VU Quiz page detected');
  } else if (url.includes('LessonViewer.aspx')) {
    console.log('VU Lecture page detected');
  }
})();