// script.js
import settingsManager from './settings_manager.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('VU Empire Genie Popup loaded');

    // Initialize settings manager
    await settingsManager.initialize();

    // Initialize all functionality
    await initPopup();
});

async function initPopup() {
    try {
        // Initialize page-specific actions
        await initPageActions();

        // Load and initialize settings
        await initSettingsUI();

        // Initialize API status
        await initApiStatus();

        console.log('Popup initialized successfully');
    } catch (error) {
        console.error('Error initializing popup:', error);
        showStatus('Error initializing: ' + error.message, 'error');
    }
}

async function initApiStatus() {
    try {
        // Show loading
        const loading = document.getElementById('api-status-loading');
        const message = document.getElementById('api-status-message');

        if (loading && message) {
            loading.style.display = 'block';

            // Check if API key is set
            const settings = settingsManager.getAll();
            const apiKey = settings.apiKey;

            // Hide loading, show message
            setTimeout(() => {
                loading.style.display = 'none';
                message.style.display = 'block';

                if (!apiKey) {
                    message.innerHTML = '<span class="status-icon">❌</span><span class="status-text">API key not set</span>';
                    message.style.color = '#ef4444';
                } else {
                    message.innerHTML = '<span class="status-icon">✅</span><span class="status-text">API ready</span>';
                    message.style.color = '#10b981';
                }
            }, 500);
        }
    } catch (error) {
        console.error('Error checking API status:', error);
    }
}

async function initSettingsUI() {
    try {
        // Get current settings
        const settings = settingsManager.getAll();

        // Set form values from settings
        document.getElementById('apiKey').value = settings.apiKey || '';
        document.getElementById('autoSelect').checked = settings.autoSelect !== false;
        document.getElementById('autoSaveQuiz').checked = settings.autoSaveQuiz !== false;
        document.getElementById('enableCopyPaste').checked = settings.enableCopyPaste !== false;
        document.getElementById('autoSkipAllLectures').checked = settings.autoSkipAllLectures !== false;
        document.getElementById('showSolution').checked = settings.showSolution !== false;
        document.getElementById('autoSolve').checked = settings.autoSolve === true;
        document.getElementById('autoSaveAfterSolve').checked = settings.autoSaveAfterSolve === true;

        // Add listener for settings changes
        settingsManager.addListener(updateSettingsUI);

        // Save settings button
        document.getElementById('saveBtn').addEventListener('click', saveSettings);

    } catch (error) {
        console.error('Error loading settings:', error);
        showStatus('Error loading settings', 'error');
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

async function initQuotaDisplay() {
    try {
        // Load quota data if available
        const settings = await chrome.storage.sync.get(['quotaData', 'lastQuotaUpdate']);

        if (settings.quotaData && settings.lastQuotaUpdate) {
        } else {
            // Fetch fresh quota data
            
        }

        // Add refresh button listener
        

    } catch (error) {
        console.error('Error initializing quota display:', error);
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
        // Get current settings
        const settings = settingsManager.getAll();

        // Set form values
        document.getElementById('apiKey').value = settings.apiKey || '';
        document.getElementById('autoSelect').checked = settings.autoSelect !== false;
        document.getElementById('autoSaveQuiz').checked = settings.autoSaveQuiz !== false;
        document.getElementById('enableCopyPaste').checked = settings.enableCopyPaste !== false;
        document.getElementById('autoSkipAllLectures').checked = settings.autoSkipAllLectures !== false;
        document.getElementById('showSolution').checked = settings.showSolution !== false;
        document.getElementById('autoSolve').checked = settings.autoSolve === true;
        document.getElementById('autoSaveAfterSolve').checked = settings.autoSaveAfterSolve === true;

        // Add listener for settings changes
        settingsManager.addListener(updateSettingsUI);

        // Save settings button
        document.getElementById('saveBtn').addEventListener('click', saveSettings);

    } catch (error) {
        console.error('Error loading settings:', error);
        showStatus('Error loading settings', 'error');
    }
}

function updateSettingsUI(settings) {
    console.log('Settings updated in UI:', settings);

    // Update form values without triggering change events
    document.getElementById('apiKey').value = settings.apiKey || '';
    document.getElementById('autoSelect').checked = settings.autoSelect !== false;
    document.getElementById('autoSaveQuiz').checked = settings.autoSaveQuiz !== false;
    document.getElementById('enableCopyPaste').checked = settings.enableCopyPaste !== false;
    document.getElementById('autoSkipAllLectures').checked = settings.autoSkipAllLectures !== false;
    document.getElementById('showSolution').checked = settings.showSolution !== false;
    document.getElementById('autoSolve').checked = settings.autoSolve === true;
    document.getElementById('autoSaveAfterSolve').checked = settings.autoSaveAfterSolve === true;
}

async function saveSettings() {
    try {
        // Collect all settings from the form
        const newSettings = {
            apiKey: document.getElementById('apiKey').value.trim(),
            autoSelect: document.getElementById('autoSelect').checked,
            autoSaveQuiz: document.getElementById('autoSaveQuiz').checked,
            enableCopyPaste: document.getElementById('enableCopyPaste').checked,
            autoSkipAllLectures: document.getElementById('autoSkipAllLectures').checked,
            showSolution: document.getElementById('showSolution').checked,
            autoSolve: document.getElementById('autoSolve').checked,
            autoSaveAfterSolve: document.getElementById('autoSaveAfterSolve').checked
        };

        // Validate API key format
        if (newSettings.apiKey && !newSettings.apiKey.startsWith('AIza')) {
            if (!confirm('API key format looks unusual. Are you sure this is correct?')) {
                return;
            }
        }

        // Save using centralized manager
        const success = await settingsManager.saveToStorage(newSettings);

        if (success) {
            showStatus('✅ Settings saved successfully!', 'success');

            // Refresh API status
            await initApiStatus();

            // Clear success message after 3 seconds
            setTimeout(() => {
                const statusEl = document.getElementById('status');
                if (statusEl && statusEl.classList.contains('success')) {
                    statusEl.style.display = 'none';
                }
            }, 3000);
        } else {
            showStatus('❌ Error saving settings', 'error');
        }

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