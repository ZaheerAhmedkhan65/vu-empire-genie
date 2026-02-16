// ui/pages/settings.js
import { registerRoute } from "../core/router.js";

registerRoute("settings", () => {
    const container = document.createElement('div');
    container.innerHTML = `
    <div class="fs-1 mb-3">Settings</div>

    <!-- API Key Settings -->
    <div class="py-1">
      <div class="input-group mb-3">
        <div class="d-flex align-center gap-2">
          <label class="form-label" for="apiKey">Gemini API Key</label>
          <div id="api-status" class="api-status">
            <div id="api-status-message"
              class="rounded-circle d-flex justify-content-center align-center bg-secondary status-badge">
              <!-- status badge -->
            </div>
          </div>
        </div>
        <input type="password" id="apiKey" class="form-control" placeholder="Enter your Google AI Studio API key">
        <small class="text-muted">
          <a href="https://makersuite.google.com/app/apikey" target="_blank" class="text-info">
            Get API key from Google AI Studio ↗
          </a>
        </small>
      </div>
    </div>

    <!-- Feature Settings -->
    <div class="py-1">
      <div class="col-12 mb-2">
        <div class="toggle-item d-flex justify-content-between align-items-center">
          <div class="toggle-label d-flex align-items-center">
            <span class="toggle-text">Auto-select Quiz Answer</span>
          </div>
          <label class="toggle">
            <input type="checkbox" id="autoSelect" checked>
            <span class="slider"></span>
          </label>
        </div>
      </div>
      <div class="col-12 mb-2">
        <div class="toggle-item d-flex justify-content-between align-items-center">
          <div class="toggle-label d-flex align-items-center">
            <span class="toggle-text">Auto-save Quiz Question</span>
          </div>
          <label class="toggle">
            <input type="checkbox" id="autoSaveQuiz" checked>
            <span class="slider"></span>
          </label>
        </div>
      </div>
      <div class="col-12 mb-2">
        <div class="toggle-item d-flex justify-content-between align-items-center">
          <div class="toggle-label d-flex align-items-center">
            <span class="toggle-text">Enable GDBs Copy-Paste</span>
          </div>
          <label class="toggle">
            <input type="checkbox" id="enableCopyPaste" checked>
            <span class="slider"></span>
          </label>
        </div>
      </div>
      <div class="col-12 mb-2">
        <div class="toggle-item d-flex justify-content-between align-items-center">
          <div class="toggle-label d-flex align-items-center">
            <span class="toggle-text">Auto-skip Lectures</span>
          </div>
          <label class="toggle">
            <input type="checkbox" id="autoSkipAllLectures" checked>
            <span class="slider"></span>
          </label>
        </div>
      </div>
      <div class="col-12 mb-2">
        <div class="toggle-item d-flex justify-content-between align-items-center">
          <div class="toggle-label d-flex align-items-center">
            <span class="toggle-text">Show Solution Popup</span>
          </div>
          <label class="toggle">
            <input type="checkbox" id="showSolution" checked>
            <span class="slider"></span>
          </label>
        </div>
      </div>
      <div class="col-12 mb-2">
        <div class="toggle-item d-flex justify-content-between align-items-center">
          <div class="toggle-label d-flex align-items-center">
            <span class="toggle-text">Auto-solve on Page Load</span>
          </div>
          <label class="toggle">
            <input type="checkbox" id="autoSolve" checked>
            <span class="slider"></span>
          </label>
        </div>
      </div>
      <div class="col-12 mb-3">
        <div class="toggle-item d-flex justify-content-between align-items-center">
          <div class="toggle-label d-flex align-items-center">
            <span class="toggle-text">Auto-save & Next Question</span>
          </div>
          <label class="toggle">
            <input type="checkbox" id="autoSaveAfterSolve" checked>
            <span class="slider"></span>
          </label>
        </div>
      </div>
      <!-- Save Button -->
      <div class="col-12">
        <button class="btn btn-primary w-100" id="saveBtn">Save Settings</button>
      </div>
    </div>

    <!-- Status Message -->
    <div id="status" class="mt-3"></div>

    <!-- Help Link -->
    <div class="text-center mt-3">
      <a href="options.html" target="_blank" class="btn btn-outline-info">Open full settings page</a>
    </div>
    `;

    // Initialize the settings UI after the DOM is added to the page
    setTimeout(() => {
        initSettingsPage();
    }, 0);

    return container;
});

