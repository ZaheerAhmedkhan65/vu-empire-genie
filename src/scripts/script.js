// script.js
document.addEventListener('DOMContentLoaded', async () => {
    console.log('VU Empire Genie Popup loaded');

    // Initialize all functionality
    await initPopup();
});

async function initPopup() {
    try {
        // Initialize page-specific actions
        await initPageActions();

        // Load and initialize settings
        await initSettings();

        console.log('Popup initialized successfully');
    } catch (error) {
        console.error('Error initializing popup:', error);
        showStatus('Error initializing: ' + error.message, 'error');
    }
}

async function initPageActions() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (tab && tab.url && tab.url.includes('vulms.vu.edu.pk')) {
            showPageActions(tab.url, tab.id);
        }
    } catch (error) {
        console.error('Error checking current page:', error);
    }
}

async function showPageActions(url, tabId) {
    const actionContainer = document.getElementById('page-actions');

    if (url.includes('LessonViewer.aspx')) {
        actionContainer.innerHTML = `
            <button class="page-action-btn" id="auto-skip-lecture">
                Auto Skip All Lectures
            </button>
            <button class="page-action-btn" id="skip-lecture">
                Skip This Lecture
            </button>
        `;

        // Add event listeners for lecture actions
        document.getElementById('skip-lecture')?.addEventListener('click', () => {
            executeOnTab(tabId, 'skipLecture');
        });

        document.getElementById('auto-skip-lecture')?.addEventListener('click', () => {
            executeOnTab(tabId, 'autoSkipLectures');
        });

    } else if (url.includes('Quiz/') || url.includes('FormativeAssessment/')) {
        actionContainer.innerHTML = `
            <button class="page-action-btn" id="copy-quiz">
                Copy Quiz
            </button>
            <button class="page-action-btn secondary" id="solve-quiz">
                Solve with AI
            </button>
        `;

        // Add event listeners for quiz actions
        document.getElementById('copy-quiz')?.addEventListener('click', () => {
            executeOnTab(tabId, 'copyQuiz');
        });

        document.getElementById('solve-quiz')?.addEventListener('click', () => {
            executeOnTab(tabId, 'solveWithAI');
        });

    } else if (url.includes('GDB/StudentMessage.aspx')) {
        actionContainer.innerHTML = `
            <button class="page-action-btn" id="enable-copy">
                Enable Copy/Paste
            </button>
            <button class="page-action-btn secondary" id="solve-gdb">
                Solve with AI
            </button>
        `;

        // Add event listeners for GDB actions
        document.getElementById('enable-copy')?.addEventListener('click', () => {
            executeOnTab(tabId, 'enableCopyPaste');
        });

        document.getElementById('solve-gdb')?.addEventListener('click', () => {
            executeOnTab(tabId, 'solveGDBWithAI');
        });

    } else {
        actionContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; background: rgba(255,255,255,0.1); border-radius: 12px;">
                <div style="font-size: 36px; margin-bottom: 10px;">🎯</div>
                <div style="font-size: 14px; opacity: 0.8;">Open a lecture, quiz, or GDB page for specific actions</div>
            </div>
        `;
    }
}

async function executeOnTab(tabId, action) {
    try {
        showStatus('Executing action...', 'info');

        // Try to execute script in the tab
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: (actionName) => {
                // Try to find the appropriate genie instance
                const genieInstance = window.vuLectureGenie || window.vuQuizGenie || window.vuGenieInstance;
                if (genieInstance && typeof genieInstance[actionName] === 'function') {
                    return genieInstance[actionName]();
                } else {
                    throw new Error(`Action ${actionName} not available on this page`);
                }
            },
            args: [action],
            world: 'MAIN' // Try MAIN world first
        });

        showStatus('Action executed successfully!', 'success');
    } catch (error) {
        console.error(`Error executing ${action}:`, error);
        showStatus(`Error: ${error.message}`, 'error');
    }
}

async function initSettings() {
    try {
        // Load saved settings
        const result = await chrome.storage.sync.get([
            'apiKey', 'autoSelect', 'autoSaveQuiz', 'enableCopyPaste', 'autoSkipAllLectures'
        ]);

        // Set form values
        document.getElementById('apiKey').value = result.apiKey || '';
        document.getElementById('autoSelect').checked = result.autoSelect !== false;
        document.getElementById('autoSaveQuiz').checked = result.autoSaveQuiz !== false;
        document.getElementById('enableCopyPaste').checked = result.enableCopyPaste !== false;
        document.getElementById('autoSkipAllLectures').checked = result.autoSkipAllLectures !== false;
        
        // Save settings button
        document.getElementById('saveBtn').addEventListener('click', saveSettings);

    } catch (error) {
        console.error('Error loading settings:', error);
        showStatus('Error loading settings', 'error');
    }
}

async function saveSettings() {
    try {
        const apiKey = document.getElementById('apiKey').value.trim();
        const autoSelect = document.getElementById('autoSelect').checked;
        const autoSaveQuiz = document.getElementById('autoSaveQuiz').checked;
        const enableCopyPaste = document.getElementById('enableCopyPaste').checked;
        const autoSkipAllLectures = document.getElementById('autoSkipAllLectures').checked;

        // Validate API key format (optional)
        if (apiKey && !apiKey.startsWith('AIza')) {
            if (!confirm('API key format looks unusual. Are you sure this is correct?')) {
                return;
            }
        }

        // Save to Chrome storage
        await chrome.storage.sync.set({
            apiKey,
            autoSelect,
            autoSaveQuiz,
            enableCopyPaste,
            autoSkipAllLectures
        });

        // Also store in localStorage for fallback on current VU page
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab?.url?.includes('vulms.vu.edu.pk')) {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: (key, settings) => {
                        console.log('Saving settings to localStorage...', settings);
                        localStorage.setItem('vuGenie_apiKey', key);
                        localStorage.setItem('vuGenie_settings', JSON.stringify(settings));
                        console.log('Settings saved to localStorage');

                        // Update any active genie instance
                        const genieInstance = window.vuLectureGenie || window.vuQuizGenie || window.vuGenieInstance;
                        if (genieInstance) {
                            genieInstance.apiKey = key;
                            genieInstance.settings = settings;
                            console.log('Updated active genie instance with new settings');
                        }
                    },
                    args: [apiKey, { autoSelect, autoSaveQuiz, enableCopyPaste, autoSkipAllLectures }],
                    world: 'MAIN'
                });
            }
        } catch (injectionError) {
            console.log('Could not inject into page:', injectionError);
            // Continue anyway - this is just a fallback
        }

        showStatus('✅ Settings saved successfully!', 'success');

        // Clear success message after 3 seconds
        setTimeout(() => {
            const statusEl = document.getElementById('status');
            if (statusEl && statusEl.classList.contains('success')) {
                statusEl.style.display = 'none';
            }
        }, 3000);

    } catch (error) {
        console.error('Error saving settings:', error);
        showStatus('❌ Error saving settings: ' + error.message, 'error');
    }
}

function openTab(path) {
    chrome.tabs.create({ url: `https://vulms.vu.edu.pk/${path}` });
}

function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('status');
    if (!statusEl) return;

    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    statusEl.style.display = 'block';

    // Auto-hide info messages after 2 seconds, others after 4 seconds
    const hideTime = type === 'info' ? 2000 : 4000;
    setTimeout(() => {
        statusEl.style.display = 'none';
    }, hideTime);
}

// Add some utility functions
function getCurrentTab() {
    return chrome.tabs.query({ active: true, currentWindow: true })
        .then(([tab]) => tab)
        .catch(error => {
            console.error('Error getting current tab:', error);
            return null;
        });
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received in popup:', request);

    switch (request.type) {
        case 'ACTION_COMPLETE':
            showStatus(request.message, 'success');
            break;
        case 'ACTION_ERROR':
            showStatus(request.message, 'error');
            break;
    }

    sendResponse({ received: true });
});