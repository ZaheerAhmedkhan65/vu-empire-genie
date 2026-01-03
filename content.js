// content.js
class VUGenie {
  constructor() {
    this.pageType = this.detectPageType();
    this.isInitialized = false;
    this.init();
  }

  detectPageType() {
    const url = window.location.href;
    if (url.includes('LessonViewer.aspx')) return 'lecture';
    if (url.includes('Quiz/') || url.includes('FormativeAssessment/')) return 'quiz';
    if (url.includes('GDB/StudentMessage.aspx')) return 'gdb';
    return 'general';
  }

  async init() {
    if (this.isInitialized) return;

    // Wait for page to load
    await this.waitForPageReady();

    // Inject UI
    this.injectUI();

    // Initialize page-specific features
    await this.initPageFeatures();

    this.isInitialized = true;
  }

  async waitForPageReady() {
    return new Promise(resolve => {
      if (document.readyState === 'complete') {
        setTimeout(resolve, 1000);
      } else {
        window.addEventListener('load', () => {
          setTimeout(resolve, 1000);
        });
      }
    });
  }

  injectUI() {
    if (document.getElementById('vu-genie-ui')) return;

    const container = document.createElement('div');
    container.id = 'vu-genie-ui';
    container.innerHTML = this.getUITemplate();

    // Add styles
    this.injectStyles();

    document.body.appendChild(container);

    // Attach event listeners
    this.attachEventListeners();
  }

  getUITemplate() {
    const title = this.pageType === 'lecture' ? '🎥 Lecture Assistant' :
      this.pageType === 'quiz' ? '📝 Quiz Assistant' :
        this.pageType === 'gdb' ? '🧠 GDB Assistant' : '🧞‍♂️ VU Genie';

    return `
      <div class="vu-genie-container">
        <div class="vu-genie-header">
          <h3>${title}</h3>
          <button class="vu-genie-close">×</button>
        </div>
        <div class="vu-genie-content" id="vu-genie-content">
          ${this.getButtonsTemplate()}
        </div>
        <div class="vu-genie-status" id="vu-genie-status">Ready</div>
      </div>
    `;
  }

  getButtonsTemplate() {
    switch (this.pageType) {
      case 'lecture':
        return `
          <button class="vu-btn primary" data-action="mark-watched">
            Mark as Watched
          </button>
        `;

      case 'gdb':
        return `
          <button class="vu-btn primary" data-action="enable-copy-paste">
            Enable Copy/Paste
          </button>
          <button class="vu-btn secondary" data-action="solve-with-ai">
            Solve with AI
          </button>
          <button class="vu-btn" data-action="format-answer">
            ✨ Format Answer
          </button>
        `;

      case 'quiz':
        return `
          <button class="vu-btn primary" data-action="copy-quiz">
            Copy Quiz
          </button>
          <button class="vu-btn secondary" data-action="solve-with-ai">
            Solve with AI
          </button>
          <button class="vu-btn" data-action="auto-select">
            Auto Select
          </button>
          <button class="vu-btn" data-action="save-quiz">
            Save Quiz Data
          </button>
        `;

      default:
        return `
          <button class="vu-btn" data-action="open-options">
            ⚙️ Settings
          </button>
        `;
    }
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
        display: flex;
        align-items: center;
        gap: 8px;
        justify-content: flex-start;
      }
      
