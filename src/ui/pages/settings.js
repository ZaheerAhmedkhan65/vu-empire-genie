// ui/pages/settings.js
import { registerRoute } from "../core/router.js";

// All checkbox IDs (used for delegation and updates)
const CHECKBOX_IDS = [
  'enableCopyPaste',
  'autoSkipAllLectures',
  'autoSelect',
  'showSolution',
  'autoSolve',
  'autoSaveAfterSolve'
];

// Quiz‑specific IDs for rule enforcement
const QUIZ_IDS = ['autoSelect', 'showSolution', 'autoSolve', 'autoSaveAfterSolve'];

// Module-level flag to add the external change listener only once
let externalListenerAdded = false;

registerRoute("settings", () => {
  const container = document.createElement('div');
  container.classList.add('container', 'app-container');
  container.innerHTML = `
    <div class="fs-1 mb-3">Settings</div>

    <!-- API Key Section -->
    <div class="p-0">
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

    <!-- All settings (wrapped in a container for event delegation) -->
    <div id="checkbox-container">

      <!-- GDB Settings -->
      <div class="mb-2">
        <h3 class="fs-3 mb-2">GDB Settings</h3>
        <div class="p-0">
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
        </div>
      </div>

      <!-- Lecture Settings -->
      <div class="mb-2">
        <h3 class="fs-3 mb-2">Lecture Settings</h3>
        <div class="p-0">
          <div class="col-12 mb-2">
            <div class="toggle-item d-flex justify-content-between align-items-center">
              <div class="toggle-label d-flex align-items-center">
                <span class="toggle-text">Auto-skip All Lectures</span>
              </div>
              <label class="toggle">
                <input type="checkbox" id="autoSkipAllLectures" checked>
                <span class="slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Quiz Settings -->
      <div class="mb-0">
        <h3 class="fs-3 mb-2">Quiz Settings</h3>
        <div class="p-0">
          <div class="col-12 mb-2">
            <div class="toggle-item d-flex justify-content-between align-items-center">
              <div class="toggle-label d-flex align-items-center">
                <span class="toggle-text">Auto-select Correct Answer</span>
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
        </div>
      </div>

    </div> <!-- end #checkbox-container -->
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

    // --- Single event delegation for all checkboxes (inside #checkbox-container) ---
    const container = document.getElementById('checkbox-container');
    if (container && !container.dataset.listenerAttached) {
      container.addEventListener('change', async (e) => {
        const checkbox = e.target;
        if (checkbox.tagName !== 'INPUT' || checkbox.type !== 'checkbox') return;
        const key = checkbox.id;
        if (!CHECKBOX_IDS.includes(key)) return;

        // Gather current values from DOM
        const currentValues = {};
        CHECKBOX_IDS.forEach(id => {
          const el = document.getElementById(id);
          currentValues[id] = el ? el.checked : false;
        });

        // Apply quiz logic only if the changed checkbox is a quiz setting
        if (QUIZ_IDS.includes(key)) {
          const newValues = applyQuizRules(currentValues);

          // Check if any value changed because of the rules
          let changed = false;
          for (let id of CHECKBOX_IDS) {
            if (currentValues[id] !== newValues[id]) {
              changed = true;
              break;
            }
          }

          if (changed) {
            // Update DOM to reflect forced changes
            for (let id of CHECKBOX_IDS) {
              const el = document.getElementById(id);
              if (el && el.checked !== newValues[id]) {
                el.checked = newValues[id];
              }
            }
            // Save the entire new settings object
            await settingsManager.saveToStorage(newValues);
          } else {
            // No forced changes, just save the current values (includes user's toggle)
            await settingsManager.saveToStorage(currentValues);
          }
        } else {
          // Non-quiz setting – save immediately
          await settingsManager.saveToStorage(currentValues);
        }

        alerts.show('success', 'Settings saved');
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

/**
 * Enforce consistency rules for quiz settings.
 * @param {Object} values - current checkbox values (all settings)
 * @returns {Object} new values after applying rules
 */
function applyQuizRules(values) {
  const newVals = { ...values };

  // Rule 1: If autoSaveAfterSolve is ON, force autoSelect and autoSolve ON
  if (newVals.autoSaveAfterSolve) {
    newVals.autoSelect = true;
    newVals.autoSolve = true;
  }

  // Rule 2: Always ensure at least one of showSolution or autoSelect is ON
  if (!newVals.showSolution && !newVals.autoSelect) {
    newVals.autoSelect = true; // default to autoSelect
  }

  // Rule 3: If autoSolve is ON, ensure at least one of showSolution or autoSelect is ON
  if (newVals.autoSolve) {
    if (!newVals.showSolution && !newVals.autoSelect) {
      newVals.autoSelect = true;
    }
  }

  return newVals;
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