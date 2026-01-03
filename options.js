// options.js
document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('api-key');
  const saveButton = document.getElementById('save-button');
  const statusMessage = document.getElementById('status-message');

  // Load saved settings
  chrome.storage.sync.get(['apiKey'], (result) => {
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
    }
  });

  saveButton.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
      showStatus('Please enter an API key', 'error');
      return;
    }

    chrome.storage.sync.set({ apiKey }, () => {
      showStatus('Settings saved successfully!', 'success');

      // Close options page after delay
      setTimeout(() => {
        window.close();
      }, 1500);
    });
  });

  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.classList.add(`${type}`);
    statusMessage.style.display = 'block';
  }
});