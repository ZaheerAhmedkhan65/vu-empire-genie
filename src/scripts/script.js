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

        // Initialize quota display
        await initQuotaDisplay();

        console.log('Popup initialized successfully');
    } catch (error) {
        console.error('Error initializing popup:', error);
        showStatus('Error initializing: ' + error.message, 'error');
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

        // Update API key status
        updateApiKeyStatus(settings.apiKey);

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
            displayQuotaData(settings.quotaData, settings.lastQuotaUpdate);
        } else {
            // Fetch fresh quota data
            await fetchAndDisplayQuota();
        }

        // Add refresh button listener
        document.getElementById('refresh-quota').addEventListener('click', async () => {
            await refreshQuota();
        });

    } catch (error) {
        console.error('Error initializing quota display:', error);
        showQuotaError('Failed to load quota data');
    }
}

async function refreshQuota() {
    const refreshBtn = document.getElementById('refresh-quota');
    const originalText = refreshBtn.textContent;

    refreshBtn.disabled = true;
    refreshBtn.textContent = 'Refreshing...';

    try {
        await fetchAndDisplayQuota();
    } catch (error) {
        console.error('Error refreshing quota:', error);
        showQuotaError('Failed to refresh quota');
    } finally {
        refreshBtn.disabled = false;
        refreshBtn.textContent = originalText;
    }
}

async function fetchAndDisplayQuota() {
    const loadingElement = document.getElementById('quota-loading');

    // Show loading
    if (loadingElement) loadingElement.style.display = 'block';

    try {
        // Get API key first
        const settings = await chrome.storage.sync.get(['apiKey']);
        const apiKey = settings.apiKey;

        if (!apiKey) {
            showQuotaError('API key not set');
            return;
        }

        // Fetch quota information
        const quotaData = await getGeminiQuota(apiKey);

        // Save quota data
        const lastQuotaUpdate = new Date().toISOString();
        await chrome.storage.sync.set({
            quotaData: quotaData,
            lastQuotaUpdate: lastQuotaUpdate
        });

        // Display quota data
        displayQuotaData(quotaData, lastQuotaUpdate);

    } catch (error) {
        console.error('Error fetching quota:', error);
        showQuotaError('Failed to fetch quota information');
    } finally {
        if (loadingElement) loadingElement.style.display = 'none';
    }
}

async function getGeminiQuota(apiKey) {
    try {
        // Check API key validity by making a simple models request
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {

                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`API Key Error: ${response.status}`);
        }

        // Get usage data from local storage
        const usageData = await chrome.storage.local.get(['apiUsage']);
        const usage = usageData.apiUsage || {
            totalRequests: 0,
            totalCharacters: 0,
            dailyRequests: {},
            lastUpdated: null
        };

        const today = new Date().toDateString();
        const todayUsage = usage.dailyRequests[today] || { requests: 0, characters: 0 };

        // Gemini free tier limits (adjust based on actual limits)
        const dailyRequestLimit = 60; // 60 requests per day for free tier
        const dailyCharacterLimit = 60000; // ~60K characters per day
        const minuteLimit = 15; // 15 requests per minute

        // Calculate minute usage (this is approximate)
        const minuteUsage = Math.floor(Math.random() * 5); // Mock data - in production, track this properly

        return {
            requestsPerDay: {
                used: todayUsage.requests,
                limit: dailyRequestLimit
            },
            charactersPerDay: {
                used: todayUsage.characters,
                limit: dailyCharacterLimit
            },
            requestsPerMinute: {
                used: minuteUsage,
                limit: minuteLimit
            },
            totalRequests: usage.totalRequests,
            totalCharacters: usage.totalCharacters,
            lastReset: getStartOfDay(),
            nextReset: getEndOfDay()
        };

    } catch (error) {
        console.error('Error checking Gemini quota:', error);
        throw error;
    }
}

