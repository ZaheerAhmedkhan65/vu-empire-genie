document.addEventListener("DOMContentLoaded", function () {
  const resultDiv = document.getElementById("result");
  const submitBtn = document.getElementById("submit");
  const selectType = document.getElementById("select-type");
  const changeTypeBtn = document.getElementById("change-type");

  // Check current URL and set default type
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab.url) {
      if (tab.url.includes('GDB/StudentMessage.aspx')) {
        selectType.value = "gdb";
      } else if (tab.url.includes('Quiz/StudentTakeQuiz.aspx') || tab.url.includes('Quiz/StudentQuiz.aspx')) {
        selectType.value = "quiz";
      } else if (tab.url.includes('LessonViewer.aspx')) {
        selectType.value = "lecture-view";
      }

      // Save current type
      if (selectType.value) {
        chrome.storage.local.set({ currentType: selectType.value });
      }
    }
  });

  // Load saved type
  chrome.storage.local.get(["currentType"], function (result) {
    if (result.currentType && !selectType.value) {
      selectType.value = result.currentType;
    }
  });

  changeTypeBtn.addEventListener("click", function () {
    chrome.storage.local.remove(["currentType"], function () {
      resultDiv.innerHTML = "Type reset. Please select a new type and submit.";
      selectType.value = "";
    });
  });

  submitBtn.addEventListener("click", async () => {
    const selectedType = selectType.value;

    if (!selectedType) {
      resultDiv.innerHTML = "Please select an option.";
      return;
    }

    // Save current type
    chrome.storage.local.set({ currentType: selectedType });

    // Check if on correct page
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      const url = tab.url;

      if (selectedType === "gdb" && !url.includes("GDB/StudentMessage.aspx")) {
        resultDiv.innerHTML = "Please navigate to a GDB page first:<br>https://vulms.vu.edu.pk/GDB/StudentMessage.aspx";
        return;
      }

      if (selectedType === "quiz" && !url.includes("Quiz/")) {
        resultDiv.innerHTML = "Please navigate to a Quiz page first.";
        return;
      }

      if (selectedType === "lecture-view" && !url.includes("LessonViewer.aspx")) {
        resultDiv.innerHTML = "Please navigate to a Lecture page first:<br>https://vulms.vu.edu.pk/LessonViewer.aspx";
        return;
      }

      // Proceed with selected action
      executeSelectedAction(selectedType);
    });
  });

  async function executeSelectedAction(selectedType) {
    switch (selectedType) {
      case "gdb":
        await handleGDB();
        break;
      case "quiz":
        await handleQuiz();
        break;
      case "lecture-view":
        await handleLectureView();
        break;
      default:
        resultDiv.innerHTML = "Invalid option selected.";
    }
  }

  async function handleGDB() {
    resultDiv.innerHTML = '<div class="loading"><div class="loader"></div>Extracting GDB content...</div>';

    chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      }, async () => {
        try {
          const response = await chrome.tabs.sendMessage(
            tab.id,
            { type: "GET_GDB_CONTENT" }
          );

          if (response && response.content) {
            await processGDBContent(response.content);
          } else {
            resultDiv.innerHTML = "Could not find GDB content.";
          }
        } catch (error) {
          console.error("Error:", error);
          resultDiv.innerHTML = "Error extracting GDB content.";
        }
      });
    });
  }

  async function processGDBContent(content) {
    resultDiv.innerHTML = '<div class="loading"><div class="loader"></div>Generating solution with Gemini...</div>';

    chrome.storage.sync.get(["geminiApiKey"], async (result) => {
      if (!result.geminiApiKey) {
        resultDiv.innerHTML = "API key not found. Please set your API key in the extension options.";
        return;
      }

      try {
        const solution = await getGeminiResponse(content, "gdb", result.geminiApiKey);
        displayGDBResult(solution);

        // Auto-fill CKEDITOR if on GDB page
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
          chrome.tabs.sendMessage(tab.id, {
            type: "FILL_CKEDITOR",
            content: solution
          });
        });
      } catch (error) {
        resultDiv.innerHTML = `Error: ${error.message}`;
      }
    });
  }

  async function handleQuiz() {
    resultDiv.innerHTML = '<div class="loading"><div class="loader"></div>Processing quiz question...</div>';

    chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      }, async () => {
        try {
          const response = await chrome.tabs.sendMessage(
            tab.id,
            { type: "PROCESS_QUIZ" }
          );

          if (response && response.question) {
            if (response.needsAI) {
              await processQuizWithAI(response);
            } else {
              displayQuizResult(response);
            }
          } else {
            resultDiv.innerHTML = "Could not find quiz question.";
          }
        } catch (error) {
          console.error("Error:", error);
          resultDiv.innerHTML = "Error processing quiz.";
        }
      });
    });
  }

  async function processQuizWithAI(quizData) {
    resultDiv.innerHTML = '<div class="loading"><div class="loader"></div>Analyzing with Gemini...</div>';

    chrome.storage.sync.get(["geminiApiKey"], async (result) => {
      if (!result.geminiApiKey) {
        resultDiv.innerHTML = "API key not found. Please set your API key in the extension options.";
        return;
      }

      try {
        // Format the prompt with question and options
        const prompt = `Analyze this Virtual University quiz question and determine the correct answer:

Course: ${quizData.courseName || quizData.courseCode || "Unknown Course"}

Question: ${quizData.question}

Options:
${quizData.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n')}

Requirements:
1. Provide the correct option letter (A, B, C, or D)
2. Brief explanation why it's correct
3. If multiple answers could be correct, choose the most accurate one
4. Consider the course context: ${quizData.courseName || quizData.courseCode || "General knowledge"}

Format your response as:
Correct Answer: [Letter]
Explanation: [Brief explanation]`;

        const aiResponse = await getGeminiResponse(prompt, "quiz", result.geminiApiKey);

        // Parse AI response
        const parsedResponse = parseAIQuizResponse(aiResponse, quizData.options);

        // Update quiz data with AI results
        quizData.correctAnswer = parsedResponse.correctAnswer;
        quizData.explanation = parsedResponse.explanation;
        quizData.aiResponse = aiResponse;

        displayQuizResult(quizData);
      } catch (error) {
        resultDiv.innerHTML = `Error: ${error.message}`;
      }
    });
  }

  function parseAIQuizResponse(aiResponse, options) {
    // Extract correct answer letter
    const letterMatch = aiResponse.match(/Correct Answer:\s*([A-D])/i) ||
      aiResponse.match(/Answer:\s*([A-D])/i) ||
      aiResponse.match(/Option\s*([A-D])/i) ||
      aiResponse.match(/[^A-Z]([A-D])[^A-Z]/);

    let correctAnswer = letterMatch ? letterMatch[1] : null;

    // Extract explanation
    let explanation = "";
    const explanationMatch = aiResponse.match(/Explanation:\s*(.+?)(?=\n\n|$)/is);
    if (explanationMatch) {
      explanation = explanationMatch[1].trim();
    } else {
      // Try to find explanation after the answer
      const lines = aiResponse.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('Explanation') || lines[i].includes('explanation')) {
          explanation = lines.slice(i + 1).join('\n').trim();
          break;
        }
      }
      if (!explanation) {
        explanation = aiResponse.substring(aiResponse.indexOf('\n')).trim();
      }
    }

    // If we have a letter, get the full option text
    if (correctAnswer && options) {
      const index = correctAnswer.charCodeAt(0) - 65;
      if (index >= 0 && index < options.length) {
        correctAnswer = `${correctAnswer}. ${options[index]}`;
      }
    }

    return {
      correctAnswer: correctAnswer || "Could not determine",
      explanation: explanation || "No explanation provided by AI",
      rawResponse: aiResponse
    };
  }

  function displayQuizResult(quizData) {
    let resultHTML = `
<div class="quiz-result">
  <h3>Quiz Solution</h3>`;

    if (quizData.courseCode && quizData.courseCode !== 'UNKNOWN') {
      resultHTML += `<div class="course-info">
      <strong>Course:</strong> ${quizData.courseCode} - ${quizData.courseName || ''}
    </div>`;
    }

    resultHTML += `
    <div class="question-text">${quizData.question || ""}</div>`;

    if (quizData.options && quizData.options.length > 0) {
      resultHTML += `<div class="options"><strong>Options:</strong><ul>`;
      quizData.options.forEach((option, index) => {
        const optionLetter = String.fromCharCode(65 + index);
        const isCorrect = quizData.correctAnswer &&
          (quizData.correctAnswer.includes(option) ||
            quizData.correctAnswer.startsWith(optionLetter));
        resultHTML += `<li class="${isCorrect ? 'correct' : ''}">
        <span class="option-letter">${optionLetter}.</span> ${option}
      </li>`;
      });
      resultHTML += `</ul></div>`;
    }

    if (quizData.correctAnswer) {
      resultHTML += `<div class="correct-answer">
      <strong>Correct Answer:</strong> ${quizData.correctAnswer}
    </div>`;
    }

    if (quizData.explanation) {
      resultHTML += `<div class="explanation"><strong>Explanation:</strong> ${quizData.explanation}</div>`;
    }

    // Add copy button for the entire quiz
    resultHTML += `
    <div class="actions">
      <button id="copy-quiz" class="copy-btn">Copy Quiz Text</button>
      <button id="highlight-quiz" class="highlight-btn">Highlight on Page</button>
      <button id="select-answer" class="select-btn">Select Answer</button>
    </div>
  </div>`;

    resultDiv.innerHTML = resultHTML;

    // Add copy functionality
    document.getElementById("copy-quiz").addEventListener("click", function () {
      const quizText = formatQuizForCopy(quizData);
      navigator.clipboard.writeText(quizText).then(() => {
        const btn = this;
        btn.textContent = "✓ Copied!";
        setTimeout(() => {
          btn.textContent = "Copy Quiz Text";
        }, 2000);
      });
    });

    // Add highlight functionality
    document.getElementById("highlight-quiz").addEventListener("click", function () {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        chrome.tabs.sendMessage(tab.id, { type: "HIGHLIGHT_CORRECT_ANSWER" });
      });
    });

    // Add select answer functionality
    document.getElementById("select-answer").addEventListener("click", function () {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        chrome.tabs.sendMessage(tab.id, {
          type: "SELECT_CORRECT_ANSWER",
          answer: quizData.correctAnswer
        });
      });
    });
  }

  function formatQuizForCopy(quizData) {
    let text = `Quiz Question\n`;
    text += `Course: ${quizData.courseCode || ''} ${quizData.courseName || ''}\n\n`;
    text += `Question: ${quizData.question}\n\n`;
    text += `Options:\n`;
    quizData.options.forEach((opt, i) => {
      text += `${String.fromCharCode(65 + i)}. ${opt}\n`;
    });
    text += `\nCorrect Answer: ${quizData.correctAnswer || ''}\n`;
    if (quizData.explanation) {
      text += `Explanation: ${quizData.explanation}\n`;
    }
    return text;
  }

  async function handleLectureView() {
    resultDiv.innerHTML = '<div class="loading"><div class="loader"></div>Marking lecture as viewed...</div>';

    chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      }, async () => {
        try {
          const response = await chrome.tabs.sendMessage(
            tab.id,
            { type: "MARK_LECTURE_VIEWED" }
          );

          if (response && response.success) {
            resultDiv.innerHTML = `
              <div class="success">
                <h3>✓ Lecture Marked as Viewed</h3>
                <p>The lecture has been marked as completed.</p>
                ${response.nextAction ? `<p><strong>Next:</strong> ${response.nextAction}</p>` : ''}
              </div>
            `;
          } else {
            resultDiv.innerHTML = "Could not mark lecture. The button may not be available.";
          }
        } catch (error) {
          console.error("Error:", error);
          resultDiv.innerHTML = "Error marking lecture.";
        }
      });
    });
  }

  function displayGDBResult(solution) {
    const formattedSolution = `
<div class="gdb-solution">
  <div class="header">
    <h3>GDB Solution</h3>
    <div class="actions">
      <button id="copy-gdb" class="copy-btn">Copy Solution</button>
      <button id="fill-editor" class="fill-btn">Auto-fill Editor</button>
    </div>
  </div>
  <div class="solution-content">
    ${formatMarkdown(solution)}
  </div>
  <div class="instructions">
    <p><strong>✓ Solution generated and auto-filled in CKEDITOR</strong></p>
    <p>You can also copy the formatted solution above or edit it directly in the editor.</p>
  </div>
</div>`;

    resultDiv.innerHTML = formattedSolution;

    // Add copy functionality
    document.getElementById("copy-gdb").addEventListener("click", function () {
      const text = document.querySelector(".solution-content").innerText;
      navigator.clipboard.writeText(text).then(() => {
        const btn = this;
        btn.textContent = "Copied!";
        setTimeout(() => {
          btn.textContent = "Copy Solution";
        }, 2000);
      });
    });

    // Add fill editor functionality
    document.getElementById("fill-editor").addEventListener("click", function () {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        chrome.tabs.sendMessage(tab.id, {
          type: "FILL_CKEDITOR",
          content: solution
        });
        this.textContent = "✓ Filled!";
        setTimeout(() => {
          this.textContent = "Auto-fill Editor";
        }, 2000);
      });
    });
  }

  function formatMarkdown(text) {
    // Convert markdown to HTML for display
    return text
      .replace(/^# (.*$)/gm, '<h4>$1</h4>')
      .replace(/^## (.*$)/gm, '<h5>$1</h5>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^\* (.*$)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  }

  function displayQuizResult(quizData) {
    let resultHTML = `
<div class="quiz-result">
  <h3>Quiz Solution</h3>
  <div class="question-header">
    <strong>${quizData.questionHeader || "Question"}</strong>
  </div>
  <div class="question-text">${quizData.question || ""}</div>`;

    if (quizData.options && quizData.options.length > 0) {
      resultHTML += `<div class="options"><strong>Options:</strong><ul>`;
      quizData.options.forEach((option, index) => {
        const optionLetter = String.fromCharCode(65 + index);
        const isCorrect = quizData.correctAnswer &&
          (option.includes(quizData.correctAnswer) ||
            quizData.correctAnswer.includes(option) ||
            quizData.correctAnswer === optionLetter);
        resultHTML += `<li class="${isCorrect ? 'correct' : ''}">
          <span class="option-letter">${optionLetter}.</span> ${option}
        </li>`;
      });
      resultHTML += `</ul></div>`;
    }

    if (quizData.correctAnswer) {
      resultHTML += `<div class="correct-answer">
        <strong>Correct Answer:</strong> ${quizData.correctAnswer}
      </div>`;
    }

    if (quizData.explanation) {
      resultHTML += `<div class="explanation"><strong>Explanation:</strong> ${quizData.explanation}</div>`;
    }

    resultHTML += `
      <div class="actions">
        <button id="highlight-quiz" class="highlight-btn">Highlight on Page</button>
        <button id="select-answer" class="select-btn">Select Answer</button>
      </div>
    </div>`;

    resultDiv.innerHTML = resultHTML;

    // Add highlight functionality
    document.getElementById("highlight-quiz").addEventListener("click", function () {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        chrome.tabs.sendMessage(tab.id, { type: "HIGHLIGHT_CORRECT_ANSWER" });
      });
    });

    // Add select answer functionality
    document.getElementById("select-answer").addEventListener("click", function () {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        chrome.tabs.sendMessage(tab.id, {
          type: "SELECT_CORRECT_ANSWER",
          answer: quizData.correctAnswer
        });
      });
    });
  }
});

async function getGeminiResponse(content, type, apiKey) {
  let prompt = "";

  if (type === "gdb") {
    prompt = `You are an expert academic assistant for Virtual University of Pakistan. Generate a well-structured solution for the following GDB (Graded Discussion Board) question.

**GDB Question:**
${content}

**Requirements:**
1. Provide a comprehensive answer addressing all aspects
2. Use proper academic formatting
3. Include key points in bullet format where appropriate
4. Use professional tone suitable for university discussion
5. If examples or references are needed, include them
6. Format with markdown using **bold**, *italic*, and lists

**Format the response with markdown for easy copy-pasting into CKEDITOR.**`;
  } else if (type === "quiz") {
    prompt = `Analyze this quiz question and determine the correct answer:

${content}

Provide:
1. The correct answer letter (A, B, C, or D)
2. Brief explanation why it's correct
3. If multiple choice, identify the correct option

Be concise and accurate.`;
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error?.message || "API request failed");
    }

    const data = await res.json();
    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response generated."
    );
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate response. Please try again.");
  }
}