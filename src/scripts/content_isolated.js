// content_isolated.js - For quizzes
console.log('VU Empire Genie (ISOLATED World) - Quiz Mode');

class VUQuizGenie {
    constructor() {
        this.pageType = 'quiz';
        this.isInitialized = false;
        this.chromeAvailable = false;
        this.apiKey = null;
        this.settings = this.getDefaultSettings();
        this.init();
    }

    getDefaultSettings() {
        return {
            autoSelect: true,
            autoSaveQuiz: true,
            showSolution: true,
            autoSolve: false,
            autoSaveAfterSolve: false,
            enableCopyPaste: true,
            autoSkipAllLectures: false
        };
    }

    async init() {
        if (this.isInitialized) return;

        // Check Chrome API availability
        await this.checkChromeAvailability();

        // Wait for page to load
        await this.waitForPageReady();

        // Inject UI
        this.injectUI();
        this.isInitialized = true;

        // Check and run auto-solve if enabled
        await this.checkAndRunAutoSolve();
    }

    async checkChromeAvailability() {
        try {
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                this.chromeAvailable = true;
                console.log('✅ Chrome APIs available in ISOLATED world');

                // Get API key
                this.apiKey = await this.getApiKeySafely();

                // Get settings
                this.settings = await this.getSettingsSafely();

                // Store settings in localStorage for fallback
                this.saveSettingsToLocalStorage();
            } else {
                console.log('⚠️ Chrome APIs not available');
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
                        autoSaveQuiz: true,
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
                        autoSaveQuiz: true,
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
                                autoSaveQuiz: true,
                                showSolution: false,
                                autoSolve: false,
                                autoSaveAfterSolve: false
                            });
                        } else {
                            // Ensure all new settings have default values
                            const settings = response || {};
                            resolve({
                                autoSelect: settings.autoSelect !== false,
                                autoSaveQuiz: settings.autoSaveQuiz !== false,
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
                    autoSaveQuiz: true,
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

        const floatingBtnContainer = document.createElement("div");
        floatingBtnContainer.classList.add("floating-btn-container");
        const floatingBtn = document.createElement("button");
        floatingBtn.innerHTML = 'vu'
        floatingBtn.classList.add("floating-btn", "hide");
        floatingBtnContainer.appendChild(floatingBtn);
        document.body.appendChild(floatingBtnContainer);

        const container = document.createElement('div');
        container.id = 'vu-genie-ui';
        container.innerHTML = `
            <div class="vu-genie-container">
                <div class="vu-genie-content-wrapper">
                    <div class="vu-genie-content" id="vu-genie-content">
                        <button class="vu-btn primary" data-action="copy-quiz">
                            Copy Quiz
                        </button>

                        <button class="vu-btn secondary" data-action="solve-with-ai">
                            Solve with AI
                        </button>

                        <button class="vu-btn" data-action="download-pdf">
                            Download Quiz
                        </button>
                    </div>
                    <button class="vu-genie-close">×</button>
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
        // Same styles as content_main.js
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
                padding: 20px;
                border-radius: 50%;
                border: none;
                outline: none;
                text-transform: uppercase;
                font-weight: bold;
            }

            .show{
                display: block !important;
            }

            .hide{
                display: none !important;
            }

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
            
            .vu-btn.primary {
                background: #10b981;
                color: white;
            }
            
            .vu-btn.secondary {
                background: #8b5cf6;
                color: white;
            }
        `;
        document.head.appendChild(style);
    }

    attachEventListeners() {
        const container = document.getElementById('vu-genie-ui');
        const floatingBtn = document.querySelector(".floating-btn");

        // Close button
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
        })

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
            case 'solve-with-ai':
                await this.solveWithAI();
                break;
            case 'copy-quiz':
                await this.copyQuiz();
                break;
            case 'download-pdf':
                await this.downloadQuizPdf();
                break;
            case 'open-options':
                if (this.chromeAvailable) {
                    chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' });
                }
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

    async solveWithAI() {
        try {
            this.updateStatus('Extracting quiz...');
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

            if (!this.apiKey) {
                this.showNotification('Please set your Gemini API key in extension settings', 'error');
                // Open options page
                chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' });
                return;
            }

            this.updateStatus('Solving with Gemini AI...');

            // Get AI response
            const aiResponse = await this.getGeminiQuizResponse(quizData, this.apiKey);

            // Parse and apply the solution
            await this.applyQuizSolution(quizData, aiResponse);

        } catch (error) {
            console.error('Error in solveWithAI:', error);
            this.showNotification(`❌ AI Error: ${error.message}`, 'error');
        } finally {
            this.updateStatus('Ready');
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
            console.log('Extracting quiz question...');

            // Multiple strategies to extract question text

            // Strategy 1: Look for textarea with question (CS205 format)
            const questionTextareas = document.querySelectorAll('textarea[id*="Question"], textarea[style*="border-left: 5px"]');
            for (const textarea of questionTextareas) {
                const text = textarea.value?.trim() || textarea.textContent?.trim();
                if (text && text.length > 10 && !text.match(/[A-Za-z0-9]{20,}/)) {
                    console.log('Found question in textarea:', text.substring(0, 100));
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
                        console.log('Found question in span paragraphs:', text.substring(0, 100));
                        return text;
                    }
                }

                // Fallback to span text
                const text = span.textContent.trim();
                if (text && text.length > 10) {
                    console.log('Found question in span text:', text.substring(0, 100));
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
                        console.log('Found question in noselect textarea:', text.substring(0, 100));
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
                        console.log('Found question in noselect span:', text.substring(0, 100));
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
                        console.log('Found question in visible element:', text.substring(0, 100));
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
                console.log(`Found ${optionElements.length} options using selector: ${selector}`);
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
                console.log(`Found ${optionElements.length} options in answer table`);
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

                console.log(`Option ${index} (${String.fromCharCode(65 + index)}): "${text.substring(0, 50)}..."`);
            }
        });

        // If still no options, try a more aggressive approach
        if (options.length === 0) {
            console.log('Using aggressive option extraction');
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
                console.log('Auto-solve enabled, running AI solve...');

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
            console.log('Auto-saving and moving to next question...');

            // Find the save/next button
            const nextButton = document.getElementById('btnSave');

            if (nextButton && !nextButton.disabled) {
                console.log('Clicking save/next button...');

                // Click the button
                nextButton.click();

                // Wait a bit for the next question to load
                await new Promise(resolve => setTimeout(resolve, 3000));

                // Check if we're still on a quiz page (not finished)
                if (window.location.href.includes('/Quiz/') &&
                    !window.location.href.includes('QuizFinished.aspx')) {
                    console.log('Next question loaded, running auto-solve again...');

                    // Re-initialize for the new question
                    this.isInitialized = false;
                    await this.init();
                }
            } else if (nextButton && nextButton.disabled) {
                console.log('Save button is disabled, trying to enable it...');

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
                            console.log('Settings loaded from Chrome storage:', this.settings);
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
                console.log('Settings loaded from localStorage:', this.settings);
            }
        } catch (error) {
            console.error('Error loading settings from localStorage:', error);
        }
    }

    saveSettingsToLocalStorage() {
        try {
            localStorage.setItem('vuGenie_settings', JSON.stringify(this.settings));
            console.log('Settings saved to localStorage:', this.settings);
        } catch (error) {
            console.error('Error saving settings to localStorage:', error);
        }
    }

    async applyQuizSolution(quizData, aiResponse) {
        try {
            // Parse the AI response
            const solution = this.parseAIResponse(aiResponse, quizData.options);

            if (!solution || !solution.correctAnswers || solution.correctAnswers.length === 0) {
                throw new Error('Could not parse AI response');
            }

            console.log('Parsed solution:', solution);
            console.log('Current settings:', this.settings);

            // Show solution popup if enabled
            if (this.settings.showSolution) {
                console.log('Showing solution popup (showSolution is true)');
                this.displayQuizSolution(quizData, solution);
            } else {
                console.log('Skipping solution popup (showSolution is false)');
            }

            // Auto-select correct answers if enabled
            if (this.settings.autoSelect) {
                console.log('Auto-selecting answer (autoSelect is true)');
                await this.autoSelectQuizAnswers(solution.correctAnswers, quizData.options);
            } else {
                console.log('Skipping auto-select (autoSelect is false)');
            }

            // Save quiz data for future reference
            if (this.settings.autoSaveQuiz) {
                console.log('Saving quiz data (autoSaveQuiz is true)');
                await this.saveQuizData(quizData, solution);
            } else {
                console.log('Skipping save (autoSaveQuiz is false)');
            }

            // Auto-save and move to next question if enabled
            if (this.settings.autoSaveAfterSolve) {
                console.log('Auto-saving and moving to next question (autoSaveAfterSolve is true)');
                await this.autoSaveAndNext();
            } else {
                console.log('Skipping auto-save after solve (autoSaveAfterSolve is false)');
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


            console.log('Gemini response:', aiText);
            return aiText;

        } catch (error) {
            console.error('Gemini API error:', error);
            throw error;
        }
    }

    parseAIResponse(aiResponse, options) {
        console.log('Parsing AI response:', aiResponse.substring(0, 200) + '...');

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
                console.log(`Extracted letters from pattern ${pattern}:`, letters);

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
                    console.log(`Found single letter answer: ${letter}`);
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

        console.log('Parsed solution:', {
            correctAnswers,
            explanation: explanation.substring(0, 100) + (explanation.length > 100 ? '...' : '')
        });

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
    `;

        let solutionHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0; font-size: 20px; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 24px;">Solution</span>
            </h3>
            <button id="close-solution" style="background: rgba(255,255,255,0.2); border: none; color: white; font-size: 20px; cursor: pointer; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                ×
            </button>
        </div>

        <div style="font-weight: bold; margin-bottom: 10px; opacity: 0.9;">Question:</div>
        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
            <div style="line-height: 1.5;">${quizData.question}</div>
        </div>
        
        <div style="font-weight: bold; margin-bottom: 10px; opacity: 0.9;">Options:</div>
        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
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
            <button id="copy-solution-btn" style="flex: 1; padding: 12px; background: #4299e1; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 8px;">
                Copy Solution
            </button>
        </div>
        
        <div style="margin-top: 15px; text-align: center; font-size: 12px; opacity: 0.7;">
            Powered by VU EMPIRE
        </div>
    `;

        popup.innerHTML = solutionHTML;
        document.body.appendChild(popup);

        // Add event listeners
        popup.querySelector('#close-solution').addEventListener('click', () => {
            popup.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => popup.remove(), 300);
        });

        popup.querySelector('#copy-solution-btn').addEventListener('click', () => {
            const text = this.formatSolutionForCopy(quizData, solution);
            navigator.clipboard.writeText(text).then(() => {
                popup.querySelector('#copy-solution-btn').innerHTML = 'Copied!';
                setTimeout(() => {
                    popup.querySelector('#copy-solution-btn').innerHTML = 'Copy Solution';
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

    // Also update the selectOptionByIndex method to handle both formats:
    async selectOptionByIndex(index) {
        try {
            console.log(`Attempting to select option ${index}`);

            // Method 1: Try radio button by ID
            const radioButtonId = `radioBtn${index}`;
            let radioButton = document.getElementById(radioButtonId);

            if (radioButton) {
                console.log(`Found radio button ${radioButtonId}`);
                return this.selectRadioButton(radioButton);
            }

            // Method 2: Try to find radio button in the answer table
            const answerTable = document.getElementById('tblAnswer');
            if (answerTable) {
                const radioButtons = answerTable.querySelectorAll('input[type="radio"]');
                if (radioButtons.length > index) {
                    radioButton = radioButtons[index];
                    console.log(`Found radio button at index ${index} in answer table`);
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
                    console.log(`Clicking option element: ${selector}`);
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
                    console.log('EnableNextButton function exists but threw error:', e.message);
                }
            } else {
                console.log('EnableNextButton function not found on this page');
                // Try to enable the Next button manually
                const nextButton = document.getElementById('btnSave');
                if (nextButton && nextButton.disabled) {
                    nextButton.disabled = false;
                    console.log('✅ Manually enabled Next button');
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

            console.log(`Successfully selected radio button`);
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

    async saveQuizData(quizData, solution) {
        try {
            // Save to background script storage
            await this.saveToBackgroundStorage({
                type: 'SAVE_QUIZ_DATA',
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

    async copyQuiz() {
        const quizData = this.extractFullQuiz();
        const text = this.formatQuizText(quizData);

        await navigator.clipboard.writeText(text);
        this.showNotification('Quiz question copied to clipboard', 'success');
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
            this.showNotification('✅ Answers auto-selected', 'success');
        } else {
            this.showNotification('No correct answers found', 'warning');
        }
    }

    async downloadQuizPdf() {
        try {
            this.updateStatus('Preparing quiz solutions...');

            // Get saved quizzes from storage
            const result = await new Promise((resolve) => {
                chrome.storage.local.get(['quizData'], resolve);
            });

            console.log('Retrieved quizData from storage:', result);

            const savedQuizzes = result.quizData || [];

            if (savedQuizzes.length === 0) {
                this.showNotification('❌ No quiz data found in storage. Please solve some quizzes first.', 'error');

                // Check if we're on finished page
                if (window.location.href.includes('QuizFinished.aspx')) {
                    this.showNotification('ℹ️ You are on quiz results page. Go to active quiz page to solve questions.', 'info');
                }
                return;
            }

            const groupedQuizzes = this.groupQuizzesByCourseAndStudent(savedQuizzes);

            console.log('Grouped quizzes:', Object.keys(groupedQuizzes).length, 'groups');

            if (Object.keys(groupedQuizzes).length === 0) {
                this.showNotification('❌ No grouped data found', 'error');
                return;
            }

            // Generate separate PDF for each group
            let generatedCount = 0;
            for (const [groupKey, groupInfo] of Object.entries(groupedQuizzes)) {
                if (groupInfo.quizzes && groupInfo.quizzes.length > 0) {
                    console.log(`Processing group ${groupKey} with ${groupInfo.quizzes.length} quizzes`);
                    await this.generateGroupedPdf(groupInfo.quizzes, groupKey);
                    generatedCount++;
                }
            }

            if (generatedCount > 0) {
                this.showNotification(`✅ ${generatedCount} quiz PDF(s) generated`, 'success');
            } else {
                this.showNotification('❌ PDF generation failed - no valid quiz data', 'error');
            }

        } catch (error) {
            console.error('Error downloading PDF:', error);
            this.showNotification(`❌ PDF Error: ${error.message}`, 'error');
        } finally {
            this.updateStatus('Ready');
        }
    }

    groupQuizzesByCourseAndStudent(quizzes) {
        const groups = {};

        quizzes.forEach(quiz => {
            // Create a unique group key based on course code, course name, and student ID
            const groupKey = `${quiz.courseCode || 'Unknown'}_${quiz.courseName || 'Unknown'}_${quiz.studentId || 'Unknown'}`;

            if (!groups[groupKey]) {
                groups[groupKey] = {
                    quizzes: [],
                    courseCode: quiz.courseCode || 'Unknown',
                    courseName: quiz.courseName || 'Unknown',
                    studentId: quiz.studentId || 'Unknown',
                    studentName: quiz.studentName || 'Unknown'
                };
            }

            groups[groupKey].quizzes.push(quiz);
        });

        return groups;
    }

    async generateGroupedPdf(quizzes, groupKey) {
        try {
            // Get group info from the grouped quizzes object
            const grouped = this.groupQuizzesByCourseAndStudent(quizzes);
            const groupInfo = grouped[groupKey];

            console.log('Generating PDF for group:', groupKey, "groupInfo", groupInfo, "quizzes", quizzes);

            if (!groupInfo) {
                // Fallback: create group info from first quiz
                groupInfo = {
                    quizzes: quizzes,
                    courseCode: quizzes[0]?.courseCode || 'Unknown',
                    courseName: quizzes[0]?.courseName || 'Unknown',
                    studentId: quizzes[0]?.studentId || 'Unknown',
                    studentName: quizzes[0]?.studentName || 'Unknown'
                };
            }

            // Create filename with course code, student ID, and date
            const filename = `VU_Quiz_${groupInfo.courseCode}_${groupInfo.studentId}_${Date.now()}.html`;

            // Send data to background script
            const response = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage(
                    {
                        type: 'DOWNLOAD_GROUPED_PDF',
                        data: {
                            quizzes: groupInfo.quizzes || quizzes,
                            groupInfo: groupInfo
                        },
                        filename: filename
                    },
                    (response) => {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                        } else {
                            resolve(response);
                        }
                    }
                );
            });

            return response;

        } catch (error) {
            console.error('Error generating grouped PDF:', error);
            throw error;
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

// Initialize only if on quiz page
if ((window.location.href.includes('/Quiz/') || window.location.href.includes('/FormativeAssessment/'))
    && !window.vuQuizGenie) {
    window.vuQuizGenie = new VUQuizGenie();
}