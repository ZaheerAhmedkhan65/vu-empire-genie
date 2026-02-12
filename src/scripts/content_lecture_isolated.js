// ISOLATED world – can use chrome.runtime
window.addEventListener('vu-genie-settings-update', (event) => {
    const { settings } = event.detail;
    // Send to background to save to chrome.storage and broadcast
    chrome.runtime.sendMessage({
        type: 'SAVE_SETTINGS',
        settings
    }).catch(err => console.warn('Failed to send settings update:', err));
});