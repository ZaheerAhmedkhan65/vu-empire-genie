// background.js
import settingsManager from './scripts/settings_manager.js';

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install' || reason === 'update') {
    await settingsManager.initialize();

    const apiKey = settingsManager.get('apiKey');
    if (!apiKey) {
      chrome.runtime.openOptionsPage();
    }
  }
});

// Handle messages from both MAIN and ISOLATED worlds
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'OPEN_OPTIONS':
      chrome.runtime.openOptionsPage();
      sendResponse({ success: true });
      break;

    case 'GET_API_KEY':
      sendResponse({ apiKey: settingsManager.get('apiKey') });
      return true;

    case 'GET_SETTINGS':
      sendResponse(settingsManager.getAll());
      return true;

    case 'SAVE_SETTINGS':
      settingsManager.saveToStorage(request.settings)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'SAVE_QUIZ_DATA':
      chrome.storage.local.get(['quizData'], (result) => {
        const quizData = result.quizData || [];
        quizData.push(request.data);
        const formattedData = {
          courseCode: request.data.courseCode,
          courseName: request.data.courseName,
          studentName: request.data.studentName,
          studentId: request.data.studentId,
          question: request.data.question,
          explanation: request.data.solution?.explanation || '',
          url: request.data.url,
          timestamp: request.data.timestamp,
          options: request.data.options.map(opt => ({
            letter: opt.letter,
            text: opt.text,
            index: opt.index,
            isCorrect: opt.letter === request.data.solution?.correctAnswers?.[0]
          }))
        };

        chrome.storage.local.set({ quizData }, () => {
          saveQuizQuestionToServer(formattedData, sendResponse);
        });
        sendResponse({ success: true });
      });
      return true;

    case 'DOWNLOAD_QUIZ_GROUP':
      handleDownloadQuizGroup(request.data, sendResponse);
      return true;
  }
});

async function handleDownloadQuizGroup(data, sendResponse) {
  try {
    const { quizzes, groupInfo } = data;

    // Deduplicate questions by normalized text
    const seen = new Set();
    const uniqueQuizzes = quizzes.filter(q => {
      const norm = normalizeQuestionText(q.question);
      if (seen.has(norm)) return false;
      seen.add(norm);
      return true;
    });

    const html = generateQuizHTML(uniqueQuizzes, groupInfo);

    // Convert HTML to a base64 data URL
    const base64 = btoa(unescape(encodeURIComponent(html))); // UTF-8 safe
    const dataUrl = `data:text/html;charset=utf-8;base64,${base64}`;

    const filename = `VU_Quiz_${groupInfo.courseCode}_${groupInfo.studentId}_${Date.now()}.html`;

    chrome.downloads.download({
      url: dataUrl,
      filename: filename,
      conflictAction: 'uniquify',
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, downloadId });
      }
    });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

function normalizeQuestionText(text) {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

function generateQuizHTML(quizzes, groupInfo) {
  const style = `
    <style>
      body {font-family: 'Segoe UI', Arial, sans-serif; max-width: 250mm; margin: 10px auto 20px; padding: 10px; background: #f5f5f5; color: #333; line-height: 1.6;}
      .print-container {padding: 5mm 10mm;}
      .controls {text-align: center; margin: 20px 0;padding: 15px;background: #e8f4fc;border-radius: 8px;}
      .print-btn{background: #004080; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;}
      h2 { color: #2c3e50; }
      .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
      .quiz-item { margin-bottom: 10px; padding: 10px 5px; border: 1px solid #ddd; }
      .question { font-weight: bold; margin-bottom: 10px; }
      .options { margin-left: 20px; }
      .correct { color: #27ae60; font-weight: bold; }
      .explanation { margin-top: 10px; font-style: italic; color: #7f8c8d; background-color: #ffff0070; padding: 10px; border-radius: 10px; }
      hr { border: 1px solid #eee; }
    </style>
  `;

  let html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Quiz Report</title>${style}</head>
<body>
  <div class="print-container">
  <h2>${groupInfo.courseName}</h2>
  <div class="header">
    <strong>${groupInfo.studentName} (${groupInfo.studentId})</strong>
    <p>${new Date(groupInfo.timestamp).toLocaleString()}</p>
  </div>
  <hr>`;

  html+=`
  <div class="controls no-print">
    <button class="print-btn" onclick="window.print()">
        🖨️ Print to PDF
    </button>
    <p style="margin-top: 10px; color: #666; font-size: 14px;">
        Click the button above, then choose "Save as PDF" in the print dialog
    </p>
  </div>
  `

  quizzes.forEach((quiz, idx) => {
    const correctLetter = quiz.solution?.correctAnswers?.[0] || '';
    html += `<div class="quiz-item">
      <div class="question">Q${idx + 1}: ${quiz.question}</div>
      <div class="options">`;

    quiz.options.forEach(opt => {
      const isCorrect = opt.letter === correctLetter;
      html += `<div ${isCorrect ? 'class="correct"' : ''}>${opt.letter}. ${opt.text}</div>`;
    });

    if (quiz.solution?.explanation) {
      html += `<div class="explanation"><strong>Explanation: </strong>${quiz.solution.explanation}</div>`;
    }

    html += `</div></div>`;
  });

  html += `</div></body></html>`;
  return html;
}

async function saveQuizQuestionToServer(formattedData, sendResponse) {
  try {
    const { serverUrl } = await chrome.storage.sync.get(['serverUrl']);
    const baseUrl = serverUrl || 'https://vu-empire-genie.vercel.app';
    const response = await fetch(`${baseUrl}/api/quiz/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quizData: [formattedData]
      })
    });

    const result = await response.json();
    if (response.ok && result.success) {
      sendResponse({
        success: true,
        message: 'Question added to question bank',
        serverResponse: result
      });
    } else {
      console.error('Failed to save quiz question:', result);
      sendResponse({
        success: false,
        error: result.message || 'Failed to save question',
        serverResponse: result
      });
    }
  } catch (error) {
    console.error('Error saving quiz question:', error);
    sendResponse({
      success: false,
      error: 'Network error or server unavailable',
      details: error.message
    });
  }
}

// Dynamic injection for other VU pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('vulms.vu.edu.pk')) {
    // You can add dynamic injection logic here if needed
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'EXTRACT_STUDENT_INFO':
      handleStudentInfoExtraction(request, sender, sendResponse);
      return true;

    case 'GET_STUDENT_INFO':
      handleGetStudentInfo(request, sender, sendResponse);
      return true;
  }
});

// Handle student info extraction
async function handleStudentInfoExtraction(request, sender, sendResponse) {
  try {
    const studentInfo = request.studentInfo;

    // Save to localStorage
    await chrome.storage.local.set({ studentInfo });

    // Save to sync storage
    await chrome.storage.sync.set({ studentInfo });

    sendResponse({ success: true, studentInfo });
  } catch (error) {
    console.error('Error saving student info:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle getting student info
async function handleGetStudentInfo(request, sender, sendResponse) {
  try {
    const result = await chrome.storage.local.get(['studentInfo']);
    const studentInfo = result.studentInfo;

    if (studentInfo) {
      sendResponse({ success: true, studentInfo });
    } else {
      sendResponse({ success: false, error: 'No student info found' });
    }
  } catch (error) {
    console.error('Error getting student info:', error);
    sendResponse({ success: false, error: error.message });
  }
}
