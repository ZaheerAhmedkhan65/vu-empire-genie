// content_main.js - For lectures
console.log('VU Empire Genie (MAIN World) - Lecture Mode');

class VULectureGenie {
    constructor() {
        this.pageType = 'lecture';
        this.init();
    }

    async init() {
        await this.waitForPageReady();
        this.injectUI();
        // this.initFeatures();
    }

    async waitForPageReady() {
        return new Promise(resolve => {
            if (document.readyState === 'complete') {
                setTimeout(resolve, 1000);
            } else {
                window.addEventListener('load', () => setTimeout(resolve, 1000));
            }
        });
    }

    injectUI() {
        if (document.getElementById('vu-genie-ui')) return;

        const container = document.createElement('div');
        container.id = 'vu-genie-ui';
        container.innerHTML = `
            <div class="vu-genie-container">
                <div class="vu-genie-header">
                    <h3>🎥 Lecture Assistant</h3>
                    <button class="vu-genie-close">×</button>
                </div>
                <div class="vu-genie-content">
                    <button class="vu-btn primary" data-action="mark-watched">
                        Mark as Watched
                    </button>
                </div>
                <div class="vu-genie-status" id="vu-genie-status">Ready</div>
            </div>
        `;

        // Add styles
        this.injectStyles();
        document.body.appendChild(container);
        this.attachEventListeners();
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #vu-genie-ui {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 10000;
                font-family: 'Segoe UI', Arial, sans-serif;
            }
            
            .vu-genie-container {
                background: rgba(0, 64, 128, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 12px;
                padding: 15px;
                min-width: 250px;
                color: white;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.1);
                animation: slideUp 0.3s ease;
            }
            
