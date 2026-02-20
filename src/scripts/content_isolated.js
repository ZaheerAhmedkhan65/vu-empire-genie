// content_isolated.js - For quizzes
console.log('VU Empire Genie - Quiz Mode');

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

const vu_alerts = new AlertManager();

class VUQuizGenie {
    constructor() {
        this.pageType = 'quiz';
        this.isInitialized = false;
        this.chromeAvailable = false;
        this.apiKey = null;
        this.cachedQuizData = null;          // Stores the last extracted quiz
        this.cacheTimestamp = 0;              // Time of last extraction
        this.cacheTTL = 5000;       // 5 seconds – re-extract if older
        this.settings = this.getDefaultSettings();
        this.init();
    }

    getDefaultSettings() {
        return {
            autoSelect: true,
            showSolution: true,
            autoSolve: false,
            autoSaveAfterSolve: false,
            enableCopyPaste: true,
            autoSkipAllLectures: false
        };
    }

    isChromeApiAvailable() {
        return typeof chrome !== 'undefined' &&
            chrome.runtime &&
            typeof chrome.runtime.id === 'string' && // context is valid
            typeof chrome.runtime.sendMessage === 'function';
    }

    async init() {
        if (this.isInitialized) return;

        // Check Chrome API availability
        await this.checkChromeAvailability();

        // Wait for page to load
        await this.waitForPageReady();

        window.addEventListener('popstate', () => {
            // Invalidate cache so that next action re‑extracts
            this.cachedQuizData = null;
        });

        // Inject UI
        this.injectUI();

        // NEW: Pre‑extract quiz data and cache it
        await this.extractAndCacheQuizData();
        
        this.isInitialized = true;
        vu_alerts.show('success', 'VU Empire Genie initialized');
        // Check and run auto-solve if enabled
        await this.checkAndRunAutoSolve();
    }