function displayQuotaData(quotaData, lastUpdated) {
    const quotaContainer = document.getElementById('quota-container');
    const lastUpdatedElement = document.getElementById('last-updated');

    if (!quotaContainer) return;

    // Format last updated time
    if (lastUpdatedElement && lastUpdated) {
        const timeAgo = getTimeAgo(new Date(lastUpdated));
        lastUpdatedElement.textContent = `Last updated: ${timeAgo}`;
    }

    // Create quota display HTML
    let html = '';

    // Daily Requests
    const requestPercent = (quotaData.requestsPerDay.used / quotaData.requestsPerDay.limit) * 100;
    const requestFillClass = getFillClass(requestPercent);

    html += `
        <div class="quota-item">
            <div class="quota-header">
                <div class="quota-label">
                    <span>📊</span> Daily Requests
                </div>
                <div class="quota-value">
                    ${quotaData.requestsPerDay.used}/${quotaData.requestsPerDay.limit}
                </div>
            </div>
            <div class="quota-bar">
                <div class="quota-fill ${requestFillClass}" style="width: ${Math.min(requestPercent, 100)}%"></div>
            </div>
            <div class="usage-info">
                <span class="usage-percent">${Math.round(requestPercent)}% used</span>
                <span class="usage-limit">Resets in ${getTimeUntilReset(quotaData.nextReset)}</span>
            </div>
        </div>
    `;

    // Daily Characters
    const charPercent = (quotaData.charactersPerDay.used / quotaData.charactersPerDay.limit) * 100;
    const charFillClass = getFillClass(charPercent);

    html += `
        <div class="quota-item">
            <div class="quota-header">
                <div class="quota-label">
                    <span>📝</span> Daily Characters
                </div>
                <div class="quota-value">
                    ${formatNumber(quotaData.charactersPerDay.used)}/${formatNumber(quotaData.charactersPerDay.limit)}
                </div>
            </div>
            <div class="quota-bar">
                <div class="quota-fill ${charFillClass}" style="width: ${Math.min(charPercent, 100)}%"></div>
            </div>
            <div class="usage-info">
                <span class="usage-percent">${Math.round(charPercent)}% used</span>
                <span class="usage-limit">~${formatNumber(quotaData.charactersPerDay.limit - quotaData.charactersPerDay.used)} remaining</span>
            </div>
        </div>
    `;

    // Per Minute Requests
    const minutePercent = (quotaData.requestsPerMinute.used / quotaData.requestsPerMinute.limit) * 100;
    const minuteFillClass = getFillClass(minutePercent);

    html += `
        <div class="quota-item">
            <div class="quota-header">
                <div class="quota-label">
                    <span>⚡</span> Requests/Minute
                </div>
                <div class="quota-value">
                    ${quotaData.requestsPerMinute.used}/${quotaData.requestsPerMinute.limit}
                </div>
            </div>
            <div class="quota-bar">
                <div class="quota-fill ${minuteFillClass}" style="width: ${Math.min(minutePercent, 100)}%"></div>
            </div>
            <div class="usage-info">
                <span class="usage-percent">${Math.round(minutePercent)}% used</span>
                <span class="usage-limit">Resets every minute</span>
            </div>
        </div>
    `;

    // Total Usage Summary
    html += `
        <div class="quota-item" style="border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 10px; margin-top: 10px;">
            <div style="font-size: 10px; opacity: 0.7; text-align: center;">
                Total: ${quotaData.totalRequests} requests • ${formatNumber(quotaData.totalCharacters)} chars
            </div>
        </div>
    `;

    quotaContainer.innerHTML = html;
}

function getFillClass(percent) {
    if (percent >= 90) return 'danger';
    if (percent >= 75) return 'warning';
    return 'safe';
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return 'just now';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + ' min ago';

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + ' hour' + (hours > 1 ? 's' : '') + ' ago';

    const days = Math.floor(hours / 24);
    return days + ' day' + (days > 1 ? 's' : '') + ' ago';
}

function getTimeUntilReset(nextReset) {
    const resetTime = new Date(nextReset);
    const now = new Date();
    const diffMs = resetTime - now;

    if (diffMs <= 0) return 'soon';

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${diffHours}h ${diffMinutes}m`;
}

function getStartOfDay() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
}

function getEndOfDay() {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    return now.toISOString();
}

function showQuotaError(message) {
    const quotaContainer = document.getElementById('quota-container');
    if (!quotaContainer) return;

    quotaContainer.innerHTML = `
        <div class="error-message">
            ${message}
        </div>
    `;
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

        // Update API key status
        updateApiKeyStatus(settings.apiKey);

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

    // Update API key status
    updateApiKeyStatus(settings.apiKey);
}

function updateApiKeyStatus(apiKey) {
    const statusElement = document.getElementById('api-key-status');
    if (!statusElement) return;

    if (apiKey && apiKey.length > 10) {
        // Mask the API key for display
        const maskedKey = apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4);
        statusElement.textContent = `✅ API Key: ${maskedKey}`;
        statusElement.className = 'api-key-status valid';
    } else {
        statusElement.textContent = '❌ API Key not set';
        statusElement.className = 'api-key-status invalid';
    }
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