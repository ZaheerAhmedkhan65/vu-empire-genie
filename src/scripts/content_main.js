// content_main.js - FIXED with proper error handling
console.log('VU Empire Genie (MAIN World) - Lecture Mode - FIXED');

class VULectureGenie {
    constructor() {
        this.pageType = 'lecture';
        this.settings = this.loadSettings();
        this.init();
    }

    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('vuGenie_settings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                return {
                    autoSkipLecture: settings.autoSkipAllLectures || false,
                    autoSelect: settings.autoSelect !== false,
                    autoSaveQuiz: settings.autoSaveQuiz !== false
                };
            }
        } catch (error) {
            console.error('Error loading settings from localStorage:', error);
        }

        return {
            autoSkipLecture: false,
            autoSelect: true,
            autoSaveQuiz: true
        };
    }

    async init() {
        await this.waitForPageReady();
        this.injectUI();

        console.log('Lecture Genie initialized with settings:', this.settings);

        // Auto-skip lecture if enabled
        if (this.settings.autoSkipLecture) {
            console.log('Auto-skip lectures enabled. Skipping current lecture...');
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

        const floatingBtnContainer = document.createElement("div");
        floatingBtnContainer.classList.add("floating-btn-container");
        const floatingBtn = document.createElement("button");
        floatingBtn.innerHTML = 'vu';
        floatingBtn.classList.add("floating-btn", "hide");
        floatingBtnContainer.appendChild(floatingBtn);
        document.body.appendChild(floatingBtnContainer);

        const container = document.createElement('div');
        container.id = 'vu-genie-ui';
        container.innerHTML = `
            <div class="vu-genie-container">
                <div class="vu-genie-content-wrapper">
                    <div class="vu-genie-content">
                        <button class="vu-btn ${this.settings.autoSkipLecture ? 'active' : ''}" data-action="auto-skip-lecture">
                           ${this.settings.autoSkipLecture ? '✓ Auto Skip ON' : 'Auto Skip All Lectures'}
                        </button>

                        <button class="vu-btn primary" data-action="skip-lecture">
                            Skip This Lecture
                        </button>
                    </div>
                    <button class="vu-genie-close">×</button>
                </div>
                <div class="vu-genie-status" id="vu-genie-status">Ready</div>
            </div>
        `;

        this.injectStyles();
        document.body.appendChild(container);
        this.attachEventListeners();
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #vu-genie-ui {
                min-width: 250px;
                position: fixed;
                bottom: 20px;
                right: calc(50% - 175px);
                z-index: 10000;
                font-family: 'Segoe UI', Arial, sans-serif;
            }
            
            .vu-genie-container {
                background: rgba(0, 64, 128, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 12px;
                padding: 10px 15px 5px;
                min-width: 250px;
                color: white;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.3s ease;
            }

            .floating-btn-container{
                position: fixed;
                bottom: 40px;
                right: 40px;
                text-align: end;
            }

            .floating-btn{
                background-color: rgba(0, 64, 128, 0.95);
                color: white;
                font-size: 22px;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px 15px;
                border-radius: 50%;
                border: none;
                outline: none;
                text-transform: uppercase;
                font-weight: bold;
            }

            .show{ display: block !important; }
            .hide{ display: none !important; }
            
            @keyframes slideUp {
                from { transform: translateY(100px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            .vu-genie-close {
                background: red;
                border: none;
                outline:none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                position: absolute;
                top: -8px;
                right: -8px;
            }
            
            .vu-genie-close:hover {
                background: rgba(255, 255, 255, 0.1);
                color: black;
            }

            .vu-genie-content-wrapper {
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .vu-genie-content {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 18px;
            }
            
            .vu-btn {
                padding: 5px 10px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                font-size: 14px;
                transition: all 0.2s;
            }
            
            .vu-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }
            
            .vu-btn.primary {
                background: #10b981;
                color: white;
            }
            
            .vu-genie-status {
                margin-top: 10px;
                padding-top: 5px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                font-size: 12px;
                opacity: 0.8;
                text-align: center;
            }
        `;
        document.head.appendChild(style);
    }

    attachEventListeners() {
        const container = document.getElementById('vu-genie-ui');
        const floatingBtn = document.querySelector(".floating-btn");

        container.querySelector('.vu-genie-close').addEventListener('click', () => {
            container.style.display = 'none';
            floatingBtn.classList.remove('hide');
            floatingBtn.classList.add('show');
        });

        floatingBtn.addEventListener('click', (e) => {
            e.preventDefault();
            container.style.display = 'block';
            floatingBtn.classList.remove('show');
            floatingBtn.classList.add('hide');
        });

        container.querySelector('[data-action="auto-skip-lecture"]').addEventListener('click', () => {
            this.autoSkipLectures();
        });

        container.querySelector('[data-action="skip-lecture"]').addEventListener('click', () => {
            this.skipLecture();
        });
    }

    updateStatus(message) {
        const statusElement = document.getElementById('vu-genie-status');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    async skipLecture() {
        try {
            this.updateStatus('Processing...');
            const startTime = Date.now();

            // 1. Update all tab UIs instantly
            this.updateAllTabUIsInstantly();

            // 2. Save all tabs to database with 85% watched duration
            await this.saveAllTabsWith85Percent();

            // 3. Trigger completion and navigation
            await this.triggerCompletionAndNavigate();

            const elapsed = Date.now() - startTime;
            this.updateStatus(`Completed in ${elapsed}ms`);
            console.log(`✅ Lecture skipped in ${elapsed}ms`);

        } catch (error) {
            console.error("Error in skipLecture:", error);
            this.showNotification(`❌ Error: ${error.message}`, 'error');
            this.updateStatus('Error');
        }
    }

    updateAllTabUIsInstantly() {
        console.log("Updating all tab UIs instantly...");

        const allTabElements = document.querySelectorAll('a.nav-link[id^="tabHeader"]');

        for (const tabElement of allTabElements) {
            const tabId = tabElement.id.replace('tabHeader', '');
            this.markTabAsCompleted(tabId);
        }

        console.log(`✅ Updated ${allTabElements.length} tab UIs`);
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
        console.log("Saving all tabs with 85% watched duration...");

        if (typeof PageMethods?.SaveStudentVideoLog !== 'function') {
            console.log("PageMethods not available");
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
                console.log(`Tab ${tabId}: ${data.tabName} - ${data.totalDuration}s total, ${data.watchedDuration}s watched (${data.percentage}%)`);
            }
        }

        console.log(`Found ${tabDataArray.length} tabs to save`);

        // Save each tab with 85% watched duration
        const savePromises = tabDataArray.map(tabData =>
            this.saveTabWith85Percent(tabData)
        );

        // Wait for saves to complete
        await Promise.allSettled(savePromises);

        console.log("All save requests completed");
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

                console.log(`Video ${tabId}: Total=${totalDuration}s, Watched=${watchedDuration}s (${percentage}%)`);

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
                console.log(`Saving tab ${tabData.tabId} with ${tabData.percentage}% watched...`);

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
                        console.log(`✅ Tab ${tabData.tabId} saved: ${tabData.watchedDuration}/${tabData.totalDuration}s (${tabData.percentage}%)`);
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
                        console.log(`✅ YouTube video duration: ${duration}s`);
                    }
                }
            } catch (youtubeError) {
                console.log("YouTube player not available or error:", youtubeError.message);
            }

            // SAFELY check VU video player
            try {
                if (window.CurrentLVPlayer &&
                    typeof window.CurrentLVPlayer === 'object' &&
                    window.CurrentLVPlayer.duration) {
                    const vuDuration = window.CurrentLVPlayer.duration;
                    if (vuDuration && vuDuration > 0) {
                        duration = vuDuration;
                        console.log(`✅ VU video duration: ${duration}s`);
                    }
                }
            } catch (vuError) {
                console.log("VU video player not available or error:", vuError.message);
            }

            // SAFELY check HTML5 video element
            try {
                const videoElement = document.querySelector('video');
                if (videoElement &&
                    videoElement.duration &&
                    videoElement.duration > 0) {
                    duration = videoElement.duration;
                    console.log(`✅ HTML5 video duration: ${duration}s`);
                }
            } catch (html5Error) {
                console.log("HTML5 video not available or error:", html5Error.message);
            }

            // Check for duration in hidden fields
            try {
                const durationField = document.getElementById(`hfVideoDuration${tabId}`);
                if (durationField && durationField.value) {
                    const parsed = parseFloat(durationField.value);
                    if (parsed > 0) {
                        duration = parsed;
                        console.log(`✅ Video duration from hidden field: ${duration}s`);
                    }
                }
            } catch (fieldError) {
                console.log("Duration field not available or error:", fieldError.message);
            }

            // If still no duration detected, use intelligent defaults
            if (duration <= 0) {
                duration = this.estimateDurationFromTabName(tabId);
                console.log(`📊 Estimated duration from tab name: ${duration}s`);
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
        console.log("Triggering completion...");

        // Try to trigger lesson completion
        this.triggerCompletion();

        // Wait a moment for completion to register
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Try to navigate
        const success = await this.tryNavigateToNext();

        if (!success) {
            this.enableNextButton();
            this.showNotification('✅ Lecture marked as 85% completed. Click "Next" to continue.', 'success');
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
                    console.log("Clicked completion button");
                    return true;
                }
                return false;
            },

            () => {
                if (typeof UpdateTabStatus === 'function') {
                    try {
                        UpdateTabStatus("Completed", "0", "-2");
                        console.log("Called UpdateTabStatus");
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
        console.log("Attempting navigation...");

        const nextButton = document.querySelector('#lbtnNextLesson');
        if (!nextButton) {
            console.log("Next button not found");
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
                console.log("Navigation successful via click");
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
            console.log("Enabled Next button");
        }
    }

    async autoSkipLectures() {
        try {
            this.settings.autoSkipLecture = !this.settings.autoSkipLecture;

            // Save setting
            try {
                const savedSettings = localStorage.getItem('vuGenie_settings');
                let settings = savedSettings ? JSON.parse(savedSettings) : {};
                settings.autoSkipAllLectures = this.settings.autoSkipLecture;
                localStorage.setItem('vuGenie_settings', JSON.stringify(settings));
            } catch (error) {
                console.error('Error saving to localStorage:', error);
            }

            // Update UI
            this.updateStatus(this.settings.autoSkipLecture ?
                'Auto-skip enabled. Skipping lectures...' :
                'Auto-skip disabled');

            // If enabled, skip current lecture
            if (this.settings.autoSkipLecture) {
                await this.skipLecture();
            } else {
                this.showNotification('Auto-skip lectures disabled', 'info');
            }

        } catch (error) {
            console.error("Error in autoSkipLectures:", error);
            this.showNotification(`❌ Error: ${error.message}`, 'error');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);

        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Initialize only if on lecture page
if (window.location.href.includes('LessonViewer.aspx') && !window.vuLectureGenie) {
    window.vuLectureGenie = new VULectureGenie();
}