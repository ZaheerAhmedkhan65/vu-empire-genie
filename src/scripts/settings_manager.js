// scripts/settingsManager.js
class SettingsManager {
    constructor() {
        this.settings = this.getDefaultSettings();
        this.listeners = [];
        this.initialized = false;
    }

    getDefaultSettings() {
        return {
            // API Configuration
            apiKey: '',

            // Core Features
            autoSelect: true,
            enableCopyPaste: true,
            autoSkipAllLectures: false,

            // New Quiz Settings
            showSolution: true,
            autoSolve: false,
            autoSaveAfterSolve: false,

            // UI/Theme
            theme: 'dark',

            // Server URL
            serverUrl: 'https://vu-empire-genie.vercel.app'
        };
    }

    async initialize() {
        if (this.initialized) return;

        // Load settings from Chrome sync storage
        await this.loadFromStorage();

        // Listen for changes in other tabs
        this.setupChangeListener();

        this.initialized = true;
    }

    async loadFromStorage() {
        try {
            const result = await chrome.storage.sync.get(null);

            // Merge with defaults
            this.settings = {
                ...this.getDefaultSettings(),
                ...result
            };

        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async saveToStorage(settings = null) {
        try {
            if (settings) {
                this.settings = {
                    ...this.settings,
                    ...settings
                };
            }

            await chrome.storage.sync.set(this.settings);

            // Notify all listeners
            this.notifyListeners();

            // Broadcast to other extension contexts
            await this.broadcastSettings();

            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    async broadcastSettings() {
        try {
            // Save to localStorage on all VU tabs
            const tabs = await chrome.tabs.query({ url: 'https://vulms.vu.edu.pk/*' });

            for (const tab of tabs) {
                try {
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: (settings) => {
                            // Save to localStorage for fallback
                            localStorage.setItem('vuGenie_apiKey', settings.apiKey);
                            localStorage.setItem('vuGenie_settings', JSON.stringify(settings));

                            // Update any active genie instance
                            const genieInstance = window.vuLectureGenie || window.vuQuizGenie || window.vuGenieInstance;
                            if (genieInstance) {
                                genieInstance.apiKey = settings.apiKey;
                                genieInstance.settings = settings;
                                // NEW: Notify the instance about settings update
                                if (typeof genieInstance.onSettingsUpdated === 'function') {
                                    genieInstance.onSettingsUpdated(settings);
                                }
                            }
                        },
                        args: [this.settings],
                        world: 'MAIN'
                    });
                } catch (error) {
                    console.error(`Could not update tab ${tab.id}:`, error.message);
                }
            }
        } catch (error) {
            console.error('Error broadcasting settings:', error);
        }
    }

    setupChangeListener() {
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'sync') {
                Object.keys(changes).forEach(key => {
                    this.settings[key] = changes[key].newValue;
                });

                this.notifyListeners();
            }
        });
    }

    addListener(callback) {
        this.listeners.push(callback);
    }

    removeListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.settings);
            } catch (error) {
                console.error('Error in settings listener:', error);
            }
        });
    }

    get(key) {
        return this.settings[key];
    }

    set(key, value) {
        this.settings[key] = value;
        return this.saveToStorage({ [key]: value });
    }

    getAll() {
        return { ...this.settings };
    }

    resetToDefaults() {
        this.settings = this.getDefaultSettings();
        return this.saveToStorage();
    }
}

// Create singleton instance
const settingsManager = new SettingsManager();

// Initialize immediately
if (typeof chrome !== 'undefined' && chrome.storage) {
    settingsManager.initialize();
}

export default settingsManager;
