// scripts/content_main.js
console.log('VU Empire Genie - Lecture Mode');
(function () {
    'use strict';
class AlertManager {
    constructor(containerId = 'alertContainer', defaultDuration = 4000) {
        this.container = document.getElementById(containerId);

        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = containerId;
            document.body.appendChild(this.container);
        }

        this.defaultDuration = defaultDuration;
    }

    show(type = 'info', message = '', options = {}) {
        const alert = document.createElement('div');
        alert.className = `alert-m ${type}`;
        if (options.bounce) alert.style.animation = 'slideIn 0.5s forwards, bounce 0.5s 1';
        alert.innerHTML = `
            ${options.icon ? `<span class="icon">${options.icon}</span>` : ''}
            <span class="message">${message}</span>
            <span class="close-btn">&times;</span>
        `;

        // Close button
        alert.querySelector('.close-btn').onclick = () => this.hide(alert);

        // Append to container
        this.container.appendChild(alert);

        // Auto-dismiss
        const duration = options.duration || this.defaultDuration;
        const timeout = setTimeout(() => this.hide(alert), duration);

        // Optional callbacks
        if (options.onShow) options.onShow(alert);

        // Store timeout to allow clearing if needed
        alert._timeout = timeout;
    }

    hide(alert) {
        if (alert._timeout) clearTimeout(alert._timeout);
        alert.style.animation = 'slideOut 0.5s forwards';
        setTimeout(() => alert.remove(), 500);
    }

    hideAll() {
        const alerts = this.container.querySelectorAll('.alert-m');
        alerts.forEach(alert => this.hide(alert));
    }
}

// Initialize
const vu_alerts = new AlertManager();

class VULectureGenie {
    constructor() {
        this.pageType = 'lecture';
        this.settings = this.loadSettings();
        this.skipButton = null;
        this.autoSkipButton = null;
        this.isInitialized = false;
        this.init();
    }

    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('vuGenie_settings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                return {
                    autoSkipLecture: settings.autoSkipAllLectures || false,
                    autoSelect: settings.autoSelect !== false
                };
            }
        } catch (error) {
            console.error('Error loading settings from localStorage:', error);
        }

        return {
            autoSkipLecture: false,
            autoSelect: true
        };
    }

    async init() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        await this.waitForPageReady();
        this.injectUI();

        // After UI is ready, store button references and set initial state
        if (this.settings.autoSkipLecture) {
            this.updateSkipButtonState(true, 'Marking Attendance...');
        } else {
            this.updateSkipButtonState(false, 'Mark This Lecture');
        }
        // Auto-skip lecture if enabled
        if (this.settings.autoSkipLecture) {
            await this.skipLecture();
        }
    }

    async waitForPageReady() {
        if (document.readyState === 'loading') {
            return new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', () => {
                    setTimeout(resolve, 300);
                });
            });
        }
        return Promise.resolve();
    }

    injectUI() {
        if (document.getElementById('vu-genie-ui')) return;

        const container = document.createElement('div');
        container.id = 'vu-genie-ui';
        container.innerHTML = `
            <div class="vu-genie-container">
                <div class="vu-genie-content-wrapper">
                    <div class="vu-genie-content">
                        <button class="vu-btn ${this.settings.autoSkipLecture ? 'active' : ''}" data-action="auto-skip-lecture">
                           ${this.settings.autoSkipLecture ? 'Stop' : 'Auto Mark All Lectures'}
                        </button>

                        <button class="vu-btn primary" data-action="skip-lecture">
                            Mark This Lecture
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(container);
        this.attachEventListeners();
    }

    attachEventListeners() {
        this.autoSkipButton = document.querySelector('[data-action="auto-skip-lecture"]');
        this.skipButton = document.querySelector('[data-action="skip-lecture"]');

        if (this.autoSkipButton) {
            this.autoSkipButton.addEventListener('click', () => {
                this.autoSkipLectures();
            });
        }

        if (this.skipButton) {
            this.skipButton.addEventListener('click', () => {
                this.skipLecture();
            });
        }
    }

    updateSkipButtonState(disable, text = null) {
        if (!this.skipButton) return;
        this.skipButton.disabled = disable;
        if (text !== null) {
            this.skipButton.innerText = text;
        }
    }

    async skipLecture() {
        try {
            // Disable the skip button and show progress
            this.updateSkipButtonState(true, 'Marking Attendance...');

            const startTime = Date.now();

            // 1. Update all tab UIs instantly
            this.updateAllTabUIsInstantly();

            // 2. Save all tabs to database with 85% watched duration
            await this.saveAllTabsWith85Percent();

            // 3. Trigger completion and navigation
            await this.triggerCompletionAndNavigate();

            const elapsed = Date.now() - startTime;
        } catch (error) {
            console.error("Error in skipLecture:", error);
            vu_alerts.show('error', 'Error skipping lecture', { bounce: true });
        } finally {
        // Re‑enable the skip button only if auto‑skip is NOT enabled
        if (!this.settings.autoSkipLecture) {
            this.updateSkipButtonState(false, 'Mark This Lecture');
        }
    }
    }

    updateAllTabUIsInstantly() {
        const allTabElements = document.querySelectorAll('a.nav-link[id^="tabHeader"]');

        for (const tabElement of allTabElements) {
            const tabId = tabElement.id.replace('tabHeader', '');
            this.markTabAsCompleted(tabId);
        }
    }

    markTabAsCompleted(tabId) {
        try {
            const statusElement = document.getElementById(`hfTabCompletionStatus${tabId}`);
            if (statusElement) {
                statusElement.value = 'Completed';
            }

            const videoStatus = document.getElementById(`lblVCompletionStatus${tabId}`);
            if (videoStatus) {
                videoStatus.innerHTML = "<i class='fa fa-check text-success'></i> Viewed";
                videoStatus.style.color = "green";
            }

            const readStatus = document.getElementById(`lblRCompletionStatus${tabId}`);
            if (readStatus) {
                readStatus.innerHTML = "<i class='fa fa-check text-success'></i> Completed";
                readStatus.style.color = "green";
            }

            const tabLink = document.getElementById(`tabHeader${tabId}`);
            if (tabLink) {
                tabLink.classList.remove("disabled");
                tabLink.style.pointerEvents = "auto";
            }

        } catch (error) {
            console.warn(`Could not update tab ${tabId}:`, error);
        }
    }

    async saveAllTabsWith85Percent() {
        if (typeof PageMethods?.SaveStudentVideoLog !== 'function') {
            return;
        }

        const allTabElements = document.querySelectorAll('a.nav-link[id^="tabHeader"]');
        const tabDataArray = [];

        // Collect all tab data
        for (const tabElement of allTabElements) {
            const tabId = tabElement.id.replace('tabHeader', '');
            const data = this.extractTabDataWith85Percent(tabId);
            if (data) {
                tabDataArray.push(data);
            }
        }

        // Save each tab with 85% watched duration
        const savePromises = tabDataArray.map(tabData =>
            this.saveTabWith85Percent(tabData)
        );

        // Wait for saves to complete
        await Promise.allSettled(savePromises);
    }

    extractTabDataWith85Percent(tabId) {
        try {
            // Get required data for VU LMS
            const studentId = document.getElementById("hfStudentID")?.value;
            const courseCode = document.getElementById("hfCourseCode")?.value;
            const semester = document.getElementById("hfEnrollmentSemester")?.value || "";
            const lessonTitle = document.getElementById("MainContent_lblLessonTitle")?.getAttribute("title") || "";
            const lessonNo = lessonTitle.match(/Lesson\s*(\d+)/)?.[1] || "1";

            const contentId = document.getElementById(`hfContentID${tabId}`)?.value;
            const videoId = document.getElementById(`hfVideoID${tabId}`)?.value || "";
            const isVideo = document.getElementById(`hfIsVideo${tabId}`)?.value === "1";
            const tabName = document.querySelector(`#tabHeader${tabId}`)?.textContent?.trim() || `Tab ${tabId}`;

            // Get tab type for typeFlag
            const tabType = document.getElementById(`hfTabType${tabId}`)?.value || "";
            let typeFlag = 0; // Default reading

            if (isVideo) {
                typeFlag = 1; // Video
            } else if (tabType.includes("formativeassessment") || tabType.includes("assessment")) {
                typeFlag = -2; // Assessment
            }

            // Get durations with 85% watched for videos
            let totalDuration = 0;
            let watchedDuration = 0;
            let percentage = 0;

            if (typeFlag === 1) { // Video
                totalDuration = this.getVideoDuration(tabId);

                // Ensure minimum duration of 60 seconds
                if (totalDuration < 60) totalDuration = 60;

                // Calculate 85% watched duration
                watchedDuration = Math.round(totalDuration * 0.85);
                percentage = 85;

            } else if (typeFlag === -2) { // Assessment
                // Assessments: mark as 90% completed
                totalDuration = 300; // 5 minutes total
                watchedDuration = 270; // 4.5 minutes watched (90%)
                percentage = 90;

            } else { // Reading material
                // Reading: mark as 95% completed
                totalDuration = 240; // 4 minutes total
                watchedDuration = 228; // 3.8 minutes watched (95%)
                percentage = 95;
            }

            return {
                tabId,
                studentId,
                courseCode,
                semester,
                lessonNo,
                contentId,
                videoId,
                isVideo,
                tabName,
                typeFlag,
                totalDuration,
                watchedDuration,
                percentage
            };

        } catch (error) {
            console.error(`Error extracting data for tab ${tabId}:`, error);
            return null;
        }
    }

    async saveTabWith85Percent(tabData) {
        return new Promise((resolve) => {
            try {
                // Set timeout
                const timeout = setTimeout(() => {
                    console.warn(`Timeout saving tab ${tabData.tabId}`);
                    resolve(false);
                }, 5000);

                // Call VU LMS method with 85% watched duration
                PageMethods.SaveStudentVideoLog(
                    tabData.studentId,
                    tabData.courseCode,
                    tabData.semester,
                    tabData.lessonNo,
                    tabData.contentId,
                    tabData.watchedDuration,
                    tabData.totalDuration,
                    tabData.videoId,
                    tabData.typeFlag,
                    window.location.href,
                    (result) => {
                        clearTimeout(timeout);
                        resolve(true);
                    },
                    (error) => {
                        clearTimeout(timeout);
                        console.warn(`⚠️ Tab ${tabData.tabId} save error:`, error);
                        resolve(false);
                    }
                );

            } catch (error) {
                console.warn(`Exception saving tab ${tabData.tabId}:`, error);
                resolve(false);
            }
        });
    }

    getVideoDuration(tabId) {
        try {
            let duration = 0;

            // SAFELY check YouTube player
            try {
                if (window.CurrentPlayer &&
                    typeof window.CurrentPlayer === 'object' &&
                    typeof window.CurrentPlayer.getDuration === 'function') {
                    const playerDuration = window.CurrentPlayer.getDuration();
                    if (playerDuration && playerDuration > 0) {
                        duration = playerDuration;
                    }
                }
            } catch (youtubeError) {
                console.error("YouTube player not available or error:", youtubeError.message);
            }

            // SAFELY check VU video player
            try {
                if (window.CurrentLVPlayer &&
                    typeof window.CurrentLVPlayer === 'object' &&
                    window.CurrentLVPlayer.duration) {
                    const vuDuration = window.CurrentLVPlayer.duration;
                    if (vuDuration && vuDuration > 0) {
                        duration = vuDuration;
                    }
                }
            } catch (vuError) {
                console.error("VU video player not available or error:", vuError.message);
            }

            // SAFELY check HTML5 video element
            try {
                const videoElement = document.querySelector('video');
                if (videoElement &&
                    videoElement.duration &&
                    videoElement.duration > 0) {
                    duration = videoElement.duration;
                }
            } catch (html5Error) {
                console.error("HTML5 video not available or error:", html5Error.message);
            }

            // Check for duration in hidden fields
            try {
                const durationField = document.getElementById(`hfVideoDuration${tabId}`);
                if (durationField && durationField.value) {
                    const parsed = parseFloat(durationField.value);
                    if (parsed > 0) {
                        duration = parsed;
                    }
                }
            } catch (fieldError) {
                console.error("Duration field not available or error:", fieldError.message);
            }

            // If still no duration detected, use intelligent defaults
            if (duration <= 0) {
                duration = this.estimateDurationFromTabName(tabId);
            }

            return Math.max(duration, 60); // Minimum 60 seconds

        } catch (error) {
            console.warn(`⚠️ Error in getVideoDuration for tab ${tabId}:`, error.message);
            return 600; // Default 10 minutes (safer default)
        }
    }

    estimateDurationFromTabName(tabId) {
        try {
            const tabName = document.querySelector(`#tabHeader${tabId}`)?.textContent?.toLowerCase() || '';

            // Duration estimation logic (in seconds)
            if (tabName.includes('intro') || tabName.includes('overview') || tabName.includes('welcome')) {
                return 180; // 3 minutes
            } else if (tabName.includes('summary') || tabName.includes('conclusion') || tabName.includes('recap')) {
                return 240; // 4 minutes
            } else if (tabName.includes('part 1') || tabName.includes('lecture 1') || tabName.includes('section 1')) {
                return 900; // 15 minutes
            } else if (tabName.includes('part 2') || tabName.includes('lecture 2') || tabName.includes('section 2')) {
                return 900; // 15 minutes
            } else if (tabName.includes('part 3') || tabName.includes('lecture 3') || tabName.includes('section 3')) {
                return 900; // 15 minutes
            } else if (tabName.includes('full') || tabName.includes('complete') || tabName.includes('entire')) {
                return 1800; // 30 minutes
            } else if (tabName.includes('video') || tabName.includes('lecture') || tabName.includes('topic')) {
                return 1200; // 20 minutes
            } else if (tabName.includes('short') || tabName.includes('brief') || tabName.includes('quick')) {
                return 300; // 5 minutes
            } else {
                return 600; // Default 10 minutes
            }
        } catch (error) {
            console.warn(`Could not estimate duration for tab ${tabId}:`, error);
            return 600; // Default 10 minutes
        }
    }

    async triggerCompletionAndNavigate() {
        // Try to trigger lesson completion
        this.triggerCompletion();

        // Wait a moment for completion to register
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Try to navigate
        const success = await this.tryNavigateToNext();

        if (!success) {
            this.enableNextButton();
            vu_alerts.show('warning', 'Could not navigate to next lesson', { bounce: true });
        }

        return success;
    }

    triggerCompletion() {
        // Try completion methods
        const methods = [
            () => {
                const btn = document.querySelector('#btnComplete, #btnMarkComplete, #btnFinish');
                if (btn && !btn.disabled) {
                    btn.click();
                    return true;
                }
                return false;
            },

            () => {
                if (typeof UpdateTabStatus === 'function') {
                    try {
                        UpdateTabStatus("Completed", "0", "-2");
                        return true;
                    } catch (e) {
                        return false;
                    }
                }
                return false;
            }
        ];

        for (const method of methods) {
            try {
                if (method()) break;
            } catch (error) {
                continue;
            }
        }
    }

    async tryNavigateToNext() {
        const nextButton = document.querySelector('#lbtnNextLesson');
        if (!nextButton) {
            return false;
        }

        // Enable if disabled
        if (nextButton.disabled) {
            nextButton.disabled = false;
            nextButton.classList.remove('disabled');
        }

        const currentUrl = window.location.href;

        // Try click
        if (nextButton.click) {
            nextButton.click();
            await new Promise(resolve => setTimeout(resolve, 500));

            if (window.location.href !== currentUrl) {
                return true;
            }
        }

        // Try href
        if (nextButton.href && window.location.href === currentUrl) {
            window.location.href = nextButton.href;
            return true;
        }

        return false;
    }

    enableNextButton() {
        const nextButton = document.querySelector('#lbtnNextLesson');
        if (nextButton && nextButton.disabled) {
            nextButton.disabled = false;
            nextButton.classList.remove('disabled');
        }
    }

    async autoSkipLectures() {
        try {
            this.settings.autoSkipLecture = !this.settings.autoSkipLecture;

            // Save to localStorage
            try {
                const savedSettings = localStorage.getItem('vuGenie_settings');
                let settings = savedSettings ? JSON.parse(savedSettings) : {};
                settings.autoSkipAllLectures = this.settings.autoSkipLecture;
                localStorage.setItem('vuGenie_settings', JSON.stringify(settings));
            } catch (e) {
                console.error('Error saving to localStorage:', e);
                const settings = { autoSkipAllLectures: this.settings.autoSkipLecture };
                localStorage.setItem('vuGenie_settings', JSON.stringify(settings));
            }

            // Sync with chrome.storage via custom event
            window.dispatchEvent(new CustomEvent('vu-genie-settings-update', {
                detail: {
                    settings: { autoSkipAllLectures: this.settings.autoSkipLecture }
                }
            }));

            // Update UI button text and skip button state
            if (this.autoSkipButton) {
                this.autoSkipButton.textContent = this.settings.autoSkipLecture ? 'Stop' : 'Auto Mark All Lectures';
                this.autoSkipButton.classList.toggle('active', this.settings.autoSkipLecture);
            }

            if (this.settings.autoSkipLecture) {
                // Auto-skip enabled: disable skip button and set text
                this.updateSkipButtonState(true, 'Marking Attendance...');
                // Immediately skip the current lecture
                await this.skipLecture();
            } else {
                // Auto-skip disabled: re-enable skip button and restore text
                this.updateSkipButtonState(false, 'Mark This Lecture');
                vu_alerts.show('info', 'Auto Mark All Lectures is disabled', { bounce: true });
            }
        } catch (error) {
            console.error('Error in autoSkipLectures:', error);
            vu_alerts.show('error', 'Error in autoSkipLectures', { bounce: true });
        }
    }

    onSettingsUpdated(settings) {
        const oldAutoSkip = this.settings.autoSkipLecture;
        this.settings = {
            ...this.settings,
            autoSkipLecture: settings.autoSkipAllLectures || false,
            autoSelect: settings.autoSelect !== false
        };

        // Update UI button text and skip button state
        if (this.autoSkipButton) {
            this.autoSkipButton.textContent = this.settings.autoSkipLecture ? 'Stop' : 'Auto Mark All Lectures';
            this.autoSkipButton.classList.toggle('active', this.settings.autoSkipLecture);
        }

        if (this.settings.autoSkipLecture) {
            this.updateSkipButtonState(true, 'Marking Attendance...');
            // If auto-skip was just turned ON, skip the current lecture immediately
            if (!oldAutoSkip && this.settings.autoSkipLecture) {
                this.skipLecture();
            }
        } else {
            this.updateSkipButtonState(false, 'Mark This Lecture');
        }
    }
}

// Initialize only if on lecture page
if (window.location.href.includes('LessonViewer.aspx') && !window.vuLectureGenie) {
    window.vuLectureGenie = new VULectureGenie();
}
}) ();