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
  console.log('Message received:', request.type, 'from tab:', sender.tab?.id);

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
        console.log("quizData", request.data)
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

        console.log("formattedData", formattedData)
        chrome.storage.local.set({ quizData }, () => {
          // saveQuizQuestionToServer(formattedData, sendResponse);
        });
        sendResponse({ success: true });
      });
      return true;

    case 'DOWNLOAD_GROUPED_PDF':
      (async () => {
        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

          const response = await chrome.tabs.sendMessage(tab.id, {
            type: 'GENERATE_GROUPED_PDF',
            data: request.data
          });
          console.log("DOWNLOAD_GROUPED_PDF response in background", response);
          if (response && response.success) {
            chrome.downloads.download({
              url: response.url,
              filename: request.filename,
              conflictAction: 'uniquify',
              saveAs: false
            }, (downloadId) => {
              if (chrome.runtime.lastError) {
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
              } else {
                sendResponse({ success: true, downloadId: downloadId });
              }
            });
          } else {
            sendResponse({
              success: false,
              error: response?.error || 'PDF generation failed'
            });
          }

        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true;
  }
});


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
      console.log('Quiz question saved to question bank:', result);
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
    console.log('VU page loaded:', tab.url);
  }
});