            @keyframes slideUp {
                from { transform: translateY(100px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            .vu-genie-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .vu-genie-header h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
            }
            
            .vu-genie-close {
                background: transparent;
                border: none;
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
            }
            
            .vu-genie-close:hover {
                background: rgba(255, 255, 255, 0.1);
            }
            
            .vu-genie-content {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .vu-btn {
                padding: 10px 15px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
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
                padding-top: 10px;
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

        // Close button
        container.querySelector('.vu-genie-close').addEventListener('click', () => {
            container.style.display = 'none';
        });

        // Mark as watched button
        container.querySelector('[data-action="mark-watched"]').addEventListener('click', () => {
            this.markLectureAsWatched();
        });
    }

    updateStatus(message) {
        const statusElement = document.getElementById('vu-genie-status');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    async markLectureAsWatched() {
        try {
            this.updateStatus('Processing...');

            // Get lecture data
            const data = this.extractLectureData();
            console.log("Lecture data:", data);

            if (!data.studentId || !data.courseCode) {
                throw new Error("Missing student or course information");
            }

            // Process ALL tabs with rate limiting
            const success = await this.processAllTabsWithDelay();

            if (!success) {
                this.showNotification('⚠️ Some tabs may not have been saved. Please wait and try again.', 'warning');
                return;
            }

            // Wait longer for server to process all requests
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Try to trigger completion ONCE
            await this.triggerLessonCompletion();

            // Wait for completion to register
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Now navigate to next lecture - but only if we can
            await this.safeNavigateToNext();

        } catch (error) {
            console.error("Error in markLectureAsWatched:", error);
            this.showNotification(`❌ Error: ${error.message}`, 'error');
        } finally {
            this.updateStatus('Ready');
        }
    }

    async processAllTabsWithDelay() {
        console.log("Processing all tabs with delay...");

        try {
            // Get all tab IDs
            const allTabElements = document.querySelectorAll('a.nav-link[id^="tabHeader"]');
            const tabsToProcess = [];

            // Collect all tab data
            for (const tabElement of allTabElements) {
                const tabId = tabElement.id.replace('tabHeader', '');
                const tabData = this.extractTabData(tabId);
                if (tabData) {
                    tabsToProcess.push(tabData);
                }
            }

            console.log(`Found ${tabsToProcess.length} tabs to process`);

            // Track success/failure
            let successCount = 0;
            let failureCount = 0;

            // Sort tabs: video tabs first, then others
            tabsToProcess.sort((a, b) => {
                if (a.isVideo && !b.isVideo) return -1;
                if (!a.isVideo && b.isVideo) return 1;
                return 0;
            });

            // Process each tab with appropriate delay
            for (let i = 0; i < tabsToProcess.length; i++) {
                const tabData = tabsToProcess[i];

                try {
                    console.log(`Processing tab ${i + 1}/${tabsToProcess.length}: ${tabData.tabName} (${tabData.isVideo ? 'Video' : 'Reading/Assessment'})`);

                    // Update UI status first
                    this.updateTabStatus(tabData.tabId, 'Completed');

                    // Only save to database if PageMethods exists
                    if (typeof PageMethods?.SaveStudentVideoLog === 'function') {
                        // Adjust delay based on content type
                        let delay;
                        if (tabData.isVideo) {
                            // Longer delay for videos (they take more processing)
                            delay = 2000 + Math.random() * 3000; // 2-5 seconds
                        } else {
                            // Shorter delay for reading/assessment
                            delay = 1000 + Math.random() * 2000; // 1-3 seconds
                        }

                        console.log(`Waiting ${Math.round(delay / 1000)}s before saving ${tabData.tabName}...`);
                        await new Promise(resolve => setTimeout(resolve, delay));

                        const saveResult = await this.saveTabToDatabaseSafely(tabData);

                        if (saveResult) {
                            successCount++;
                            console.log(`✅ Tab ${tabData.tabName} saved successfully`);
                        } else {
                            failureCount++;
                            console.warn(`⚠️ Tab ${tabData.tabName} save failed`);

                            // If video tab fails, add extra delay before next attempt
                            if (tabData.isVideo) {
                                await new Promise(resolve => setTimeout(resolve, 3000));
                            }
                        }
                    } else {
                        // If no PageMethods, just update UI
                        successCount++;
                        console.log(`✅ Tab ${tabData.tabName} UI updated (no database save)`);
                    }

                    // If it's an assessment tab, try to skip it
                    if (tabData.typeFlag === -2) {
                        await this.skipAssessmentInTab(tabData.tabId);
                    }

                } catch (error) {
                    console.error(`❌ Error processing tab ${tabData.tabName}:`, error);
                    failureCount++;

                    // Extra delay after error
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }

                // Update progress
                this.updateStatus(`Processed ${i + 1}/${tabsToProcess.length} tabs`);
            }

            console.log(`Processing complete: ${successCount} successful, ${failureCount} failed`);

            // Return true if majority succeeded
            return successCount > failureCount;

        } catch (error) {
            console.error("Error processing tabs:", error);
            return false;
        }
    }

    async triggerLessonCompletion() {
        try {
            console.log("Triggering lesson completion...");

            // Try to find and click completion buttons
            const completionButtons = [
                document.querySelector('#btnComplete'),
                document.querySelector('#btnMarkComplete'),
                document.querySelector('#btnFinish'),
                document.querySelector('[onclick*="CompleteLesson"]'),
                document.querySelector('[onclick*="MarkComplete"]')
            ].filter(btn => btn && !btn.disabled);

            for (const button of completionButtons) {
                console.log(`Clicking completion button: ${button.id || button.textContent}`);
                button.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Try to call VU's completion functions if they exist
            if (typeof UpdateTabStatus === 'function') {
                UpdateTabStatus("Completed", "0", "-2");
            }

            if (typeof UpdateLessonCompletion === 'function') {
                UpdateLessonCompletion();
            }

            console.log("✅ Lesson completion triggered");

        } catch (error) {
            console.warn("⚠️ Could not trigger lesson completion:", error);
        }
    }

    async processAllTabs() {
        console.log("Processing all tabs...");

        try {
            // Get all tab IDs
            const allTabElements = document.querySelectorAll('a.nav-link[id^="tabHeader"]');
            const tabsToProcess = [];

            // Collect all tab data
            for (const tabElement of allTabElements) {
                const tabId = tabElement.id.replace('tabHeader', '');
                const tabData = this.extractTabData(tabId);
                if (tabData) {
                    tabsToProcess.push(tabData);
                }
            }

            console.log(`Found ${tabsToProcess.length} tabs to process:`, tabsToProcess);

            // Process each tab
            for (const tabData of tabsToProcess) {
                await this.processSingleTab(tabData);
                await new Promise(resolve => setTimeout(resolve, 500)); // Delay between tabs
            }

        } catch (error) {
            console.error("Error processing tabs:", error);
            throw error;
        }
    }

    extractTabData(tabId) {
        try {
            const contentId = document.getElementById(`hfContentID${tabId}`)?.value;
            if (!contentId) return null;

            const studentId = document.getElementById("hfStudentID")?.value;
            const courseCode = document.getElementById("hfCourseCode")?.value;
            const semester = document.getElementById("hfEnrollmentSemester")?.value || "";
            const lessonNo = document.getElementById("MainContent_lblLessonTitle")?.getAttribute("title")?.match(/Lesson\s*(\d+)/)?.[1];

            const videoId = document.getElementById(`hfVideoID${tabId}`)?.value;
            const isVideo = document.getElementById(`hfIsVideo${tabId}`)?.value === "1";
            const tabType = document.getElementById(`hfTabType${tabId}`)?.value || "";
            const tabName = document.querySelector(`#tabHeader${tabId}`)?.textContent?.trim() || `Tab ${tabId}`;

            // Determine type flag
            let typeFlag = 0; // Default for reading
            if (isVideo) {
                typeFlag = 1;
            } else if (tabType.includes("formativeassessment") || tabType.includes("assessment")) {
                typeFlag = -2;
            }

            return {
                tabId,
                contentId,
                videoId,
                isVideo,
                tabType,
                typeFlag,
                tabName,
                studentId,
                courseCode,
                semester,
                lessonNo
            };
        } catch (error) {
            console.error(`Error extracting data for tab ${tabId}:`, error);
            return null;
        }
    }

    async processSingleTab(tabData) {
        console.log(`Processing tab: ${tabData.tabName} (${tabData.tabId})`);

        try {
            // Update UI status
            this.updateTabStatus(tabData.tabId, 'Completed');

            // Save to database via PageMethods
            if (typeof PageMethods?.SaveStudentVideoLog === 'function') {
                await this.saveTabToDatabase(tabData);
            }

            // If it's an assessment tab, try to skip it
            if (tabData.typeFlag === -2) {
                await this.skipAssessmentInTab(tabData.tabId);
            }

            console.log(`✅ Tab ${tabData.tabName} processed successfully`);

        } catch (error) {
            console.error(`❌ Error processing tab ${tabData.tabName}:`, error);
            // Continue with other tabs even if one fails
        }
    }

    async saveTabToDatabaseSafely(tabData) {
        return new Promise((resolve) => {
            try {
                // Get actual video duration for video tabs, otherwise use defaults
                let totalDuration = 60; // Default 1 minute for reading

                if (tabData.isVideo) {
                    totalDuration = this.getVideoDuration(tabData.tabId);
                } else if (tabData.typeFlag === -2) {
                    totalDuration = 120; // 2 minutes for assessments
                }

                // Calculate watched duration based on content type
                const watchedDuration = this.calculateWatchedDuration(totalDuration, tabData.tabId);

                console.log(`Saving tab ${tabData.tabName}: total=${totalDuration}s, watched=${watchedDuration}s, type=${tabData.typeFlag}`);

                // Set timeout for the request
                const timeout = setTimeout(() => {
                    console.warn(`⚠️ Timeout saving ${tabData.tabName}`);
                    resolve(false);
                }, 15000); // 15 second timeout (increased for video processing)

                PageMethods.SaveStudentVideoLog(
                    tabData.studentId,
                    tabData.courseCode,
                    tabData.semester,
                    tabData.lessonNo,
                    tabData.contentId,
                    watchedDuration, // Actual watched duration
                    totalDuration,   // Actual total duration
                    tabData.videoId || "",
                    tabData.typeFlag,
                    window.location.href,
                    (result) => {
                        clearTimeout(timeout);
                        console.log(`✅ ${tabData.tabName} saved:`, result);
                        resolve(true);
                    },
                    (error) => {
                        clearTimeout(timeout);
                        console.warn(`⚠️ ${tabData.tabName} save error:`, error);

                        // Check for specific error types
                        if (error && error.message && (
                            error.message.includes('502') ||
                            error.message.includes('gateway') ||
                            error.message.includes('timeout')
                        )) {
                            console.log("Server error detected, will retry once");
                            // Could implement retry logic here
                        }

                        resolve(false);
                    }
                );

            } catch (error) {
                console.error(`❌ Exception saving ${tabData.tabName}:`, error);
                resolve(false);
            }
        });
    }

    async saveTabToDatabase(tabData) {
        return new Promise((resolve, reject) => {
            try {
                // Get actual video duration for video tabs, otherwise use defaults
                let totalDuration = 60; // Default 1 minute for reading

                if (tabData.isVideo) {
                    totalDuration = this.getVideoDuration(tabData.tabId);
                } else if (tabData.typeFlag === -2) {
                    totalDuration = 120; // 2 minutes for assessments
                }

                // Calculate watched duration based on content type
                const watchedDuration = this.calculateWatchedDuration(totalDuration, tabData.tabId);

                console.log(`Saving tab ${tabData.tabName}: total=${totalDuration}s, watched=${watchedDuration}s, type=${tabData.typeFlag}`);

                PageMethods.SaveStudentVideoLog(
                    tabData.studentId,
                    tabData.courseCode,
                    tabData.semester,
                    tabData.lessonNo,
                    tabData.contentId,
                    watchedDuration, // Actual watched duration
                    totalDuration,   // Actual total duration
                    tabData.videoId || "",
                    tabData.typeFlag,
                    window.location.href,
                    (result) => {
                        console.log(`✅ ${tabData.tabName} saved:`, result);
                        resolve(result);
                    },
                    (error) => {
                        console.warn(`⚠️ ${tabData.tabName} save error:`, error);
                        // Don't reject, just resolve with false to continue
                        resolve(false);
                    }
                );
            } catch (error) {
                console.error(`❌ Exception saving ${tabData.tabName}:`, error);
                resolve(false);
            }
        });
    }

    async skipAssessmentInTab(tabId) {
        try {
            // Try to find and click assessment skip buttons
            const skipSelectors = [
                `#btnSkipAssessment${tabId}`,
                `#btnSkip${tabId}`,
                `[onclick*="SkipAssessment"][onclick*="${tabId}"]`,
                `[onclick*="SkipQuestion"][onclick*="${tabId}"]`
            ];

            for (const selector of skipSelectors) {
                const button = document.querySelector(selector);
                if (button && !button.disabled) {
                    console.log(`Clicking skip button: ${selector}`);
                    button.click();
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    break;
                }
            }
        } catch (error) {
            console.warn(`Could not skip assessment in tab ${tabId}:`, error);
        }
    }

    extractLectureData() {
        const studentId = document.getElementById("hfStudentID")?.value;
        const courseCode = document.getElementById("hfCourseCode")?.value;
        const lessonNo = document.getElementById("MainContent_lblLessonTitle")?.getAttribute("title")?.match(/Lesson\s*(\d+)/)?.[1];

        // Get current tab info
        const activeTabId = document.getElementById("hfActiveTab")?.value?.replace("tabHeader", "");
        const contentId = document.getElementById(`hfContentID${activeTabId}`)?.value;
        const videoId = document.getElementById(`hfVideoID${activeTabId}`)?.value;
        const isVideo = document.getElementById(`hfIsVideo${activeTabId}`)?.value === "1";

        return {
            studentId,
            courseCode,
            lessonNo,
            contentId,
            videoId,
            isVideo,
            activeTabId
        };
    }

    async saveVideoProgress(data) {
        console.log("saveVideoProgress", data);
        return new Promise((resolve, reject) => {
            if (typeof PageMethods?.SaveStudentVideoLog === 'function') {
                try {
                    // VU LMS expects these parameters in this order:
                    // 1. Student ID
                    // 2. Course Code
                    // 3. Semester (you're missing this)
                    // 4. Lesson No
                    // 5. Content ID
                    // 6. Watched Duration
                    // 7. Total Duration
                    // 8. Video ID
                    // 9. Type Flag (1 for video, -2 for assessment, 0 for reading)
                    // 10. Page URL

                    // Get semester from page
                    const semester = document.getElementById("hfEnrollmentSemester")?.value || "";
                    const enrollmentYear = document.getElementById("hfEnrollmentYear")?.value || "";
                    const academicYear = document.getElementById("hfAcademicYear")?.value || "";

                    // Use semester or combine year info
                    const semesterInfo = semester || `${enrollmentYear}-${academicYear}`;

                    // Determine type flag: 1 for video, -2 for assessment, 0 for reading
                    const tabType = document.getElementById(`hfTabType${data.activeTabId}`)?.value || "";
                    let typeFlag = data.isVideo ? 1 : 0;
                    if (tabType.includes("formativeassessment") || tabType.includes("assessment")) {
                        typeFlag = -2;
                    }

                    console.log("Calling PageMethods.SaveStudentVideoLog with:", {
                        studentId: data.studentId,
                        courseCode: data.courseCode,
                        semester: semesterInfo,
                        lessonNo: data.lessonNo,
                        contentId: data.contentId,
                        watchedDuration: 60,
                        totalDuration: 60,
                        videoId: data.videoId,
                        typeFlag: typeFlag,
                        pageUrl: window.location.href
                    });

                    PageMethods.SaveStudentVideoLog(
                        data.studentId,
                        data.courseCode,
                        semesterInfo,
                        data.lessonNo,
                        data.contentId,
                        60, // watched duration
                        60, // total duration
                        data.videoId,
                        typeFlag,
                        window.location.href,
                        (result) => {
                            console.log("SaveStudentVideoLog success:", result);
                            this.updateTabStatus(data.activeTabId, 'Completed');
                            resolve(result);
                        },
                        (error) => {
                            console.error("SaveStudentVideoLog error:", error);
                            reject(new Error(`Save failed: ${error}`));
                        }
                    );
                } catch (error) {
                    console.error("Error in saveVideoProgress:", error);
                    reject(error);
                }
            } else {
                console.error("PageMethods.SaveStudentVideoLog not available");
                reject(new Error('PageMethods not available'));
            }
        });
    }

    updateTabStatus(tabId, status) {
        console.log(`Updating tab ${tabId} status to: ${status}`);

        try {
            // Update hidden status field
            const statusElement = document.getElementById(`hfTabCompletionStatus${tabId}`);
            if (statusElement) {
                statusElement.value = status;
            }

            // Update video status indicator
            const videoStatus = document.getElementById(`lblVCompletionStatus${tabId}`);
            if (videoStatus) {
                videoStatus.innerHTML = "<i class='fa fa-check text-success'></i> Viewed";
                videoStatus.style.color = "green";
            }

            // Update reading status indicator
            const readStatus = document.getElementById(`lblRCompletionStatus${tabId}`);
            if (readStatus) {
                readStatus.innerHTML = "<i class='fa fa-check text-success'></i> Completed";
                readStatus.style.color = "green";
            }

            // Update progress bar if exists
            const progressBar = document.getElementById(`pBarVideo${tabId}`);
            if (progressBar) {
                progressBar // ==#TODO#==: Update progress bar if needed
            }

            // Enable tab navigation
            const tabElement = document.getElementById(`liHeader${tabId}`);
            if (tabElement) {
                tabElement.classList.remove("disabled");
            }

            const tabLink = document.getElementById(`tabHeader${tabId}`);
            if (tabLink) {
                tabLink.classList.remove("disabled");
                tabLink.style.pointerEvents = "auto";
            }

        } catch (error) {
            console.error(`Error updating tab ${tabId} status:`, error);
        }
    }

    randomDuration(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    getVideoDuration(tabId) {
        try {
            // Check if video is available on YouTube
            const isOnYoutube = document.getElementById(`hfIsAvailableOnYoutube${tabId}`)?.value === "True";

            if (isOnYoutube) {
                // YouTube player
                if (typeof CurrentPlayer !== 'undefined' && CurrentPlayer.getDuration) {
                    const duration = CurrentPlayer.getDuration();
                    console.log(`YouTube video duration: ${duration} seconds`);
                    return duration;
                }
            } else {
                // VU's own video player
                if (typeof CurrentLVPlayer !== 'undefined' && CurrentLVPlayer.duration) {
                    const duration = CurrentLVPlayer.duration;
                    console.log(`VU video duration: ${duration} seconds`);
                    return duration;
                }
            }

            // Fallback: try to get from video element
            const videoElement = document.querySelector('video');
            if (videoElement && videoElement.duration && videoElement.duration > 0) {
                console.log(`HTML5 video duration: ${videoElement.duration} seconds`);
                return videoElement.duration;
            }

            // Last resort: get from data attributes or estimate
            const durationAttr = document.querySelector(`[data-duration="${tabId}"]`)?.getAttribute('data-duration');
            if (durationAttr) {
                return parseFloat(durationAttr);
            }

            console.log(`Could not determine video duration for tab ${tabId}, using default`);
            return 300; // Default 5 minutes

        } catch (error) {
            console.error(`Error getting video duration for tab ${tabId}:`, error);
            return 300; // Default 5 minutes
        }
    }

    calculateWatchedDuration(totalDuration, tabId) {
        try {
            // For videos, watch between 1/3 and 2/3 of the video. For reading/assessment, use shorter durations

            const isVideo = document.getElementById(`hfIsVideo${tabId}`)?.value === "1";
            const tabType = document.getElementById(`hfTabType${tabId}`)?.value || "";

            if (isVideo) {
                // For videos: watch between 1/3 and 2/3 of the video
                const minWatched = Math.floor(totalDuration / 3);
                const maxWatched = Math.floor(totalDuration * 2 / 3);
                const watched = this.randomDuration(minWatched, maxWatched);

                console.log(`Video tab ${tabId}: total=${totalDuration}s, watched=${watched}s (${Math.round(watched / totalDuration * 100)}%)`);
                return watched;

            } else if (tabType.includes("formativeassessment") || tabType.includes("assessment")) {
                // For assessments: between 30-120 seconds
                return this.randomDuration(30, 120);

            } else {
                // For reading content: between 10-60 seconds
                return this.randomDuration(10, 60);
            }

        } catch (error) {
            console.error(`Error calculating watched duration for tab ${tabId}:`, error);
            return 60; // Default 1 minute
        }
    }

    async markReadingContent() {
        // Mark all reading content tabs as completed
        const readingTabs = Array.from(document.querySelectorAll('a.nav-link[id^="tabHeader"]'))
            .filter(tab => {
                const tabId = tab.id.replace('tabHeader', '');
                const isVideo = document.getElementById(`hfIsVideo${tabId}`)?.value === "1";
                return !isVideo;
            });
        console.log("readingTabs", readingTabs);
        for (const tab of readingTabs) {
            const tabId = tab.id.replace('tabHeader', '');
            const readStatus = document.getElementById(`lblRCompletionStatus${tabId}`);
            // this.updateTabStatus(tabId, 'Completed');
            console.log("readStatus", readStatus);
            if (readStatus) {
                readStatus.innerHTML = "<i class='fa fa-check text-success'></i> Completed";
            }
        }
    }

    async safeNavigateToNext() {
        try {
            console.log("Checking if navigation is safe...");

            // First, check if lesson is actually completed
            const isCompleted = await this.verifyLessonCompletion();

            if (!isCompleted) {
                this.showNotification('⚠️ Lesson not fully completed. Please wait or refresh.', 'warning');
                return false;
            }

            // Check if next button exists and is enabled
            const nextButton = document.querySelector('#lbtnNextLesson');

            if (!nextButton) {
                this.showNotification('Next lecture button not found', 'warning');
                return false;
            }

            if (nextButton.disabled || nextButton.classList.contains('disabled')) {
                // Check completion status
                const allTabs = document.querySelectorAll('a.nav-link[id^="tabHeader"]');
                let completedTabs = 0;

                for (const tab of allTabs) {
                    const tabId = tab.id.replace('tabHeader', '');
                    const status = document.getElementById(`hfTabCompletionStatus${tabId}`)?.value;
                    if (status === 'Completed') completedTabs++;
                }

                console.log(`${completedTabs}/${allTabs.length} tabs marked as completed`);

                if (completedTabs === allTabs.length) {
                    // All tabs are marked completed, so lesson should be complete
                    // Try to enable the button
                    nextButton.disabled = false;
                    nextButton.classList.remove('disabled');

                    // Wait a moment for UI to update
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                    this.showNotification(`Complete all ${allTabs.length} tabs first (${completedTabs} done)`, 'warning');
                    return false;
                }
            }

            // Now attempt navigation
            return await this.attemptNavigation(nextButton);

        } catch (error) {
            console.error("Error in safeNavigateToNext:", error);
            this.showNotification(`Navigation error: ${error.message}`, 'error');
            return false;
        }
    }

    async verifyLessonCompletion() {
        try {
            // Check if all tabs are marked as completed in the UI
            const allTabElements = document.querySelectorAll('a.nav-link[id^="tabHeader"]');

            for (const tabElement of allTabElements) {
                const tabId = tabElement.id.replace('tabHeader', '');

                // Check both hidden status and visual status
                const hiddenStatus = document.getElementById(`hfTabCompletionStatus${tabId}`)?.value;
                const videoStatus = document.getElementById(`lblVCompletionStatus${tabId}`);
                const readStatus = document.getElementById(`lblRCompletionStatus${tabId}`);

                // If any tab is not marked as completed, return false
                if (hiddenStatus !== 'Completed' &&
                    !videoStatus?.innerHTML.includes('fa-check') &&
                    !readStatus?.innerHTML.includes('fa-check')) {
                    console.log(`Tab ${tabId} not completed`);
                    return false;
                }
            }

            return true;
        } catch (error) {
            console.error("Error verifying completion:", error);
            return false;
        }
    }

    async attemptNavigation(nextButton) {
        try {
            console.log("Attempting navigation...");

            // Store current URL
            const currentUrl = window.location.href;

            // Method 1: Standard click
            if (nextButton.click) {
                nextButton.click();
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            // Check if navigation occurred
            if (window.location.href !== currentUrl) {
                console.log("✅ Navigation successful via click");
                this.showNotification('Moving to next lecture...', 'success');
                return true;
            }

            // Method 2: If button has href, use it directly
            if (nextButton.href) {
                console.log("Using href navigation");
                window.location.href = nextButton.href;
                return true;
            }

            // Method 3: Try AJAX navigation if available
            if (typeof __doPostBack === 'function') {
                console.log("Trying __doPostBack");
                __doPostBack('lbtnNextLesson', '');
                await new Promise(resolve => setTimeout(resolve, 3000));

                if (window.location.href !== currentUrl) {
                    console.log("✅ Navigation successful via __doPostBack");
                    return true;
                }
            }

            console.log("❌ All navigation methods failed");
            this.showNotification('Navigation failed. Please click Next manually.', 'error');
            return false;

        } catch (error) {
            console.error("Error in attemptNavigation:", error);
            return false;
        }
    }

    async goToNextLecture() {
        try {
            console.log("Attempting to navigate to next lecture...");

            const nextButton = document.querySelector('#lbtnNextLesson');

            if (!nextButton) {
                console.log("Next lecture button not found");
                this.showNotification('Next lecture button not found', 'warning');
                return false;
            }

            if (nextButton.disabled || nextButton.classList.contains('disabled')) {
                console.log("Next lecture button is disabled");

                // Check why it's disabled
                const lessonStatus = document.querySelector('#hfLessonStatus')?.value;
                const completionStatus = document.querySelector('#hfCompletionStatus')?.value;

                console.log("Lesson status:", lessonStatus);
                console.log("Completion status:", completionStatus);

                // Try to force enable it
                nextButton.disabled = false;
                nextButton.classList.remove('disabled');

                // Check if it's still disabled
                if (nextButton.disabled) {
                    this.showNotification('Complete current lesson requirements first', 'warning');
                    return false;
                }
            }

            console.log("Clicking next lecture button...");

            // Store current URL before navigation
            const currentUrl = window.location.href;

            // Multiple click methods to ensure it works
            const clickMethods = [
                () => { if (nextButton.click) nextButton.click(); },
                () => { if (nextButton.onclick) nextButton.onclick(); },
                () => {
                    const event = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: window
                    });
                    nextButton.dispatchEvent(event);
                }
            ];

            // Try all click methods
            for (const clickMethod of clickMethods) {
                try {
                    clickMethod();
                    await new Promise(resolve => setTimeout(resolve, 100));

                    // Check if navigation occurred
                    if (window.location.href !== currentUrl) {
                        console.log("✅ Navigation successful");
                        return true;
                    }
                } catch (error) {
                    console.warn("Click method failed:", error);
                }
            }

            // If still on same page, try direct href navigation
            if (nextButton.href && window.location.href === currentUrl) {
                console.log("Using href navigation:", nextButton.href);
                window.location.href = nextButton.href;
                return true;
            }

            console.log("❌ Navigation failed");
            this.showNotification('Could not navigate to next lecture', 'error');
            return false;

        } catch (error) {
            console.error("Error in goToNextLecture:", error);
            this.showNotification(`Navigation error: ${error.message}`, 'error');
            return false;
        }
    }

    async waitForNavigation(timeout = 10000) {
        return new Promise((resolve) => {
            const startUrl = window.location.href;
            const startTime = Date.now();

            // Check every 100ms if URL changed
            const interval = setInterval(() => {
                if (window.location.href !== startUrl) {
                    clearInterval(interval);
                    resolve(true);
                } else if (Date.now() - startTime > timeout) {
                    clearInterval(interval);
                    resolve(false);
                }
            }, 100);
        });
    }

    // GDB Methods
    enableCopyPaste() {
        // Remove copy/paste restrictions
        document.addEventListener('copy', e => e.stopPropagation(), true);
        document.addEventListener('paste', e => e.stopPropagation(), true);
        document.addEventListener('cut', e => e.stopPropagation(), true);

        // Enable CKEDITOR editing
        const editorFrames = document.querySelectorAll('iframe[title*="editor"]');
        editorFrames.forEach(frame => {
            try {
                const doc = frame.contentDocument || frame.contentWindow.document;
                doc.designMode = 'on';
                doc.body.contentEditable = true;
            } catch (error) {
                console.warn('Could not enable editor:', error);
            }
        });

        this.showNotification('📝 Copy/Paste enabled!', 'success');
    }

    extractGDBQuestion() {
        const selectors = [
            '#MainContent_divDescription',
            '#lblQuestion',
            '.question-text',
            '[id*="Question"]'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim().length > 20) {
                return element.textContent.trim();
            }
        }

        return '';
    }

    async getAIResponse(content, type, apiKey) {
        const prompt = type === 'gdb' ?
            `You are a Virtual University expert. Write a comprehensive answer for this GDB question:\n\n${content}\n\nFormat with proper paragraphs, bullet points where needed, and academic tone.` :
            `Analyze this quiz question and provide the correct answer with explanation:\n\n${content}`;
        console.log("prompt:", prompt)
        // Using fetch to call AI API
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: prompt }],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.2,
                        topK: 1,
                        topP: 1,
                        maxOutputTokens: 2048,
                    },
                }),
            }
        );

        if (!response.ok) throw new Error('AI service error');

        const data = await response.json();
        return data.response || data.choices?.[0]?.text;
    }

    async fillGDBAnswer(answer) {
        const editorFrame = document.querySelector('iframe[title*="editor"]');
        if (editorFrame) {
            try {
                const doc = editorFrame.contentDocument || editorFrame.contentWindow.document;
                doc.body.innerHTML = this.formatAnswerHTML(answer);
                this.showNotification('✅ Answer filled in editor', 'success');
            } catch (error) {
                this.showNotification('Could not fill editor, copying to clipboard', 'warning');
                await navigator.clipboard.writeText(answer);
            }
        } else {
            // Try textarea fallback
            const textarea = document.querySelector('textarea');
            if (textarea) {
                textarea.value = answer;
                this.showNotification('✅ Answer filled', 'success');
            }
        }
    }

    formatAnswerHTML(text) {
        // Convert markdown-like text to HTML
        return text
            .replace(/^# (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h4>$1</h4>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^\* (.*$)/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
            .replace(/\n\n/g, '<br><br>');
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

        // Add animation styles
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