// Initialize the settings page settings UI
async function initSettingsPage() {
    try {
        // Import settings manager dynamically
        const module = await import('../../../scripts/settings_manager.js');
        const settingsManager = module.default;

        // Wait for settings manager to be initialized
        if (!settingsManager.isInitialized) {
            await settingsManager.initialize();
        }

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

        // Initialize API status
        await initApiStatus(settingsManager);

        // Add save button listener
        document.getElementById('saveBtn').addEventListener('click', async () => {
            await saveSettings(settingsManager);
        });

        // Listen for settings changes
        settingsManager.addListener((updatedSettings) => {
            updateSettingsUI(updatedSettings);
        });

    } catch (error) {
        console.error('Error initializing settings page:', error);
    }
}

// Initialize API status
async function initApiStatus(settingsManager) {
    try {
        const message = document.getElementById('api-status-message');

        if (message) {
            const settings = settingsManager.getAll();
            const apiKey = settings.apiKey;

            setTimeout(() => {
                message.style.display = 'flex';

                if (!apiKey) {
                    message.innerHTML = '<span class="badge badge-danger" style="width: 12px; height: 12px;"></span>';
                    message.title = 'API key not set';
                } else {
                    message.innerHTML = '<span class="badge badge-success" style="width: 12px; height: 12px;"></span>';
                    message.title = 'API key is set';
                }
            }, 500);
        }
    } catch (error) {
        console.error('Error checking API status:', error);
    }
}

// Update UI with new settings
function updateSettingsUI(settings) {
    // Check if elements exist (page might not be active)
    const apiKeyInput = document.getElementById('apiKey');
    if (apiKeyInput) {
        apiKeyInput.value = settings.apiKey || '';
        document.getElementById('autoSelect').checked = settings.autoSelect !== false;
        document.getElementById('autoSaveQuiz').checked = settings.autoSaveQuiz !== false;
        document.getElementById('enableCopyPaste').checked = settings.enableCopyPaste !== false;
        document.getElementById('autoSkipAllLectures').checked = settings.autoSkipAllLectures !== false;
        document.getElementById('showSolution').checked = settings.showSolution !== false;
        document.getElementById('autoSolve').checked = settings.autoSolve === true;
        document.getElementById('autoSaveAfterSolve').checked = settings.autoSaveAfterSolve === true;

        // Update API status badge
        const message = document.getElementById('api-status-message');
        if (message && message.style.display !== 'none') {
            if (!settings.apiKey) {
                message.innerHTML = '<span class="badge badge-danger" style="width: 12px; height: 12px;"></span>';
                message.title = 'API key not set';
            } else {
                message.innerHTML = '<span class="badge badge-success" style="width: 12px; height: 12px;"></span>';
                message.title = 'API key is set';
            }
        }
    }
}

// Save settings
async function saveSettings(settingsManager) {
    try {
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

        if (newSettings.apiKey && !newSettings.apiKey.startsWith('AIza')) {
            if (!confirm('API key format looks unusual. Are you sure this is correct?')) {
                return;
            }
        }

        const success = await settingsManager.saveToStorage(newSettings);

        if (success) {
            alerts.show('success', 'Settings saved successfully!', { bounce: true });

            // Refresh API status
            await initApiStatus(settingsManager);
        } else {
            alerts.show('error', 'Error saving settings', { bounce: true });
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        alerts.show('error', 'Error saving settings: ' + error.message);
    }
}