chrome.runtime.onInstalled.addListener(() => {
  // Set default settings
  chrome.storage.sync.set({
    geminiApiKey: "",
    currentType: "",
    autoHighlight: true
  });
});

// Listen for tab updates to handle quiz pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url.includes('vu.edu.pk')) {
    // Check if quiz type is active
    chrome.storage.local.get(["currentType"], (result) => {
      if (result.currentType === 'quiz') {
        // Auto-process quiz if on quiz page
        if (tab.url.includes('quiz') || tab.url.includes('question')) {
          setTimeout(() => {
            chrome.tabs.sendMessage(tabId, { type: "CHECK_QUIZ_PAGE" });
          }, 1000);
        }
      }
    });
  }
});