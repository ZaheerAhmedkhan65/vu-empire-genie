// ui/pages/settings.js
import { registerRoute } from "../core/router.js";

const CHECKBOX_IDS = [
  'autoSelect', 'autoSaveQuiz', 'enableCopyPaste',
  'autoSkipAllLectures', 'showSolution', 'autoSolve',
  'autoSaveAfterSolve'
];

// Module-level flag to add the external change listener only once
let externalListenerAdded = false;

registerRoute("settings", () => {
  const container = document.createElement('div');
  container.classList.add('container', 'app-container');
  container.innerHTML = `
    <div class="fs-1 mb-3">Settings</div>

    <!-- API Key Section -->
    <div class="py-1">
      <div class="input-group mb-3">
        <div class="d-flex align-center gap-2 w-100">
          <label class="form-label" for="apiKey">Google AI Studio Key</label>
          <div id="api-status" class="api-status">
            <div id="api-status-message"
              class="rounded-circle d-flex justify-content-center align-center bg-secondary status-badge">
              <!-- status badge -->
            </div>
          </div>
        </div>
        <div class="d-flex align-center mb-2 position-relative">
          <input type="password" id="apiKey" class="form-control m-0 py-1" placeholder="Enter your Google AI Studio API key">
          <button class="btn btn-sm btn-primary position-absolute right-0 py-2" id="saveApiKeyBtn">Save Key</button>
        </div>
        <small class="text-muted">
          <a href="https://makersuite.google.com/app/apikey" target="_blank" class="text-info">
            Get API key from Google AI Studio ↗
          </a>
        </small>
      </div>
    </div>

    <!-- Feature Settings (auto-save on toggle) -->
    <div class="py-1" id="checkbox-container">
      ${CHECKBOX_IDS.map(id => `
        <div class="col-12 mb-2">
          <div class="toggle-item d-flex justify-content-between align-items-center">
            <div class="toggle-label d-flex align-items-center">
              <span class="toggle-text">${formatLabel(id)}</span>
            </div>
            <label class="toggle">
              <input type="checkbox" id="${id}" checked>
              <span class="slider"></span>
            </label>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  setTimeout(() => initSettingsPage(), 0);
  return container;
});

function formatLabel(id) {
  return id
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
}

async function initSettingsPage() {
  try {
    const module = await import('../../scripts/settings_manager.js');
    const settingsManager = module.default;

    if (!settingsManager.initialized) {
      await settingsManager.initialize();
    }

    const settings = settingsManager.getAll();

    // Populate form
    document.getElementById('apiKey').value = settings.apiKey || '';
    CHECKBOX_IDS.forEach(id => {
      const checkbox = document.getElementById(id);
      if (checkbox) {
        checkbox.checked = settings[id] !== false;
      }
    });

    updateApiStatus(settings);

    // --- Guard: attach checkbox change listener only once per container ---
    const container = document.getElementById('checkbox-container');
    if (container && !container.dataset.listenerAttached) {
      container.addEventListener('change', async (e) => {
        const checkbox = e.target;
        if (checkbox.tagName === 'INPUT' && checkbox.type === 'checkbox') {
          const key = checkbox.id;
          if (CHECKBOX_IDS.includes(key)) {
            const value = checkbox.checked;
            await settingsManager.set(key, value);
            alerts.show('success', 'Settings saved');
            console.log(`Setting "${key}" updated to`, value);
          }
        }
      });
      container.dataset.listenerAttached = 'true';
    }

    // --- Guard: attach save API key button listener only once ---
    const saveBtn = document.getElementById('saveApiKeyBtn');
    if (saveBtn && !saveBtn.dataset.listenerAttached) {
      saveBtn.addEventListener('click', async () => {
        const apiKey = document.getElementById('apiKey').value.trim();
        if (apiKey && !apiKey.startsWith('AIza')) {
          if (!confirm('API key format looks unusual. Are you sure this is correct?')) {
            return;
          }
        }
        await settingsManager.set('apiKey', apiKey);
        updateApiStatus({ apiKey });
        alerts.show('success', 'Key saved');
      });
      saveBtn.dataset.listenerAttached = 'true';
    }

    // --- Guard: add external change listener only once globally ---
    if (!externalListenerAdded) {
      settingsManager.addListener(updateSettingsUI);
      externalListenerAdded = true;
    }

  } catch (error) {
    console.error('Error initializing settings page:', error);
    alerts.show('error', 'Error initializing settings', { bounce: true });
  }
}

function updateApiStatus(settings) {
  const message = document.getElementById('api-status-message');
  if (!message) return;
  message.style.display = 'flex';
  if (!settings.apiKey) {
    message.innerHTML = '<span class="badge badge-danger" style="width: 12px; height: 12px;"></span>';
    message.title = 'API key not set';
  } else {
    message.innerHTML = '<span class="badge badge-success" style="width: 12px; height: 12px;"></span>';
    message.title = 'API key is set';
  }
}

function updateSettingsUI(settings) {
  const apiInput = document.getElementById('apiKey');
  if (!apiInput) return; // page not active

  apiInput.value = settings.apiKey || '';
  CHECKBOX_IDS.forEach(id => {
    const checkbox = document.getElementById(id);
    if (checkbox) {
      checkbox.checked = settings[id] !== false;
    }
  });

  updateApiStatus(settings);
}