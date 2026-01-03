// popup.js
document.addEventListener('DOMContentLoaded', () => {
  const actionButtons = {
    'open-lecture': () => openTab('LessonViewer.aspx'),
    'open-quiz': () => openTab('Quiz/'),
    'open-gdb': () => openTab('GDB/StudentMessage.aspx'),
    'open-settings': () => chrome.runtime.openOptionsPage()
  };

  // Attach button listeners
  Object.entries(actionButtons).forEach(([id, action]) => {
    const button = document.getElementById(id);
    if (button) {
      button.addEventListener('click', action);
    }
  });

  // Check current page and show relevant actions
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab.url.includes('vulms.vu.edu.pk')) {
      showPageActions(tab.url);
    }
  });

  function openTab(path) {
    chrome.tabs.create({ url: `https://vulms.vu.edu.pk/${path}` });
  }

  function showPageActions(url) {
    const actionContainer = document.getElementById('page-actions');

    if (url.includes('LessonViewer.aspx')) {
      actionContainer.innerHTML = `
        <button class="action-btn" id="mark-watched">Mark Lecture Watched</button>
      `;
    } else if (url.includes('Quiz/')) {
      actionContainer.innerHTML = `
        <button class="action-btn" id="copy-quiz">Copy Quiz</button>
        <button class="action-btn" id="solve-quiz">Solve with AI</button>
      `;
    }
  }
});