    async checkChromeAvailability() {
        try {
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                this.chromeAvailable = true;

                // Get API key
                this.apiKey = await this.getApiKeySafely();

                // Get settings
                this.settings = await this.getSettingsSafely();

                // Store settings in localStorage for fallback
                this.saveSettingsToLocalStorage();
            } else {
                this.chromeAvailable = false;
                this.loadSettingsFromLocalStorage();
            }
        } catch (error) {
            console.error('Error checking Chrome availability:', error);
            this.chromeAvailable = false;
            this.loadSettingsFromLocalStorage();
        }
    }

    async getApiKeySafely() {
        return new Promise((resolve) => {
            try {
                if (!this.chromeAvailable) {
                    resolve(localStorage.getItem('vuGenie_apiKey'));
                    return;
                }

                const timeout = setTimeout(() => {
                    console.warn('Timeout getting API key');
                    resolve(localStorage.getItem('vuGenie_apiKey'));
                }, 3000);

                chrome.runtime.sendMessage(
                    { type: 'GET_API_KEY' },
                    (response) => {
                        clearTimeout(timeout);
                        if (chrome.runtime.lastError) {
                            console.warn('Error getting API key:', chrome.runtime.lastError.message);
                            resolve(localStorage.getItem('vuGenie_apiKey'));
                        } else {
                            resolve(response?.apiKey || localStorage.getItem('vuGenie_apiKey'));
                        }
                    }
                );
            } catch (error) {
                console.error('Error in getApiKeySafely:', error);
                resolve(localStorage.getItem('vuGenie_apiKey'));
            }
        });
    }

    async getSettingsSafely() {
        return new Promise((resolve) => {
            try {
                if (!this.chromeAvailable) {
                    const saved = localStorage.getItem('vuGenie_settings');
                    resolve(saved ? JSON.parse(saved) : {
                        autoSelect: true,
                        showSolution: false,
                        autoSolve: false,
                        autoSaveAfterSolve: false
                    });
                    return;
                }

                const timeout = setTimeout(() => {
                    console.warn('Timeout getting settings');
                    const saved = localStorage.getItem('vuGenie_settings');
                    resolve(saved ? JSON.parse(saved) : {
                        autoSelect: true,
                        showSolution: false,
                        autoSolve: false,
                        autoSaveAfterSolve: false
                    });
                }, 3000);

                chrome.runtime.sendMessage(
                    { type: 'GET_SETTINGS' },
                    (response) => {
                        clearTimeout(timeout);
                        if (chrome.runtime.lastError) {
                            console.warn('Error getting settings:', chrome.runtime.lastError.message);
                            const saved = localStorage.getItem('vuGenie_settings');
                            resolve(saved ? JSON.parse(saved) : {
                                autoSelect: true,
                                showSolution: false,
                                autoSolve: false,
                                autoSaveAfterSolve: false
                            });
                        } else {
                            // Ensure all new settings have default values
                            const settings = response || {};
                            resolve({
                                autoSelect: settings.autoSelect !== false,
                                showSolution: settings.showSolution !== false,
                                autoSolve: settings.autoSolve === true,
                                autoSaveAfterSolve: settings.autoSaveAfterSolve === true,
                                enableCopyPaste: settings.enableCopyPaste !== false,
                                autoSkipAllLectures: settings.autoSkipAllLectures === true
                            });
                        }
                    }
                );
            } catch (error) {
                console.error('Error in getSettingsSafely:', error);
                const saved = localStorage.getItem('vuGenie_settings');
                resolve(saved ? JSON.parse(saved) : {
                    autoSelect: true,
                    showSolution: false,
                    autoSolve: false,
                    autoSaveAfterSolve: false
                });
            }
        });
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
        container.innerHTML = `
        <div class="vu-genie-container">
            <div class="vu-genie-content-wrapper">
                <div class="vu-genie-content" id="vu-genie-content">
                    <button class="vu-btn" id="vu-copy-quiz" data-action="copy-quiz">
                        Copy Quiz
                    </button>
                    <button class="vu-btn primary" id="vu-solve-quiz" data-action="solve-with-ai">
                        Solve Question
                    </button>
                </div>
            </div>
        </div>
    `;

        document.body.appendChild(container);
        this.attachEventListeners();
    }

    attachEventListeners() {
        this.solveButton = document.getElementById('vu-solve-quiz');
        this.copyButton = document.getElementById('vu-copy-quiz');

        if (this.solveButton) {
            this.solveButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleAction('solve-with-ai');
            });
        }

        if (this.copyButton) {
            this.copyButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleAction('copy-quiz');
            });
        }
    }

    disableButton(button, text) {
        if (!button) return;
        button.disabled = true;
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = text || 'Processing...';
    }

    enableButton(button) {
        if (!button) return;
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || 'Copy Quiz'; // fallback
    }

    // For copy button, we want a temporary disable with a countdown (optional)
    async disableCopyButtonTemporarily(duration = 3000) {
        if (!this.copyButton) return;
        const original = this.copyButton.innerText;
        this.copyButton.disabled = true;
        this.copyButton.innerText = 'Copied!';
        await new Promise(resolve => setTimeout(resolve, duration));
        this.copyButton.disabled = false;
        this.copyButton.innerText = original;
    }

    async extractAndCacheQuizData() {
        try {
            const quizData = {
                question: this.extractQuizQuestion(),
                options: this.extractQuizOptionsWithIndices(),
                courseCode: this.getCourseInfo().code,
                courseName: this.getCourseInfo().name,
                studentId: this.extractStudentInfo().studentId,
                studentName: this.extractStudentInfo().studentName,
                timestamp: new Date().toISOString(),
                url: window.location.href
            };

            // Basic validation – if no question/options, don't cache
            if (!quizData.question || quizData.options.length === 0) {
                console.warn('Failed to extract valid quiz data');
                return null;
            }

            this.cachedQuizData = quizData;
            this.cacheTimestamp = Date.now();
            this.saveRawQuizToStorage(quizData).catch(err =>
                console.warn('Could not save raw quiz to storage:', err)
            );

            return quizData;
        } catch (error) {
            console.error('Error extracting quiz data:', error);
            return null;
        }
    }

    async ensureFreshCache() {
        // If no cache, extract immediately
        if (!this.cachedQuizData) {
            return await this.extractAndCacheQuizData();
        }

        // Optional: detect if the question element changed
        const currentQuestionText = this.extractQuizQuestion();
        if (currentQuestionText !== this.cachedQuizData.question) {
            // Question changed – update cache
            return await this.extractAndCacheQuizData();
        }

        // If cache is still fresh (within TTL), return it
        if (Date.now() - this.cacheTimestamp < this.cacheTTL) {
            return this.cachedQuizData;
        }

        // Otherwise re‑extract
        return await this.extractAndCacheQuizData();
    }

    async handleAction(action) {
        // Determine which button triggered the action
        let button = null;
        if (action === 'solve-with-ai') button = this.solveButton;
        else if (action === 'copy-quiz') button = this.copyButton;

        // Prevent double-clicking
        if (button && button.disabled) return;

        try {
            switch (action) {
                case 'solve-with-ai':
                    this.disableButton(button, 'Solving Question...');
                    await this.solveWithAI();
                    break;
                case 'copy-quiz':
                    // For copy, we disable and re-enable after a fixed time
                    this.disableButton(button, 'Copying...');
                    // Perform copy (it's fast, but we'll still await it)
                    await this.copyQuiz(button);
                    break;
                case 'open-options':
                    if (this.chromeAvailable) {
                        chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' });
                    }
                    break;
            }
        } catch (error) {
            console.error(`Error in ${action}:`, error);
            // Re-enable button immediately on error
            if (button) this.enableButton(button);
        } finally {
            // For solve-with-ai, we re-enable after completion (even if error)
            if (action === 'solve-with-ai' && button) {
                this.enableButton(button);
            }
            // For copy, we already have a timeout; do nothing else
        }
    }

    async solveWithAI() {
        try {
            // Extract quiz data
            const quizData = await this.ensureFreshCache();
            if (!quizData || !quizData.question || quizData.options.length === 0) {
                vu_alerts.show('error', 'Could not extract quiz question', { bounce: true });
                return;
            }

            if (!this.apiKey) {
                vu_alerts.show('success','Please set your Gemini API key in extension settings', { bounce: true });
                // Open options page
                chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' });
                return;
            }

            // Get AI response
            const aiResponse = await this.getGeminiQuizResponse(quizData, this.apiKey);

            // Parse and apply the solution
            await this.applyQuizSolution(quizData, aiResponse);

        } catch (error) {
            console.error('Error in solveWithAI:', error);
            vu_alerts.show('error', 'Failed to solve with AI', { bounce: true });
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

            // Extract student info
            const studentInfo = this.extractStudentInfo();

            return {
                question: question.trim(),
                options: options,
                courseCode: courseInfo.code,
                courseName: courseInfo.name,
                studentId: studentInfo.studentId,
                studentName: studentInfo.studentName,
                timestamp: new Date().toISOString(),
                url: window.location.href
            };

        } catch (error) {
            console.error('Error extracting quiz:', error);
            return null;
        }
    }

    extractQuizQuestion() {
        try {
            // Multiple strategies to extract question text

            // Strategy 1: Look for textarea with question (CS205 format)
            const questionTextareas = document.querySelectorAll('textarea[id*="Question"], textarea[style*="border-left: 5px"]');
            for (const textarea of questionTextareas) {
                const text = textarea.value?.trim() || textarea.textContent?.trim();
                if (text && text.length > 10 && !text.match(/[A-Za-z0-9]{20,}/)) {
                    return text;
                }
            }

            // Strategy 2: Look for span with inline-block style (CS409P format)
            const questionSpans = document.querySelectorAll('span[style*="display:inline-block"][style*="border-left: 5px"]');
            for (const span of questionSpans) {
                // Extract text from paragraph tags only
                const paragraphs = span.querySelectorAll('p');
                if (paragraphs.length > 0) {
                    const text = Array.from(paragraphs).map(p => p.textContent.trim()).join(' ');
                    if (text && text.length > 10) {
                        return text;
                    }
                }

                // Fallback to span text
                const text = span.textContent.trim();
                if (text && text.length > 10) {
                    return text;
                }
            }

            // Strategy 3: Look in divnoselect for visible text
            const noselectDiv = document.getElementById('divnoseelect');
            if (noselectDiv) {
                // Find textareas first
                const noselectTextareas = noselectDiv.querySelectorAll('textarea');
                for (const textarea of noselectTextareas) {
                    const text = textarea.value?.trim() || textarea.textContent?.trim();
                    if (text && text.length > 20 && text.includes('?') && !text.match(/[A-Za-z0-9]{15,}/)) {
                        return text;
                    }
                }

                // Find spans with reasonable text
                const noselectSpans = noselectDiv.querySelectorAll('span');
                for (const span of noselectSpans) {
                    const text = span.textContent.trim();
                    if (text && text.length > 20 &&
                        (text.includes('?') || text.includes('_________')) &&
                        !text.match(/[A-Za-z0-9]{15,}/)) {
                        return text;
                    }
                }
            }

            // Strategy 4: Look for any visible question-like text
            const allElements = document.querySelectorAll('span, div, textarea');
            for (const element of allElements) {
                const style = window.getComputedStyle(element);
                if (style.display !== 'none' && style.visibility !== 'hidden') {
                    const text = element.textContent?.trim() || element.value?.trim() || '';
                    if (text && text.length > 20 &&
                        (text.includes('?') || text.includes('_________') ||
                            text.match(/^[A-Z]/) || text.includes('.')) &&
                        !text.match(/[A-Za-z0-9]{20,}/) &&
                        !text.includes('Lrwio') && !text.includes('p8iOy')) {
                        return text;
                    }
                }
            }

            console.warn('Could not extract question text');
            return '';

        } catch (error) {
            console.error('Error extracting quiz question:', error);
            return '';
        }
    }

    extractQuizOptionsWithIndices() {
        const options = [];

        // Try different selectors for quiz options - handle BOTH formats
        const optionSelectors = [
            // Format 1: Span elements (CS409P page)
            'table#tblAnswer span[id^="lblExpression"]',
            'span[id^="lblExpression"]',

            // Format 2: Textarea elements (CS205 page)
            'table#tblAnswer textarea[id^="lblAnswer"]',
            'textarea[id^="lblAnswer"]',

            // Fallback selectors
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
            if (optionElements.length >= 2) {
                break;
            }
        }

        // If no elements found with specific selectors, try to find them in the answer table
        if (optionElements.length === 0) {
            const answerTable = document.getElementById('tblAnswer');
            if (answerTable) {
                // Look for any text elements in the answer table
                const textElements = answerTable.querySelectorAll('td textarea, td span, td div');
                optionElements = Array.from(textElements).filter(el => {
                    const text = el.textContent || el.value || '';
                    return text.trim().length > 5; // Filter out empty/short elements
                });
            }
        }

        // Process found elements
        optionElements.forEach((el, index) => {
            // Get text content based on element type
            let text = '';
            if (el.tagName === 'TEXTAREA') {
                text = el.value?.trim() || el.textContent?.trim() || '';
            } else if (el.tagName === 'SPAN' || el.tagName === 'DIV' || el.tagName === 'TD') {
                text = el.textContent?.trim() || el.innerText?.trim() || '';
            }

            // Clean up the text - remove HTML tags if any
            text = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

            if (text && text.length > 0) {
                // Find the corresponding radio button
                const radioId = `radioBtn${index}`;
                const radioButton = document.getElementById(radioId);

                options.push({
                    index: index,
                    letter: String.fromCharCode(65 + index),
                    text: text,
                    element: el,
                    radioButton: radioButton
                });
            }
        });

        // If still no options, try a more aggressive approach
        if (options.length === 0) {
            this.extractOptionsAggressive(options);
        }

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

    // Add a new method to check if auto-solve should run
    async checkAndRunAutoSolve() {
        try {
            // Check if auto-solve is enabled and API key is available
            if (this.settings.autoSolve && this.apiKey) {
                // Add a small delay to ensure page is fully loaded
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Check if we're on a quiz question page (not results page)
                if (!window.location.href.includes('QuizFinished.aspx')) {
                    await this.solveWithAI();

                    // If auto-save is enabled, save and go to next question
                    if (this.settings.autoSaveAfterSolve) {
                        await this.autoSaveAndNext();
                    }
                }
            }
        } catch (error) {
            console.error('Error in auto-solve:', error);
        }
    }

    // Add method to auto-save and go to next question
    async autoSaveAndNext() {
        try {
            // Find the save/next button
            const nextButton = document.getElementById('btnSave');

            if (nextButton && !nextButton.disabled) {
                // Click the button
                nextButton.click();

                // Wait a bit for the next question to load
                await new Promise(resolve => setTimeout(resolve, 3000));

                // NEW: re‑extract cache for the new question
                await this.extractAndCacheQuizData();

                // Check if we're still on a quiz page (not finished)
                if (window.location.href.includes('/Quiz/') &&
                    !window.location.href.includes('QuizFinished.aspx')) {

                    // Re-initialize for the new question
                    this.isInitialized = false;
                    await this.init();
                }
            } else if (nextButton && nextButton.disabled) {
                // Try to trigger EnableNextButton if it exists
                if (typeof window.EnableNextButton === 'function') {
                    window.EnableNextButton();

                    // Wait a moment and try again
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    if (!nextButton.disabled) {
                        nextButton.click();
                    }
                }
            }
        } catch (error) {
            console.error('Error in auto-save and next:', error);
        }
    }

    async getSettingsSafely() {
        return new Promise((resolve) => {
            try {
                if (!this.chromeAvailable) {
                    this.loadSettingsFromLocalStorage();
                    resolve(this.settings);
                    return;
                }

                const timeout = setTimeout(() => {
                    console.warn('Timeout getting settings');
                    this.loadSettingsFromLocalStorage();
                    resolve(this.settings);
                }, 3000);

                chrome.runtime.sendMessage(
                    { type: 'GET_SETTINGS' },
                    (response) => {
                        clearTimeout(timeout);
                        if (chrome.runtime.lastError) {
                            console.warn('Error getting settings:', chrome.runtime.lastError.message);
                            this.loadSettingsFromLocalStorage();
                            resolve(this.settings);
                        } else {
                            // Merge response with defaults
                            const settings = response || {};
                            this.settings = {
                                ...this.getDefaultSettings(),
                                ...settings
                            };
                            resolve(this.settings);
                        }
                    }
                );
            } catch (error) {
                console.error('Error in getSettingsSafely:', error);
                this.loadSettingsFromLocalStorage();
                resolve(this.settings);
            }
        });
    }

    loadSettingsFromLocalStorage() {
        try {
            const savedSettings = localStorage.getItem('vuGenie_settings');
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                this.settings = {
                    ...this.getDefaultSettings(),
                    ...parsedSettings
                };
            }
        } catch (error) {
            console.error('Error loading settings from localStorage:', error);
        }
    }

    saveSettingsToLocalStorage() {
        try {
            localStorage.setItem('vuGenie_settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Error saving settings to localStorage:', error);
        }
    }

    onSettingsUpdated(settings) {
        const oldAutoSolve = this.settings.autoSolve;
        this.settings = {
            ...this.getDefaultSettings(),
            ...settings
        };
        this.saveSettingsToLocalStorage();

        // If autoSolve was just enabled and we're on a quiz page (not finished), run it
        if (this.settings.autoSolve && !oldAutoSolve && this.apiKey) {
            // if (!window.location.href.includes('QuizFinished.aspx')) {
                this.solveWithAI();
            // }
        }
    }

    async applyQuizSolution(quizData, aiResponse) {
        try {
            // Parse the AI response
            const solution = this.parseAIResponse(aiResponse, quizData.options);

            if (!solution || !solution.correctAnswers || solution.correctAnswers.length === 0) {
                throw new Error('Could not parse AI response');
            }

            // Show solution popup if enabled
            if (this.settings.showSolution) {
                this.displayQuizSolution(quizData, solution);
            }

            // Auto-select correct answers if enabled
            if (this.settings.autoSelect) {
                await this.autoSelectQuizAnswers(solution.correctAnswers, quizData.options);
            }

            await this.updateRawQuizWithSolution(quizData, solution);

            // Save quiz data for future reference
            await this.saveQuizData(quizData, solution);

            // Auto-save and move to next question if enabled
            if (this.settings.autoSaveAfterSolve) {
                await this.autoSaveAndNext();
            }

        } catch (error) {
            console.error('Error applying solution:', error);
            throw error;
        }
    }

    async getGeminiQuizResponse(quizData, apiKey) {
        try {
            // Format the prompt for Gemini
            const prompt = this.formatQuizPrompt(quizData);

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

                // Simplified error message for quota limit
                if (errorData.error?.code === 429 ||
                    errorData.error?.message?.includes('quota') ||
                    errorData.error?.message?.includes('limit')) {
                    throw new Error('API free limit reached. Try again tomorrow.');
                }

                // Other errors
                throw new Error(`API error: ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

            return aiText;
        } catch (error) {
            console.error('Gemini API error:', error);
            throw error;
        }
    }

    parseAIResponse(aiResponse, options) {
        let correctAnswers = [];
        let explanation = '';

        // Multiple patterns to try for extracting correct answer
        const answerPatterns = [
            /CORRECT_ANSWER\s*:\s*([A-D,]+)/i,
            /Answer\s*:\s*([A-D,]+)/i,
            /Correct\s*(?:option|answer)\s*:\s*([A-D,]+)/i,
            /option\s*([A-D,]+)\s*is\s*correct/i,
            /^([A-D])\s*[-:]\s/i,
            /select\s*([A-D,]+)\s*(?:as|for)/i,
            /([A-D])\s*[-:]\s*[Cc]orrect/i,
            /The correct answer is\s*([A-D,]+)/i,
            /^([A-D])\.?\s*$/im
        ];

        for (const pattern of answerPatterns) {
            const match = aiResponse.match(pattern);
            if (match) {
                const letters = match[1].split(',').map(l => l.trim().toUpperCase());

                // Validate letters are A-D
                const validLetters = letters.filter(l => /^[A-D]$/.test(l));
                if (validLetters.length > 0) {
                    correctAnswers = validLetters;
                    break;
                }
            }
        }

        // If no pattern matched, try to find single letter answers
        if (correctAnswers.length === 0) {
            const singleLetterMatch = aiResponse.match(/\b([A-D])\b/);
            if (singleLetterMatch) {
                const letter = singleLetterMatch[1].toUpperCase();
                if (/^[A-D]$/.test(letter)) {
                    correctAnswers = [letter];
                }
            }
        }

        // Extract explanation
        const explanationPatterns = [
            /EXPLANATION\s*:\s*(.+?)(?=\n\n|$)/is,
            /Explanation\s*:\s*(.+?)(?=\n\n|$)/is,
            /because\s*(.+?)(?=\n\n|$)/i,
            /reason\s*:\s*(.+?)(?=\n\n|$)/i
        ];

        for (const pattern of explanationPatterns) {
            const match = aiResponse.match(pattern);
            if (match) {
                explanation = match[1].trim();
                break;
            }
        }

        // If no explanation found, try to extract text after the answer
        if (!explanation) {
            const lines = aiResponse.split('\n');
            let foundAnswer = false;
            let explanationLines = [];

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine) continue;

                if (foundAnswer && !trimmedLine.match(/^[A-D]\s*[-:]\s/) && !trimmedLine.match(/Option\s*[A-D]/i)) {
                    explanationLines.push(trimmedLine);
                }

                if (trimmedLine.match(/CORRECT_ANSWER|Answer:|Correct option:|The correct answer is/i)) {
                    foundAnswer = true;
                }
            }

            explanation = explanationLines.join(' ').trim();
        }

        return {
            correctAnswers,
            explanation,
            rawResponse: aiResponse
        };
    }

    formatSolutionForCopy(quizData, solution) {
        let text = `Quiz Solution\n`;
        text += `Course: ${quizData.courseName}\n`;
        text += `QUESTION:\n${quizData.question}\n\n`;
        text += `OPTIONS:\n`;
        quizData.options.forEach(opt => {
            text += `${opt.letter}. ${opt.text}\n`;
        });
        text += `\nCORRECT ANSWER${solution.correctAnswers.length > 1 ? 'S' : ''}:\n`;
        solution.correctAnswers.forEach((ans, i) => {
            text += `${i + 1}. ${ans}\n`;
        });
        text += `\nEXPLANATION:\n${solution.explanation || 'No explanation provided.'}\n`;
        return text;
    }
    
    displayQuizSolution(quizData, solution) {
        const container = document.querySelector(".vu-genie-container");
        // Remove any existing solution popup
        const existing = document.getElementById('vu-genie-quiz-solution');
        if (existing) existing.remove();

        const popup = document.createElement('div');
        popup.id = 'vu-genie-quiz-solution';

        // Build header with correct answer(s) and close button
        let headerContent = '';
        if (solution.correctAnswers.length > 0) {
            headerContent = solution.correctAnswers.map(letter => {
                const option = quizData.options.find(opt => opt.letter === letter);
                return `Option ${letter} : <span style="font-weight:600; color:#10b981;">${option ? option.text : letter}</span>`;
            }).join('<br>');
        }

        popup.innerHTML = `
        <div class="solution-header">
            <div class="solution-title">${headerContent}</div>
            <button id="close-solution" class="toggle-btn">×</button>
        </div>
        <div class="solution-content">
            ${solution.explanation ? `
                <div style="font-weight: bold; margin-bottom: 5px;">Explanation :</div>
                <div style="line-height: 1.5;">${solution.explanation}</div>
            ` : ''}
        </div>
    `;

        container.appendChild(popup);

        const closeBtn = popup.querySelector('#close-solution');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            popup.classList.toggle('collapsed');
            closeBtn.textContent = popup.classList.contains('collapsed') ? '▲' : '×';
        });

        // Optional: click on collapsed area expands
        popup.addEventListener('click', (e) => {
            if (popup.classList.contains('collapsed') && e.target === popup) {
                popup.classList.remove('collapsed');
                closeBtn.textContent = '×';
            }
        });

        // Escape key collapses instead of removing
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                popup.classList.add('collapsed');
                closeBtn.textContent = '▲';
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }


    async autoSelectQuizAnswers(correctAnswers, options) {
        try {
            let selectedCount = 0;

            // First, try to select by letter
            for (const answer of correctAnswers) {
                // Extract letter from answer (e.g., "D" from "CORRECT_ANSWER: D")
                const letterMatch = answer.match(/^[A-D]$/i) || answer.match(/[A-D]$/i);
                const letter = letterMatch ? letterMatch[0].toUpperCase() : null;

                if (letter) {
                    const option = options.find(opt => opt.letter === letter);
                    if (option) {
                        if (await this.selectOptionByIndex(option.index)) {
                            selectedCount++;
                            continue;
                        }
                    }
                }

                // If letter matching fails, try text matching
                for (const option of options) {
                    // Clean both texts for comparison
                    const cleanAnswer = answer.replace(/[^A-Za-z ]/g, '').toLowerCase().trim();
                    const cleanOptionText = option.text.replace(/[^A-Za-z ]/g, '').toLowerCase().trim();

                    if (cleanOptionText.includes(cleanAnswer) || cleanAnswer.includes(cleanOptionText)) {
                        if (await this.selectOptionByIndex(option.index)) {
                            selectedCount++;
                            break;
                        }
                    }
                }
            }

            if (selectedCount > 0) {
                vu_alerts.show('success', `${selectedCount} answer${selectedCount > 1 ? 's' : ''} selected`);
            } else {
                console.warn('Could not auto-select any answers');
                vu_alerts.show('warning', 'Could not auto-select. Please select manually.', { bounce: true });
            }

        } catch (error) {
            console.error('Error auto-selecting:', error);
            vu_alerts.show('error', 'Error auto-selecting answers', { bounce: true });
        }
    }

    // Also update the selectOptionByIndex method to handle both formats:
    async selectOptionByIndex(index) {
        try {
            // Method 1: Try radio button by ID
            const radioButtonId = `radioBtn${index}`;
            let radioButton = document.getElementById(radioButtonId);

            if (radioButton) {
                return this.selectRadioButton(radioButton);
            }

            // Method 2: Try to find radio button in the answer table
            const answerTable = document.getElementById('tblAnswer');
            if (answerTable) {
                const radioButtons = answerTable.querySelectorAll('input[type="radio"]');
                if (radioButtons.length > index) {
                    radioButton = radioButtons[index];
                    return this.selectRadioButton(radioButton);
                }
            }

            // Method 3: Try to click the option text/area
            const optionSelectors = [
                `#lblExpression${index}`,
                `#lblAnswer${index}`,
                `#div${index}`,
                `table#tblAnswer tr:nth-child(${index + 1}) td:last-child`
            ];

            for (const selector of optionSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    element.click();

                    // Also try to find and check the associated radio button
                    const parentRow = element.closest('tr');
                    if (parentRow) {
                        const rowRadio = parentRow.querySelector('input[type="radio"]');
                        if (rowRadio) {
                            return this.selectRadioButton(rowRadio);
                        }
                    }

                    return true;
                }
            }

            console.warn(`Could not find option ${index} to select`);
            return false;

        } catch (error) {
            console.error(`Error selecting option ${index}:`, error);
            return false;
        }
    }

    extractOptionsAggressive(options) {
        // Look for radio buttons and their adjacent text
        const radioButtons = document.querySelectorAll('input[type="radio"]');

        radioButtons.forEach((radio, index) => {
            // Try to find text near the radio button
            let text = '';

            // Method 1: Look for sibling textarea
            const textarea = radio.closest('tr')?.querySelector('textarea');
            if (textarea) {
                text = textarea.value?.trim() || '';
            }

            // Method 2: Look for sibling span/div
            if (!text) {
                const textElement = radio.closest('td')?.nextElementSibling?.querySelector('span, div');
                if (textElement) {
                    text = textElement.textContent?.trim() || '';
                }
            }

            // Method 3: Look for any text in the same row
            if (!text) {
                const row = radio.closest('tr');
                if (row) {
                    // Get all text in the row except from the radio button itself
                    const rowClone = row.cloneNode(true);
                    // Remove the radio button from the clone
                    rowClone.querySelectorAll('input').forEach(input => input.remove());
                    text = rowClone.textContent?.trim() || '';
                }
            }

            if (text) {
                text = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                options.push({
                    index: index,
                    letter: String.fromCharCode(65 + index),
                    text: text,
                    element: radio,
                    radioButton: radio
                });
            }
        });
    }

    selectRadioButton(radioButton) {
        try {
            // Select the radio button
            radioButton.checked = true;

            // Trigger all necessary events
            const events = ['click', 'change', 'input', 'focus'];
            events.forEach(eventType => {
                const event = new Event(eventType, { bubbles: true });
                radioButton.dispatchEvent(event);
            });

            // Also trigger VU's EnableNextButton function if it exists
            // Check if the function exists before calling it
            if (typeof window.EnableNextButton === 'function') {
                try {
                    EnableNextButton();
                } catch (e) {
                    console.error('EnableNextButton function exists but threw error:', e.message);
                }
            } else {
                // Try to enable the Next button manually
                const nextButton = document.getElementById('btnSave');
                if (nextButton && nextButton.disabled) {
                    nextButton.disabled = false;
                }
            }

            // Visual feedback
            const row = radioButton.closest('tr');
            if (row) {
                row.style.backgroundColor = '#d4edda';
                row.style.borderLeft = '4px solid #28a745';

                // Also highlight the text area
                const textArea = row.querySelector('textarea, span, div');
                if (textArea) {
                    textArea.style.backgroundColor = '#d4edda';
                }
            }

            return true;
        } catch (error) {
            console.error('Error selecting radio button:', error);
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

    async saveToBackgroundStorage(data) {
        // First, try to use Chrome APIs if available
        if (this.isChromeApiAvailable()) {
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

        // Fallback: extension context invalid – save to localStorage
        console.warn('Extension context invalid, saving quiz data to localStorage');
        return this.saveQuizDataToLocalStorage(data.data);
    }

    async saveQuizDataToLocalStorage(quizData) {
        try {
            const storageKey = 'vuGenie_quizData';
            const existing = localStorage.getItem(storageKey);
            let quizArray = existing ? JSON.parse(existing) : [];

            quizArray.push({
                ...quizData,
                savedAt: new Date().toISOString()
            });

            // Keep only the last 1000 quizzes to avoid quota issues
            if (quizArray.length > 1000) {
                quizArray = quizArray.slice(-1000);
            }

            localStorage.setItem(storageKey, JSON.stringify(quizArray));
        } catch (error) {
            console.error('❌ Failed to save quiz to localStorage:', error);
            throw error; // re-throw if necessary
        }
    }

    async saveQuizData(quizData, solution) {
        try {
            await this.saveToBackgroundStorage({
                type: 'SAVE_QUIZ_DATA',
                data: {
                    ...quizData,
                    solution,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Error saving quiz:', error);
            // The fallback inside saveToBackgroundStorage may have already run,
            // but if it didn't (e.g., error in the promise itself), we try local save directly.
            if (!this.isChromeApiAvailable()) {
                await this.saveQuizDataToLocalStorage({
                    ...quizData,
                    solution,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }

    async copyQuiz(button) {
        const quizData = await this.ensureFreshCache();
        if (!quizData || !quizData.question || quizData.options.length === 0) {
            vu_alerts.show('error', 'Could not extract quiz question', { bounce: true });
            // Wait 3 seconds before re-enablingz
            this.enableButton(button)
            return;
        }
        const text = this.formatQuizText(quizData);

        await navigator.clipboard.writeText(text);
        // Wait 0.5 seconds before re-enablingz
        setTimeout(() => this.enableButton(button), 500);
        vu_alerts.show('success', 'Quiz copied to clipboard');
    }

    extractFullQuiz() {
        const question = this.extractQuizQuestion();
        const options = this.extractQuizOptionsWithIndices(); 
        console.log('Extracted options:', options);
        return {
            question,
            options,
            timestamp: new Date().toISOString(),
            url: window.location.href
        };
    }

    extractStudentInfo() {
        try {
            const studentSpan = document.querySelector('.tblheadingblue');
            if (studentSpan) {
                const text = studentSpan.textContent.trim();
                const parts = text.split(':').map(part => part.trim());

                if (parts.length >= 2) {
                    return {
                        studentId: parts[0], // "BC240201242"
                        studentName: parts[1] // "ZAHEER AHMED KHAN"
                    };
                }
            }
            return { studentId: 'Unknown', studentName: 'Unknown' };
        } catch (error) {
            console.error('Error extracting student info:', error);
            return { studentId: 'Unknown', studentName: 'Unknown' };
        }
    }

    generateQuizId(quizData) {
        const base = `${quizData.studentId}|${quizData.courseCode}|${quizData.question.replace(/\s+/g, ' ').trim()}`;
        let hash = 0;
        for (let i = 0; i < base.length; i++) {
            hash = ((hash << 5) - hash) + base.charCodeAt(i);
            hash |= 0; // convert to 32-bit integer
        }
        return `quiz_${Math.abs(hash)}`;
    }

    async saveRawQuizToStorage(quizData) {
        const id = this.generateQuizId(quizData);
        const record = {
            ...quizData,
            id,
            solved: false,
            solution: null,
            savedAt: new Date().toISOString()
        };
        return new Promise((resolve) => {
            chrome.storage.local.get(['vuQuizBank'], (result) => {
                const bank = result.vuQuizBank || {};
                bank[id] = record;
                chrome.storage.local.set({ vuQuizBank: bank }, resolve);
            });
        });
    }

    async updateRawQuizWithSolution(quizData, solution) {
        const id = this.generateQuizId(quizData);
        return new Promise((resolve) => {
            chrome.storage.local.get(['vuQuizBank'], (result) => {
                const bank = result.vuQuizBank || {};
                if (bank[id]) {
                    bank[id].solved = true;
                    bank[id].solution = solution;
                    bank[id].updatedAt = new Date().toISOString();
                    chrome.storage.local.set({ vuQuizBank: bank }, resolve);
                } else {
                    // If not found (shouldn't happen), create a new solved entry
                    const record = {
                        ...quizData,
                        id,
                        solved: true,
                        solution,
                        savedAt: new Date().toISOString()
                    };
                    bank[id] = record;
                    chrome.storage.local.set({ vuQuizBank: bank }, resolve);
                }
            });
        });
    }

    formatQuizText(quizData) {
        let text = `\n`;
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
            vu_alerts.show('success', 'Correct answers selected');
        } else {
            vu_alerts.show('warning', 'No correct answers found', { bounce: true });
        }
    }
}

// Initialize only if on quiz page
if ((window.location.href.includes('/Quiz/') || window.location.href.includes('/FormativeAssessment/') && !window.vuQuizGenie)
    && !window.vuQuizGenie) {
    window.vuQuizGenie = new VUQuizGenie();
}

// Initialize only if on a quiz question page (not finished)
// if ((window.location.href.includes('/Quiz/') || window.location.href.includes('/FormativeAssessment/'))
//     && !window.location.href.includes('QuizFinished.aspx')
//     && !window.vuQuizGenie) {
//     window.vuQuizGenie = new VUQuizGenie();
// }