      .vu-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }
      
      .vu-btn.primary {
        background: #10b981;
        color: white;
      }
      
      .vu-btn.secondary {
        background: #8b5cf6;
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

    // Action buttons
    container.querySelectorAll('.vu-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        this.handleAction(action);
      });
    });
  }

  async handleAction(action) {
    this.updateStatus('Processing...');

    switch (action) {
      case 'mark-watched':
        await this.markLectureAsWatched();
        break;

      case 'enable-copy-paste':
        this.enableCopyPaste();
        break;

      case 'solve-with-ai':
        await this.solveWithAI();
        break;

      case 'copy-quiz':
        await this.copyQuiz();
        break;

      case 'auto-select':
        await this.autoSelectAnswers();
        break;

      case 'save-quiz':
        await this.saveQuizData();
        break;

      case 'open-options':
        chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' });
        break;
    }

    this.updateStatus('Ready');
  }

  updateStatus(message) {
    const statusElement = document.getElementById('vu-genie-status');
    if (statusElement) {
      statusElement.textContent = message;
    }
  }

  // Lecture Methods
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

  async solveWithAI() {
    try {
      this.updateStatus('Extracting quiz...');
      const apiKey = await this.getApiKeyFromBackground();
      // Extract quiz data
      const quizData = await this.extractQuizForAI();

      if (!quizData || !quizData.question || quizData.options.length === 0) {
        this.showNotification('❌ Could not extract quiz question', 'error');
        return;
      }

      console.log('Quiz data extracted:', quizData);

      // Get API key via message to background script
      this.updateStatus('Getting API key...');
      // const apiKey = await this.getApiKeyFromBackground();

      if (!apiKey) {
        this.showNotification('Please set your Gemini API key in extension settings', 'error');
        // Open options page
        chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' });
        return;
      }

      this.updateStatus('Solving with Gemini AI...');

      // Get AI response
      const aiResponse = await this.getGeminiQuizResponse(quizData, apiKey);

      // Parse and apply the solution
      await this.applyQuizSolution(quizData, aiResponse);

    } catch (error) {
      console.error('Error in solveWithAI:', error);
      this.showNotification(`❌ AI Error: ${error.message}`, 'error');
    } finally {
      this.updateStatus('Ready');
    }
  }

  async getApiKeyFromBackground() {
    return new Promise((resolve, reject) => {
      try {
        // Check if chrome.runtime is available
        if (!chrome.runtime || !chrome.runtime.sendMessage) {
          console.error('chrome.runtime.sendMessage is not available');
          resolve(null);
          return;
        }

        // Set a timeout to prevent hanging
        const timeout = setTimeout(() => {
          console.warn('Timeout getting API key from background');
          resolve(null);
        }, 5000); // 5 second timeout

        chrome.runtime.sendMessage(
          { type: 'GET_API_KEY' },
          (response) => {
            clearTimeout(timeout);

            if (chrome.runtime.lastError) {
              console.error('Error getting API key:', chrome.runtime.lastError.message);
              resolve(null);
              return;
            }

            resolve(response?.apiKey || null);
          }
        );
      } catch (error) {
        console.error('Exception in getApiKeyFromBackground:', error);
        resolve(null);
      }
    });
  }

  async getGeminiQuizResponse(quizData, apiKey) {
    try {
      // Format the prompt for Gemini
      const prompt = this.formatQuizPrompt(quizData);

      console.log('Sending to Gemini:', prompt);
      console.log('API Key:', apiKey);
      // Call Gemini API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.1, // Low temperature for precise answers
              topK: 1,
              topP: 1,
              maxOutputTokens: 1000
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${errorData.error?.message || response.status}`);
      }

      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      console.log('Gemini response:', aiText);
      return aiText;

    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  formatQuizPrompt(quizData) {
    // Clean the question text by removing garbled nonsense
    let cleanQuestion = quizData.question;

    // Remove common garbled text patterns from VU quizzes
    const garbagePatterns = [
      /[A-Z][a-z]{2,4}\d{2,}[A-Za-z\d\s]{10,}/g, // Pattern like "Lrwio p8iOy vdMYI"
      /[A-Za-z0-9]{10,}\s+[A-Za-z0-9]{10,}/g, // Long random strings
      /[A-Z]{2,}\d{2,}[A-Z0-9\s]+/g // Mixed case patterns
    ];

    for (const pattern of garbagePatterns) {
      cleanQuestion = cleanQuestion.replace(pattern, '');
    }

    // Also remove any single letters or very short words that are likely noise
    cleanQuestion = cleanQuestion.split('\n')
      .filter(line => line.trim().length > 3 && !line.match(/^[a-z]\s*$/))
      .join('\n')
      .trim();

    let prompt = `You are an expert tutor for Virtual University of Pakistan. Analyze this quiz question and provide the correct answer.\n\n`;

    // Course context
    prompt += `Course: ${quizData.courseName} (${quizData.courseCode})\n\n`;

    // Question (cleaned)
    prompt += `QUESTION:\n${cleanQuestion}\n\n`;

    // Options
    prompt += `OPTIONS:\n`;
    quizData.options.forEach(opt => {
      prompt += `${opt.letter}. ${opt.text}\n`;
    });

    prompt += `\nINSTRUCTIONS:\n`;
    prompt += `1. Analyze the database administration question carefully\n`;
    prompt += `2. Based on standard database knowledge, identify which option is correct\n`;
    prompt += `3. Provide ONLY the letter(s) of the correct option(s) in this exact format:\n`;
    prompt += `   CORRECT_ANSWER: [Letter]\n`;
    prompt += `   EXPLANATION: [Brief 1-2 sentence explanation]\n\n`;

    prompt += `RULES:\n`;
    prompt += `- For single correct answer: Use format "CORRECT_ANSWER: A" (A, B, C, or D only)\n`;
    prompt += `- Do NOT include any other text before or after these lines\n`;
    prompt += `- Explanation should be concise and technical\n`;
    prompt += `- Base answer on standard database administration concepts\n`;

    return prompt;
  }

  async extractQuizForAI() {
    try {
      // Extract question text
      const question = this.extractQuizQuestion();
      if (!question) {
        throw new Error('No question found');
      }

      // Extract options
      const options = this.extractQuizOptionsWithIndices();

      // Extract course info
      const courseInfo = this.getCourseInfo();

      return {
        question: question.trim(),
        options: options,
        courseCode: courseInfo.code,
        courseName: courseInfo.name,
        timestamp: new Date().toISOString(),
        url: window.location.href
      };

    } catch (error) {
      console.error('Error extracting quiz:', error);
      return null;
    }
  }

  extractQuizOptionsWithIndices() {
    const options = [];

    // Try different selectors for quiz options
    const optionSelectors = [
      'table table table td > div span[id^="lblExpression"]',
      '.quiz-option',
      '.option-text',
      '[id*="Option"]',
      '.answer-option',
      'input[type="radio"] + label',
      'input[type="checkbox"] + label'
    ];

    let optionElements = [];

    for (const selector of optionSelectors) {
      optionElements = Array.from(document.querySelectorAll(selector));
      if (optionElements.length >= 2) break;
    }

    optionElements.forEach((el, index) => {
      const text = el.textContent?.trim() || el.innerText?.trim() || '';
      if (text && text.length > 0) {
        options.push({
          index: index,
          letter: String.fromCharCode(65 + index),
          text: text,
          element: el
        });
      }
    });

    return options;
  }

  getCourseInfo() {
    const courseEl = document.querySelector('#lblCourseCode, #m_lblCourseCode, .course-code');
    let code = 'Unknown';
    let name = 'Unknown Course';

    if (courseEl) {
      const fullText = courseEl.textContent.trim();
      const codeMatch = fullText.match(/^([A-Z]{2,4}\d{3,4})/);
      code = codeMatch ? codeMatch[1] : fullText.split(' ')[0];
      name = fullText;
    }

    return { code, name };
  }

  async applyQuizSolution(quizData, aiResponse) {
    try {
      // Parse the AI response
      const solution = this.parseAIResponse(aiResponse, quizData.options);

      if (!solution || !solution.correctAnswers || solution.correctAnswers.length === 0) {
        throw new Error('Could not parse AI response');
      }

      console.log('Parsed solution:', solution);

      // Show the solution to user
      this.displayQuizSolution(quizData, solution);

      // Get auto-select setting from background
      const settings = await this.getSettingsFromBackground();
      if (settings.autoSelect !== false) { // Default to true
        await this.autoSelectQuizAnswers(solution.correctAnswers, quizData.options);
      }

      // Save quiz data for future reference
      await this.saveQuizWithAI(quizData, solution);

    } catch (error) {
      console.error('Error applying solution:', error);
      throw error;
    }
  }

  async getSettingsFromBackground() {
    return new Promise((resolve) => {
      try {
        if (!chrome.runtime || !chrome.runtime.sendMessage) {
          console.error('chrome.runtime.sendMessage is not available');
          resolve({ autoSelect: true }); // Default values
          return;
        }

        const timeout = setTimeout(() => {
          console.warn('Timeout getting settings from background');
          resolve({ autoSelect: true });
        }, 5000);

        chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
          clearTimeout(timeout);

          if (chrome.runtime.lastError) {
            console.error('Error getting settings:', chrome.runtime.lastError.message);
            resolve({ autoSelect: true });
            return;
          }

          resolve(response || { autoSelect: true });
        });
      } catch (error) {
        console.error('Exception in getSettingsFromBackground:', error);
        resolve({ autoSelect: true });
      }
    });
  }

  parseAIResponse(aiResponse, options) {
    console.log('Parsing AI response:', aiResponse);

    // Extract correct answer(s)
    let correctAnswers = [];
    let explanation = '';

    // Try to find CORRECT_ANSWER pattern (case insensitive)
    const answerMatch = aiResponse.match(/CORRECT_ANSWER\s*:\s*([A-D,]+)/i);
    if (answerMatch) {
      const letters = answerMatch[1].split(',').map(l => l.trim().toUpperCase());
      console.log('Extracted letters from AI:', letters);

      // Return both letters and full option text
      correctAnswers = letters.map(letter => {
        const option = options.find(opt => opt.letter === letter);
        return option ? { letter, text: option.text } : { letter, text: letter };
      });
    }

    // Try alternative patterns if first method didn't work
    if (correctAnswers.length === 0) {
      const patterns = [
        /answer\s*:\s*([A-D,]+)/i,
        /correct\s*(?:option|answer)\s*:\s*([A-D,]+)/i,
        /option\s*([A-D,]+)\s*is\s*correct/i,
        /^([A-D])\s*[-:]\s/i,
        /select\s*([A-D,]+)\s*(?:as|for)/i
      ];

      for (const pattern of patterns) {
        const match = aiResponse.match(pattern);
        if (match) {
          const letters = match[1].split(',').map(l => l.trim().toUpperCase());
          correctAnswers = letters.map(letter => {
            const option = options.find(opt => opt.letter === letter);
            return option ? { letter, text: option.text } : { letter, text: letter };
          });
          if (correctAnswers.length > 0) break;
        }
      }
    }

    // Extract explanation
    const explanationMatch = aiResponse.match(/EXPLANATION\s*:\s*(.+?)(?=\n\n|$)/is);
    if (explanationMatch) {
      explanation = explanationMatch[1].trim();
    } else {
      // Try to find explanation after answer
      const lines = aiResponse.split('\n');
      let foundAnswer = false;
      for (const line of lines) {
        if (line.match(/CORRECT_ANSWER|Answer:|Correct option:/i)) {
          foundAnswer = true;
          continue;
        }
        if (foundAnswer && line.trim() && !line.match(/^[A-D]\s*[-:]\s/) && !line.match(/Option\s*[A-D]/i)) {
          explanation += line.trim() + ' ';
        }
      }
      explanation = explanation.trim();
    }

    // Log parsed results
    console.log('Parsed solution:', {
      correctAnswers: correctAnswers.map(a => a.letter),
      explanation: explanation.substring(0, 100) + '...',
      rawResponse: aiResponse.substring(0, 200) + '...'
    });

    return {
      correctAnswers: correctAnswers.map(a => a.letter), // Return just letters for auto-select
      fullAnswers: correctAnswers, // Keep full info for display
      explanation,
      rawResponse: aiResponse
    };
  }

  displayQuizSolution(quizData, solution) {
    // Create solution popup
    const popup = document.createElement('div');
    popup.id = 'vu-genie-quiz-solution';
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 25px;
        border-radius: 15px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        z-index: 10001;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        font-family: 'Segoe UI', Arial, sans-serif;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.2);
        animation: slideIn 0.3s ease;
    `;

    let solutionHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0; font-size: 20px; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 24px;">🤖</span> AI Quiz Solution
            </h3>
            <button id="close-solution" style="background: rgba(255,255,255,0.2); border: none; color: white; font-size: 20px; cursor: pointer; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                ×
            </button>
        </div>
        
        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
            <div style="font-weight: bold; margin-bottom: 5px; opacity: 0.9;">Course:</div>
            <div>${quizData.courseName}</div>
        </div>
        
        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
            <div style="font-weight: bold; margin-bottom: 10px; opacity: 0.9;">Question:</div>
            <div style="line-height: 1.5;">${quizData.question}</div>
        </div>
        
        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
            <div style="font-weight: bold; margin-bottom: 10px; opacity: 0.9;">Options:</div>
    `;

    quizData.options.forEach((opt, index) => {
      const isCorrect = solution.correctAnswers.some(correct =>
        correct.includes(opt.text.substring(0, 30)) || opt.text.includes(correct.substring(0, 30))
      );

      solutionHTML += `
            <div style="margin-bottom: 8px; padding: 8px 12px; border-radius: 6px; ${isCorrect ? 'background: rgba(72, 187, 120, 0.3); border-left: 4px solid #48bb78;' : 'background: rgba(255,255,255,0.05);'}">
                <span style="font-weight: bold; margin-right: 10px;">${opt.letter}.</span>
                ${opt.text}
                ${isCorrect ? '<span style="margin-left: 10px; color: #48bb78;">✓</span>' : ''}
            </div>
        `;
    });

    solutionHTML += `</div>`;

    if (solution.correctAnswers.length > 0) {
      solutionHTML += `
    <div style="background: rgba(72, 187, 120, 0.2); padding: 15px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #48bb78;">
        <div style="font-weight: bold; margin-bottom: 10px; color: #48bb78;">Correct Answer${solution.correctAnswers.length > 1 ? 's' : ''}:</div>
        <div style="font-size: 18px; font-weight: bold;">${solution.correctAnswers.map((letter, i) => {
        const option = quizData.options.find(opt => opt.letter === letter);
        return `${letter}. ${option ? option.text : letter}`;
      }).join('<br>')}</div>
    </div>
    `;
    }

    if (solution.explanation) {
      solutionHTML += `
            <div style="background: rgba(66, 153, 225, 0.2); padding: 15px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #4299e1;">
                <div style="font-weight: bold; margin-bottom: 10px; color: #4299e1;">Explanation:</div>
                <div style="line-height: 1.5;">${solution.explanation}</div>
            </div>
        `;
    }

    // Add action buttons
    solutionHTML += `
        <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button id="auto-select-btn" style="flex: 1; padding: 12px; background: #48bb78; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 8px;">
                <span>✓</span> Auto-Select Answer
            </button>
            <button id="copy-solution-btn" style="flex: 1; padding: 12px; background: #4299e1; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 8px;">
                <span>📋</span> Copy Solution
            </button>
        </div>
        
        <div style="margin-top: 15px; text-align: center; font-size: 12px; opacity: 0.7;">
            Powered by Google Gemini AI
        </div>
    `;

    popup.innerHTML = solutionHTML;
    document.body.appendChild(popup);

    // Add event listeners
    popup.querySelector('#close-solution').addEventListener('click', () => {
      popup.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => popup.remove(), 300);
    });

    popup.querySelector('#auto-select-btn').addEventListener('click', async () => {
      await this.autoSelectQuizAnswers(solution.correctAnswers, quizData.options);
      popup.querySelector('#auto-select-btn').innerHTML = '<span>✓</span> Selected!';
      setTimeout(() => {
        popup.querySelector('#auto-select-btn').innerHTML = '<span>✓</span> Auto-Select Answer';
      }, 2000);
    });

    popup.querySelector('#copy-solution-btn').addEventListener('click', () => {
      const text = this.formatSolutionForCopy(quizData, solution);
      navigator.clipboard.writeText(text).then(() => {
        popup.querySelector('#copy-solution-btn').innerHTML = '<span>✓</span> Copied!';
        setTimeout(() => {
          popup.querySelector('#copy-solution-btn').innerHTML = '<span>📋</span> Copy Solution';
        }, 2000);
      });
    });

    // Add escape key to close
    document.addEventListener('keydown', function closeOnEscape(e) {
      if (e.key === 'Escape') {
        popup.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => popup.remove(), 300);
        document.removeEventListener('keydown', closeOnEscape);
      }
    });
  }

  formatSolutionForCopy(quizData, solution) {
    let text = `🧠 AI Quiz Solution\n`;
    text += `Course: ${quizData.courseName}\n`;
    text += `Generated: ${new Date().toLocaleString()}\n\n`;
    text += `QUESTION:\n${quizData.question}\n\n`;
    text += `OPTIONS:\n`;
    quizData.options.forEach(opt => {
      text += `${opt.letter}. ${opt.text}\n`;
    });
    text += `\n✅ CORRECT ANSWER${solution.correctAnswers.length > 1 ? 'S' : ''}:\n`;
    solution.correctAnswers.forEach((ans, i) => {
      text += `${i + 1}. ${ans}\n`;
    });
    text += `\n💡 EXPLANATION:\n${solution.explanation || 'No explanation provided.'}\n`;
    text += `\n🔗 Source: ${quizData.url}\n`;
    text += `🤖 Powered by Google Gemini AI`;
    return text;
  }

  async autoSelectQuizAnswers(correctAnswers, options) {
    try {
      console.log('Auto-selecting answers:', correctAnswers);
      console.log('Available options:', options);

      let selectedCount = 0;

      // First, try to select by letter
      for (const answer of correctAnswers) {
        // Extract letter from answer (e.g., "D" from "CORRECT_ANSWER: D")
        const letterMatch = answer.match(/^[A-D]$/i) || answer.match(/[A-D]$/i);
        const letter = letterMatch ? letterMatch[0].toUpperCase() : null;

        if (letter) {
          console.log(`Trying to select option by letter: ${letter}`);
          const option = options.find(opt => opt.letter === letter);
          if (option) {
            console.log(`Found option ${letter}: ${option.text}`);
            if (await this.selectOptionByIndex(option.index)) {
              selectedCount++;
              console.log(`✅ Selected option ${letter}`);
              continue;
            }
          }
        }

        // If letter matching fails, try text matching
        console.log(`Trying text matching for: ${answer}`);
        for (const option of options) {
          // Clean both texts for comparison
          const cleanAnswer = answer.replace(/[^A-Za-z ]/g, '').toLowerCase().trim();
          const cleanOptionText = option.text.replace(/[^A-Za-z ]/g, '').toLowerCase().trim();

          if (cleanOptionText.includes(cleanAnswer) || cleanAnswer.includes(cleanOptionText)) {
            console.log(`Text match found: ${option.text} matches ${answer}`);
            if (await this.selectOptionByIndex(option.index)) {
              selectedCount++;
              console.log(`✅ Selected option by text match`);
              break;
            }
          }
        }
      }

      if (selectedCount > 0) {
        this.showNotification(`✅ ${selectedCount} answer${selectedCount > 1 ? 's' : ''} selected`, 'success');
      } else {
        console.warn('Could not auto-select any answers');
        this.showNotification('⚠️ Could not auto-select. Please select manually.', 'warning');
      }

    } catch (error) {
      console.error('Error auto-selecting:', error);
      this.showNotification('❌ Auto-select failed', 'error');
    }
  }

  async selectOptionByIndex(index) {
    try {
      // Find the radio button by ID
      const radioButtonId = `radioBtn${index}`;
      const radioButton = document.getElementById(radioButtonId);

      if (!radioButton) {
        console.warn(`Radio button ${radioButtonId} not found`);
        return false;
      }

      console.log(`Found radio button ${radioButtonId}, type: ${radioButton.type}`);

      // Select the radio button
      radioButton.checked = true;

      // Trigger all necessary events
      const events = ['click', 'change', 'input'];
      for (const eventType of events) {
        const event = new Event(eventType, { bubbles: true });
        radioButton.dispatchEvent(event);
      }

      // Also trigger VU's EnableNextButton function if it exists
      if (typeof EnableNextButton === 'function') {
        EnableNextButton();
      }

      // Visual feedback
      const optionDiv = document.getElementById(`div${index}`);
      if (optionDiv) {
        optionDiv.style.backgroundColor = '#d4edda';
        optionDiv.style.borderLeft = '4px solid #28a745';
      }

      console.log(`✅ Successfully selected option ${index}`);
      return true;

    } catch (error) {
      console.error(`Error selecting option ${index}:`, error);
      return false;
    }
  }

  async selectOptionElement(element) {
    try {
      // Try different ways to select the option

      // 1. If it's a label for an input
      if (element.htmlFor) {
        const input = document.getElementById(element.htmlFor);
        if (input && (input.type === 'radio' || input.type === 'checkbox')) {
          input.checked = true;
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }

      // 2. If element is next to an input
      const prevSibling = element.previousElementSibling;
      if (prevSibling && (prevSibling.type === 'radio' || prevSibling.type === 'checkbox')) {
        prevSibling.checked = true;
        prevSibling.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }

      // 3. Click the element
      element.click();
      await new Promise(resolve => setTimeout(resolve, 100));

      // 4. Look for parent input
      const parentInput = element.closest('label')?.querySelector('input[type="radio"], input[type="checkbox"]');
      if (parentInput) {
        parentInput.checked = true;
        parentInput.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }

      return false;

    } catch (error) {
      console.error('Error selecting element:', error);
      return false;
    }
  }

  async saveQuizWithAI(quizData, solution) {
    try {
      // Save to background script storage
      await this.saveToBackgroundStorage({
        type: 'SAVE_QUIZ_WITH_AI',
        data: {
          ...quizData,
          solution,
          timestamp: new Date().toISOString()
        }
      });

      console.log('Quiz saved with AI solution');

    } catch (error) {
      console.error('Error saving quiz:', error);
    }
  }

  async saveToBackgroundStorage(data) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(data, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
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

  extractQuizQuestion() {
    try {
      // Look for the main question element with the proper styling
      // In VU's HTML, the actual question is inside a span with inline-block styling
      const questionSelectors = [
        'span[style*="display:inline-block;width:100%; padding-left:10px; padding-top:10px"]',
        '#divnoselect > div > span[style*="display:inline-block"]',
        'span[id*="61480"], span[id*="61510"]', // These IDs contain the actual question
        'div#divnoselect span > p' // Direct paragraph text
      ];

      for (const selector of questionSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          // Extract clean text from paragraph tags only
          const paragraphs = element.querySelectorAll('p');
          if (paragraphs.length > 0) {
            return Array.from(paragraphs).map(p => p.textContent.trim()).join(' ');
          }
          return element.textContent.trim();
        }
      }

      // Fallback: Try to find the visible question text
      const allDivs = document.querySelectorAll('div#divnoselect > div');
      for (const div of allDivs) {
        const visibleSpans = div.querySelectorAll('span:not([style*="display:none"])');
        for (const span of visibleSpans) {
          const text = span.textContent.trim();
          // Look for actual question text (not garbled nonsense)
          if (text.length > 20 &&
            !text.match(/[A-Za-z0-9]{10,}/) && // Exclude long random strings
            !text.includes('Lrwio') && // Exclude specific garbled text patterns
            text.includes('_________') || text.includes('_________________')) {
            return text;
          }
        }
      }

      return '';
    } catch (error) {
      console.error('Error extracting quiz question:', error);
      return '';
    }
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

  // Quiz Methods
  async copyQuiz() {
    const quizData = this.extractFullQuiz();
    const text = this.formatQuizText(quizData);

    await navigator.clipboard.writeText(text);
    this.showNotification('📋 Quiz copied to clipboard', 'success');
  }

  extractFullQuiz() {
    const question = this.extractQuizQuestion();
    const options = this.extractQuizOptions();

    return {
      question,
      options,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
  }

  extractQuizOptions() {
    const options = [];
    const optionElements = document.querySelectorAll('table table table td > div span[id^="lblExpression"]');

    optionElements.forEach((el, index) => {
      options.push({
        letter: String.fromCharCode(65 + index),
        text: el.textContent.trim()
      });
    });

    return options;
  }

  formatQuizText(quizData) {
    let text = `Quiz Question\n`;
    text += `URL: ${quizData.url}\n`;
    text += `Date: ${new Date(quizData.timestamp).toLocaleString()}\n\n`;
    text += `Question:\n${quizData.question}\n\n`;
    text += `Options:\n`;
    quizData.options.forEach(opt => {
      text += `${opt.letter}. ${opt.text}\n`;
    });
    return text;
  }

  async autoSelectAnswers() {
    // Try to find and select correct answers
    const correctIndicators = [
      ...document.querySelectorAll('.correct, .right-answer'),
      ...document.querySelectorAll('[style*="green"]'),
      ...document.querySelectorAll('input:checked')
    ];

    if (correctIndicators.length > 0) {
      correctIndicators.forEach(indicator => {
        if (indicator.type === 'radio' || indicator.type === 'checkbox') {
          indicator.checked = true;
          indicator.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      this.showNotification('✅ Answers auto-selected', 'success');
    } else {
      this.showNotification('No correct answers found', 'warning');
    }
  }

  async saveQuizData() {
    const quizData = this.extractFullQuiz();

    // Save to storage
    chrome.storage.local.get(['savedQuizzes'], (result) => {
      const savedQuizzes = result.savedQuizzes || [];
      savedQuizzes.push(quizData);
      chrome.storage.local.set({ savedQuizzes });
    });

    this.showNotification('💾 Quiz data saved', 'success');
  }

  showQuizAnswer(response) {
    // Create a popup to show the answer
    const popup = document.createElement('div');
    popup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      z-index: 10001;
      max-width: 500px;
      max-height: 80vh;
      overflow: auto;
    `;

    popup.innerHTML = `
      <h3>AI Solution</h3>
      <div style="margin: 15px 0; white-space: pre-wrap;">${response}</div>
      <button onclick="this.parentElement.remove()" style="padding: 8px 16px; background: #0066cc; color: white; border: none; border-radius: 5px; cursor: pointer;">
        Close
      </button>
    `;

    document.body.appendChild(popup);
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

  async initPageFeatures() {
    switch (this.pageType) {
      case 'quiz':
        await this.initQuizFeatures();
        break;
      case 'lecture':
        await this.initLectureFeatures();
        break;
    }
  }

  async initQuizFeatures() {
    // Auto-track quiz attempts
    const saveButton = document.querySelector('input[type="submit"], button[type="submit"]');
    if (saveButton) {
      saveButton.addEventListener('click', async () => {
        await this.saveQuizData();
      });
    }
  }

  async initLectureFeatures() {
    // Auto-detect video completion
    const videoElement = document.querySelector('video');
    if (videoElement) {
      videoElement.addEventListener('ended', async () => {
        await this.markLectureAsWatched();
      });
    }
  }
}

// Initialize
if (!window.vuGenieInstance) {
  window.vuGenieInstance = new VUGenie();
}