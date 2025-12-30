// inject_ui.js
(function () {
    'use strict';

    // Check if UI is already injected
    if (document.getElementById('firewall-bypass-container')) {
        return;
    }

    // Utility function to show temporary messages
    function showButtonMessage(button, message, duration = 2000) {
        const originalText = button.textContent;
        button.textContent = message;
        button.disabled = true;

        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
        }, duration);
    }

    // Check current page type
    function getPageType() {
        const url = window.location.href;
        const pathname = window.location.pathname;

        if (url.includes('LessonViewer.aspx')) return 'lesson';
        if (pathname.includes('FormativeAssessment/FAQuizQuestions.aspx') ||
            pathname.includes('Quiz/QuizQuestion.aspx')) return 'quiz';
        if (url.includes('GDB/StudentMessage.aspx')) return 'gdb';
        return 'general';
    }

    // Create a button element (uses CSS classes injected into the page)
    function createButton(text, emoji, onClick) {
        const button = document.createElement('button');
        button.className = 'fb-btn';
        button.type = 'button';
        button.innerHTML = `<span class="fb-emoji">${emoji}</span><span class="fb-label">${text}</span>`;
        button.addEventListener('click', onClick);
        return button;
    }

    // Create the button container
    function createButtonContainer() {
        const container = document.createElement('div');
        container.id = 'firewall-bypass-container';

        const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

        Object.assign(container.style, {
            position: 'fixed',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDarkMode ? 'rgba(15,23,42,0.98)' : 'rgba(255,255,255,0.98)',
            borderRadius: '16px',
            border: `2px solid ${isDarkMode ? 'rgba(51,65,85,0.8)' : 'rgba(226,232,240,0.8)'}`,
            padding: '10px 14px',
            boxShadow: isDarkMode
                ? '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset'
                : '0 12px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(226,232,240,0.8) inset',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            zIndex: '999999',
            fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
            maxWidth: '92vw',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: '0',
            animation: 'slideUp 0.4s ease forwards'
        });

        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
      @keyframes slideUp {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to   { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      @keyframes slideDown {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to   { opacity: 0; transform: translateX(-50%) translateY(20px); }
      }

      /* Container styles - handled by inline JS for dark mode */
      #firewall-bypass-container{
        font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
      }
      
      @media (prefers-color-scheme: dark) {
        #firewall-bypass-container {
          background: rgba(15,23,42,0.98) !important;
          border: 2px solid rgba(51,65,85,0.8) !important;
          box-shadow: 0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset !important;
        }
      }
      
      @media (prefers-color-scheme: light) {
        #firewall-bypass-container {
          background: rgba(255,255,255,0.98) !important;
          border: 2px solid rgba(226,232,240,0.8) !important;
          box-shadow: 0 12px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(226,232,240,0.8) inset !important;
        }
      }

      /* Base button */
      .fb-btn{ display:inline-flex; align-items:center; gap:7px; padding:8px 14px; border-radius:12px; border:none; cursor:pointer;
        font-weight:600; font-size:13px; color:var(--fb-btn-color, #fff); min-height:36px; 
        transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease, filter 0.2s ease;
        letter-spacing: 0.01em;
      }
      .fb-btn .fb-emoji{font-size:15px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));}
      .fb-btn .fb-label{font-weight:600;}

      .fb-btn:focus{ outline:none; box-shadow: 0 0 0 3px rgba(59,130,246,0.3) !important; }

      /* Per-button backgrounds with modern 135deg gradients */
      #allow-events{ background: linear-gradient(135deg,#06b6d4 0%, #0284c7 100%); color:#042f2e; box-shadow: 0 4px 12px rgba(6,182,212,0.3); }
      #bypass-video{ background: linear-gradient(135deg,#fbbf24 0%, #f59e0b 100%); color:#422006; box-shadow: 0 4px 12px rgba(251,191,36,0.3); }
      #skip-assessment-quiz{ background: linear-gradient(135deg,#8b5cf6 0%, #7c3aed 100%); color:#fff; box-shadow: 0 4px 12px rgba(139,92,246,0.3); }
      #gdb-copy-paste{ background: linear-gradient(135deg,#22c55e 0%, #16a34a 100%); color:#052e16; box-shadow: 0 4px 12px rgba(34,197,94,0.3); }
      #chat-gpt{ background: linear-gradient(135deg,#ec4899 0%, #db2777 100%); color:#fff; box-shadow: 0 4px 12px rgba(236,72,153,0.3); }
      #exam-preparation{ background: linear-gradient(135deg,#f97316 0%, #ea580c 100%); color:#431407; box-shadow: 0 4px 12px rgba(249,115,22,0.3); }
      #solve-ai{ background: linear-gradient(135deg,#8b5cf6 0%, #7c3aed 100%); color:#fff; box-shadow: 0 4px 12px rgba(139,92,246,0.3); }
      #skip-all{ background: linear-gradient(135deg,#ef4444 0%, #dc2626 100%); color:#fff; box-shadow: 0 4px 12px rgba(239,68,68,0.3); }
      #auto-skip-lessons{ background: linear-gradient(135deg,#64748b 0%, #475569 100%); color:#ffffff; box-shadow: 0 4px 12px rgba(100,116,139,0.3); }

      /* Support / Need Help button — distinct emerald gradient */
      #support-btn{ background: linear-gradient(135deg,#10b981 0%, #059669 100%); color:#052e16; box-shadow: 0 4px 12px rgba(16,185,129,0.3); }

      /* Hover states */
      .fb-btn:hover{ transform: translateY(-2px); filter:brightness(1.05); }
      #allow-events:hover{ box-shadow: 0 6px 16px rgba(6,182,212,0.4) !important; }
      #bypass-video:hover{ box-shadow: 0 6px 16px rgba(251,191,36,0.4) !important; }
      #skip-assessment-quiz:hover{ box-shadow: 0 6px 16px rgba(139,92,246,0.4) !important; }
      #gdb-copy-paste:hover{ box-shadow: 0 6px 16px rgba(34,197,94,0.4) !important; }
      #chat-gpt:hover{ box-shadow: 0 6px 16px rgba(236,72,153,0.4) !important; }
      #exam-preparation:hover{ box-shadow: 0 6px 16px rgba(249,115,22,0.4) !important; }
      #solve-ai:hover{ box-shadow: 0 6px 16px rgba(139,92,246,0.4) !important; }
      #skip-all:hover{ box-shadow: 0 6px 16px rgba(239,68,68,0.4) !important; }
      #auto-skip-lessons:hover{ box-shadow: 0 6px 16px rgba(100,116,139,0.4) !important; }
      #support-btn:hover{ box-shadow: 0 6px 16px rgba(16,185,129,0.4) !important; }

      /* Close button */
      .fb-close{ position:absolute; top:-10px; right:-10px; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; border:none; font-weight:700; font-size:14px; transition: all 0.25s ease; }
      .fb-close{ background: linear-gradient(135deg,#ef4444,#dc2626); color:white; box-shadow:0 4px 12px rgba(239,68,68,0.3); }
      .fb-close:hover{ box-shadow:0 6px 16px rgba(239,68,68,0.5); }

      /* Reopen floating button */
      .fb-reopen{ position: fixed; bottom:16px; right:16px; width:52px; height:52px; border-radius:50%; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; z-index:999998; font-size:24px; transition: all 0.25s ease; }
      .fb-reopen{ background: linear-gradient(135deg,#06b6d4,#0284c7); color:white; box-shadow:0 8px 20px rgba(6,182,212,0.3); }
      .fb-reopen:hover{ box-shadow:0 12px 28px rgba(6,182,212,0.4); }

      /* AI notification styles with dark mode support */
      #ai-solution-notification{ position: fixed; top:20px; right:20px; border-radius:16px; padding:20px 24px; max-width:440px; z-index:9999999; backdrop-filter: blur(24px) saturate(180%); }
      
      @media (prefers-color-scheme: dark) {
        #ai-solution-notification{ 
          background: rgba(15,23,42,0.98); 
          color:#f1f5f9; 
          box-shadow:0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1) inset; 
          border:2px solid rgba(51,65,85,0.8); 
        }
      }
      
      @media (prefers-color-scheme: light) {
        #ai-solution-notification{ 
          background: rgba(255,255,255,0.98); 
          color:#0f172a; 
          box-shadow:0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(226,232,240,0.8) inset; 
          border:2px solid rgba(226,232,240,0.8); 
        }
      }

    `;
        document.head.appendChild(style);

        // Create close button
        const closeButton = document.createElement('button');
        closeButton.className = 'fb-close';
        closeButton.innerHTML = '✕';
        closeButton.title = 'Close panel';

        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.transform = 'scale(1.1) rotate(90deg)';
        });

        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.transform = 'scale(1) rotate(0deg)';
        });

        closeButton.addEventListener('click', () => {
            container.style.animation = 'slideDown 0.3s ease forwards';
            setTimeout(() => {
                container.remove();
                // Don't save to localStorage - just close for current session
                // Show reopen button
                showReopenButton();
            }, 300);
        });

        container.appendChild(closeButton);

        // Add hover effect to container
        const isDarkModeForHover = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

        container.addEventListener('mouseenter', () => {
            if (isDarkModeForHover) {
                container.style.boxShadow = '0 16px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08) inset';
            } else {
                container.style.boxShadow = '0 16px 50px rgba(0,0,0,0.2), 0 0 0 1px rgba(226,232,240,0.9) inset';
            }
            container.style.transform = 'translateX(-50%) translateY(-2px)';
        });

        container.addEventListener('mouseleave', () => {
            if (isDarkModeForHover) {
                container.style.boxShadow = '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset';
            } else {
                container.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(226,232,240,0.8) inset';
            }
            container.style.transform = 'translateX(-50%) translateY(0)';
        });

        return container;
    }

    // Function to show reopen button
    function showReopenButton() {
        // Don't add if already exists
        if (document.getElementById('firewall-bypass-reopen')) return;

        const reopenBtn = document.createElement('button');
        reopenBtn.id = 'firewall-bypass-reopen';
        reopenBtn.className = 'fb-reopen';
        reopenBtn.innerHTML = '🔥';
        reopenBtn.title = 'Open Firewall Bypass Panel';

        reopenBtn.addEventListener('mouseenter', () => {
            reopenBtn.style.transform = 'scale(1.1) rotate(15deg)';
            reopenBtn.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.6)';
        });

        reopenBtn.addEventListener('mouseleave', () => {
            reopenBtn.style.transform = 'scale(1) rotate(0deg)';
            reopenBtn.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.4)';
        });

        reopenBtn.addEventListener('click', () => {
            reopenBtn.remove();
            // Don't need to remove from localStorage anymore
            init();
        });

        document.body.appendChild(reopenBtn);
    }


    // Utility function to show floating notification messages
    function showNotificationMessage(message, duration = 3000) {
        const msg = document.createElement("div");
        const isDarkModeMsg = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

        Object.assign(msg.style, {
            position: "fixed",
            top: "24px",
            left: "50%",
            transform: "translateX(-50%) translateY(-10px)",
            background: isDarkModeMsg
                ? "rgba(15,23,42,0.98)"
                : "rgba(255,255,255,0.98)",
            color: isDarkModeMsg ? "#f1f5f9" : "#0f172a",
            padding: window.innerWidth <= 480 ? "10px 18px" : "14px 24px",
            borderRadius: "14px",
            boxShadow: isDarkModeMsg
                ? "0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1) inset"
                : "0 12px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(226,232,240,0.8) inset",
            border: `2px solid ${isDarkModeMsg ? 'rgba(51,65,85,0.8)' : 'rgba(226,232,240,0.8)'}`,
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            zIndex: "999999",
            fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
            fontSize: window.innerWidth <= 480 ? "13px" : "14px",
            fontWeight: "600",
            letterSpacing: "0.01em",
            opacity: "1",
            transition: "opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            maxWidth: "92vw",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textAlign: "center"
        });
        document.body.appendChild(msg);
        msg.textContent = message;

        setTimeout(() => {
            msg.style.opacity = "0";
            msg.style.transform = "translateX(-50%) translateY(-30px)";
            setTimeout(() => msg.remove(), 400);
        }, duration);
    }

    // Handler for bypassing video (matching popup.js exactly)
    async function handleBypassVideo(event) {
        const button = event.target.closest('button');
        showButtonMessage(button, '⏳ Processing...');

        try {
            const studentId = document.getElementById("hfStudentID").value;
            const courseCode = document.getElementById("hfCourseCode").value;
            const semester = document.getElementById("hfEnrollmentSemester").value;
            const lessonNo = document.getElementById("MainContent_lblLessonTitle")?.getAttribute("title")?.split(":")[0].replace("Lesson", "").trim() || "";

            const allTabLinks = Array.from(document.querySelectorAll("a.nav-link[id^='tabHeader']"));
            const tabsToProcess = [];

            for (const tabLink of allTabLinks) {
                const tabId = tabLink.id.replace("tabHeader", "");
                const contentId = document.getElementById(`hfContentID${tabId}`)?.value || "";
                const videoId = document.getElementById(`hfVideoID${tabId}`)?.value || "";
                const isVideo = document.getElementById(`hfIsVideo${tabId}`)?.value === "1";
                const tabType = document.getElementById(`hfTabType${tabId}`)?.value || "";
                const typeFlag = isVideo ? 1 : (tabType === "formativeassessment" ? -2 : 0);
                const duration = isVideo ? 60 : 5;
                const tabName = tabLink.textContent.trim();

                if (contentId) {
                    tabsToProcess.push({ tabId, contentId, videoId, isVideo, tabType, typeFlag, duration, tabName });
                }
            }

            const completionPromises = tabsToProcess.map(tab => {
                const { tabId, contentId, videoId, isVideo, typeFlag, duration, tabType, tabName } = tab;

                const hfStatus = document.getElementById(`hfTabCompletionStatus${tabId}`);
                if (hfStatus) hfStatus.value = "Completed";

                if (tabType === "vu-video" || tabType === "video") {
                    const videoStatus = document.getElementById(`lblVCompletionStatus${tabId}`);
                    const pBar = document.getElementById(`pBarVideo${tabId}`);
                    if (videoStatus) videoStatus.innerHTML = "<i class='fa fa-check text-success'></i> Viewed";
                    if (pBar) pBar.style.accentColor = "forestgreen";
                } else if (tabType === "filesystem" || tabType === "formativeassessment") {
                    const readStatus = document.getElementById(`lblRCompletionStatus${tabId}`);
                    if (readStatus) readStatus.innerHTML = "<i class='fa fa-check text-success'></i> Completed";
                } else {
                    const miscStatus = document.getElementById(`lblDBRCompletionStatus${tabId}`);
                    if (miscStatus) miscStatus.innerHTML = "<i class='fa fa-check text-success'></i> Completed";
                }

                document.getElementById(`liHeader${tabId}`)?.classList.remove("disabled");
                document.getElementById(`tabHeader${tabId}`)?.classList.remove("disabled");

                return new Promise(resolve => {
                    if (typeof PageMethods?.SaveStudentVideoLog === "function") {
                        PageMethods.SaveStudentVideoLog(
                            studentId, courseCode, semester, lessonNo,
                            contentId, duration, duration,
                            videoId, typeFlag, window.location.href,
                            () => {
                                if (typeof UpdateTabStatus === "function") {
                                    UpdateTabStatus("Completed", tabId, "-2");
                                }
                                console.log(`✅ Tab ${tabName} (${tabId}) saved`);
                                resolve();
                            },
                            err => {
                                console.error(`❌ Error on tab ${tabName} (${tabId}):`, err);
                                resolve();
                            }
                        );
                    } else {
                        console.warn("⚠️ PageMethods.SaveStudentVideoLog not found");
                        resolve();
                    }
                });
            });

            await Promise.all(completionPromises);

            const lastTab = tabsToProcess[tabsToProcess.length - 1];
            const lastTabId = lastTab?.tabId;
            const lastTabAnchor = document.querySelector(`#tabHeader${lastTabId}`);

            if (lastTabAnchor && typeof SelectTab === "function") {
                console.log(`📍 Instantly activating last tab: ${lastTabId}`);
                SelectTab(lastTabAnchor, new MouseEvent("click"));
            }

            const nextBtn = document.querySelector("#lbtnNextLesson");
            if (nextBtn) {
                nextBtn.classList.remove("disabled");
                nextBtn.click();
                showNotificationMessage(`✅ ${tabsToProcess.length} Modules Done. Moving To Next Lecture ➡️`);
                showButtonMessage(button, '✅ Done!', 2000);
            } else {
                showNotificationMessage("⚠️ Next Lesson button not found", 3000);
                showButtonMessage(button, '⚠️ Check manually', 3000);
            }

        } catch (e) {
            console.error("❌ Unexpected error:", e);
            showNotificationMessage("❌ Error occurred during bypass", 3000);
            showButtonMessage(button, '❌ Error', 3000);
        }
    }

    // Handler for allowing events (copy/paste)
    function handleAllowEvents(event) {
        const button = event.target.closest('button');
        showButtonMessage(button, '⏳ Enabling...');

        if (typeof window.Node?.prototype?._getEventListeners !== 'function') {
            showButtonMessage(button, '✅ Enabled!', 2000);
            return;
        }

        const elements = Array.from(document.querySelectorAll('*'));
        elements.push(document);
        elements.push(window);

        const eventTypes = ['copy', 'paste', 'cut', 'contextmenu', 'keyup', 'keypress', 'keydown', 'auxclick'];
        const controllers = [];

        for (const element of elements) {
            for (const eventType of eventTypes) {
                const listeners = element._getEventListeners?.(eventType);
                if (!listeners) continue;

                for (const listener of listeners) {
                    const controller = new AbortController();
                    controllers.push(controller);
                    element.addEventListener(eventType, (e) => e.stopImmediatePropagation(), {
                        signal: controller.signal,
                        capture: true
                    });
                }
            }
        }

        controllers.forEach(controller => controller.abort());
        showButtonMessage(button, '✅ Copy/Paste ON!', 2000);
    }

    // Handler for GDB Copy-Paste feature
    function handleGDBCopyPaste(event) {
        const button = event.target.closest('button');

        // Validate we're on correct page
        if (!window.location.pathname.includes('GDB/StudentMessage.aspx')) {
            showButtonMessage(button, '❌ Only works on GDB page', 3000);
            return;
        }

        showButtonMessage(button, '⏳ Enabling...');

        try {
            // Add unrestricted copy listener
            document.body.addEventListener("copy", function (event) {
                event.stopPropagation();
            }, true);

            // Add unrestricted paste listener
            document.body.addEventListener("paste", function (event) {
                event.stopPropagation();
            }, true);

            // Add unrestricted cut listener
            document.body.addEventListener("cut", function (event) {
                event.stopPropagation();
            }, true);

            // Add unrestricted contextmenu listener
            document.body.addEventListener("contextmenu", function (event) {
                event.stopPropagation();
            }, true);

            // Enable text selection
            const style = document.createElement('style');
            style.id = 'gdb-copy-paste-style';
            style.textContent = `
        * {
          user-select: text !important;
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
        }
      `;

            // Remove existing style if any
            const existingStyle = document.getElementById('gdb-copy-paste-style');
            if (existingStyle) {
                existingStyle.remove();
            }

            document.head.appendChild(style);

            console.log('✅ GDB Copy-Paste: Manual activation successful');
            showButtonMessage(button, '✅ Copy/Paste ON!', 2000);

        } catch (error) {
            console.error('❌ GDB Copy-Paste Error:', error);
            showButtonMessage(button, '❌ Error occurred', 3000);
        }
    }

    // Shared quiz extraction function
    function extractQuizData() {
        // Quiz helper functions (matching content_scripts_2.js logic)
        const getQuestionWrapper = () => document.querySelector("textarea[id^='txtQuestion'], div > table > tbody > tr > td > table > tbody > tr > td > div:first-child, div > table p");

        const parseMathJax = (element) => {
            element = element.cloneNode(true);
            Array.from(element.querySelectorAll("script")).forEach(script => {
                const span = document.createElement("span");
                span.textContent = reconstructLatex(script.textContent);
                script.replaceWith(span);
            });
            Array.from(element.querySelectorAll(".MathJax_Display, .MathJax_Preview, .MathJax")).forEach(el => el.remove());
            return element.textContent;
        };

        const hasMathJax = (element) => element?.querySelector(".MathJax_Preview") instanceof Element;

        const isLatexString = (str) => /\$(.*|\n)+\$/g.test(str) || /\\\((.*|\n)+\)/g.test(str) || /^\$\$(.*|\n)+?/gi.test(str) && /\$\$$/g.test(str) || /^\\\[(.*|\n)+?/gi.test(str) && /\\]$/g.test(str);

        const reconstructLatex = (str) => typeof str !== "string" ? str : (str = str.trim(), isLatexString(str) ? str : `\\[${str}\\]`);

        const getQuestionText = () => {
            let questionText;
            let textareas = Array.from(document.querySelectorAll("textarea[id^='txtQuestion']"));

            if (textareas.length) {
                textareas.filter(el => el.style.display !== "none" && el.style.opacity === "").forEach(el => {
                    if (el.value && el.value.trim()) {
                        questionText = el.value.trim();
                    }
                });
            } else {
                let wrapper = document.querySelector("div > table > tbody > tr > td > table > tbody > tr > td > div:first-child") || getQuestionWrapper();
                if (!wrapper) return questionText;

                const mathJaxPresent = hasMathJax(wrapper);
                textareas = Array.from(wrapper.querySelectorAll("textarea, p"));
                let children = Array.from(wrapper.children).filter(el => el.style.display !== "none" && el.style.opacity === "" && el.firstElementChild && el.innerText);
                children = children.map(el => {
                    if (el.children.length > 0) {
                        let child = Array.from(el.children).filter(child => child.style.display !== "none" && child.style.opacity === "" && child.innerText);
                        return child.length > 0 ? child[0].textContent.trim() : null;
                    }
                    return el.style.display !== "none" ? el.textContent.trim() : null;
                });

                if (textareas.length && !children.length) {
                    textareas.filter(el => el.style.display !== "none" && el.style.opacity === "").forEach(el => {
                        if (el.value && el.value.trim()) {
                            questionText = el.value.trim();
                        }
                    });
                }

                questionText = children.length > 0 ? children[0]?.trim() : questionText;

                if (mathJaxPresent) {
                    const mathJaxElement = wrapper.querySelector(".MathJax_Preview")?.parentElement;
                    questionText = mathJaxElement ? parseMathJax(mathJaxElement) : reconstructLatex(wrapper.querySelector("script")?.textContent) ?? questionText;
                }
            }
            return questionText;
        };

        const getAnswerText = (element) => {
            if (!element) return null;
            let text = "value" in element ? element.value.trim() : element.textContent.trim();
            const mathJaxPresent = element.querySelector(".MathJax_Preview") instanceof Element;

            if (mathJaxPresent) {
                const mathJaxElement = element.querySelector(".MathJax_Preview").parentElement;
                text = parseMathJax(mathJaxElement);
            }

            return { text: text?.trim() };
        };

        const getAnswersText = () => {
            const answersElements = Array.from(document.querySelectorAll("table table table td > div span[id^='lblExpression'], textarea[name^='lblAnswer']"));
            return answersElements.map(getAnswerText).filter(answer => answer !== undefined && answer !== null);
        };

        // Get question and answers
        const questionText = getQuestionText();
        const answersText = getAnswersText();

        if (!questionText || !answersText.length) {
            return null;
        }

        // Format the text
        const formattedText = `${questionText}\n\n${answersText.map(answer => answer.text).join("\n\n")}`;

        return formattedText;
    }

    // Listen for answer selection changes
    function setupAnswerSelectionListener() {
        // Helper to extract answer text with MathJax support
        const getAnswerTextWithLatex = (element) => {
            if (!element) return null;

            let text = element.value?.trim() || element.textContent?.trim();

            // Check for MathJax and parse it
            const hasMathJax = element.querySelector('.MathJax_Preview');
            if (hasMathJax) {
                const mathJaxElement = hasMathJax.parentElement;
                // Clone and extract LaTeX
                const cloned = mathJaxElement.cloneNode(true);
                Array.from(cloned.querySelectorAll('script')).forEach(script => {
                    const span = document.createElement('span');
                    span.textContent = script.textContent?.trim() || '';
                    script.replaceWith(span);
                });
                Array.from(cloned.querySelectorAll('.MathJax_Display, .MathJax_Preview, .MathJax')).forEach(el => el.remove());
                text = cloned.textContent?.trim();
            }

            return text;
        };

        // Find all radio buttons for quiz answers
        const radioButtons = document.querySelectorAll("input[type='radio'][id^='radioBtn']");

        if (radioButtons.length > 0) {
            console.log(`📻 [Answer Tracker] Found ${radioButtons.length} answer options, setting up listeners`);

            radioButtons.forEach((radio, index) => {
                radio.addEventListener('change', function () {
                    if (this.checked) {
                        console.log(`📻 [Answer Tracker] Radio button ${index + 1} clicked`);

                        // Get the selected answer text with LaTeX support
                        const row = this.closest('tr');
                        const answerElement = row?.querySelector("span[id^='lblExpression'], textarea");

                        if (answerElement) {
                            const selectedText = getAnswerTextWithLatex(answerElement);

                            console.log('📝 [Answer Tracker] Extracted answer text:', selectedText?.substring(0, 100) + '...');

                            if (selectedText && window.QuizTracker) {
                                // Use cached metadata if available (more reliable than searching)
                                const cached = window._lastCopiedQuiz;

                                if (cached && (Date.now() - cached.timestamp) < 300000) { // 5 minutes
                                    console.log('🎯 [Answer Tracker] Using cached quiz metadata:', {
                                        courseCode: cached.courseCode,
                                        questionPreview: cached.questionText.substring(0, 50) + '...',
                                        cacheAge: Math.round((Date.now() - cached.timestamp) / 1000) + 's'
                                    });

                                    const result = window.QuizTracker.updateQuizWithAnswer(
                                        cached.questionText,
                                        cached.courseCode,
                                        selectedText,
                                        cached.courseName
                                    );

                                    if (result.success) {
                                        console.log('✅ [Answer Tracker] Quiz updated successfully:', result);
                                        // showNotificationMessage('✅ Answer selection saved!', 2000);

                                        // Check if we have 10 quizzes and auto-sync to database
                                        const quizzes = window.QuizTracker.getQuizzes();
                                        if (quizzes.length === 10) {
                                            console.log('📤 [Auto-Sync] 10 quizzes completed! Generating PDF...');
                                            showNotificationMessage('📤 Generating PDF for 10 quizzes...', 3000);

                                            // Send to database
                                            if (window.QuizPDFGenerator && typeof window.QuizPDFGenerator.sendQuizzesToAPI === 'function') {
                                                window.QuizPDFGenerator.sendQuizzesToAPI(quizzes)
                                                    .then(success => {
                                                        if (success) {
                                                            console.log('✅ [Auto-Sync] Successfully synced to database');
                                                            showNotificationMessage('✅ 10 quizzes synced! Click "Generate PDF" button when ready.', 4000);
                                                        } else {
                                                            console.warn('⚠️ [Auto-Sync] Failed to sync to database');
                                                            showNotificationMessage('⚠️ Database sync failed. Click "Generate PDF" to try again.', 4000);
                                                        }
                                                    })
                                                    .catch(error => {
                                                        console.error('❌ [Auto-Sync] Error:', error);
                                                        showNotificationMessage('❌ Sync error. Click "Generate PDF" to retry.', 4000);
                                                    });
                                            }
                                        } else {
                                            showNotificationMessage('✅ Answer saved!', 2000);
                                        }
                                    } else {
                                        console.error('❌ [Answer Tracker] Failed to update quiz:', result);
                                    }
                                } else {
                                    // Fallback to most recent quiz
                                    console.warn('⚠️ [Answer Tracker] No cached quiz or cache expired, using most recent quiz');

                                    const quizzes = window.QuizTracker.getQuizzes();
                                    console.log('📊 [Answer Tracker] Total quizzes in storage:', quizzes.length);

                                    if (quizzes.length > 0) {
                                        const lastQuiz = quizzes[quizzes.length - 1];

                                        console.log('🎯 [Answer Tracker] Attempting to update most recent quiz:', {
                                            quizIndex: lastQuiz.quizIndex,
                                            courseCode: lastQuiz.courseCode,
                                            questionPreview: lastQuiz.questionText.substring(0, 50) + '...'
                                        });

                                        const result = window.QuizTracker.updateQuizWithAnswer(
                                            lastQuiz.questionText,
                                            lastQuiz.courseCode,
                                            selectedText,
                                            lastQuiz.courseName
                                        );

                                        if (result.success) {
                                            console.log('✅ [Answer Tracker] Quiz updated successfully:', result);
                                            // showNotificationMessage('✅ Answer selection saved!', 2000);

                                            // Check if we have 10 quizzes and auto-sync to database
                                            const quizzes = window.QuizTracker.getQuizzes();
                                            if (quizzes.length === 10) {
                                                console.log('📤 [Auto-Sync] 10 quizzes completed! Syncing to database...');
                                                showNotificationMessage('📤 Generating PDF for 10 quizzes...', 3000);

                                                // Send to database
                                                if (window.QuizPDFGenerator && typeof window.QuizPDFGenerator.sendQuizzesToAPI === 'function') {
                                                    window.QuizPDFGenerator.sendQuizzesToAPI(quizzes)
                                                        .then(success => {
                                                            if (success) {
                                                                console.log('✅ [Auto-Sync] Successfully synced to database');
                                                                showNotificationMessage('✅ 10 quizzes synced! Click "Generate PDF" button when ready.', 4000);
                                                            } else {
                                                                console.warn('⚠️ [Auto-Sync] Failed to sync to database');
                                                                showNotificationMessage('⚠️ Database sync failed. Click "Generate PDF" to try again.', 4000);
                                                            }
                                                        })
                                                        .catch(error => {
                                                            console.error('❌ [Auto-Sync] Error:', error);
                                                            showNotificationMessage('❌ Sync error. Click "Generate PDF" to retry.', 4000);
                                                        });
                                                }
                                            } else {
                                                showNotificationMessage('✅ Answer saved!', 2000);
                                            }
                                        } else {
                                            console.error('❌ [Answer Tracker] Failed to update quiz:', result);
                                        }
                                    } else {
                                        console.warn('⚠️ [Answer Tracker] No quizzes in storage yet. Copy a quiz first!');
                                    }
                                }
                            } else {
                                console.warn('⚠️ [Answer Tracker] Could not extract answer text or QuizTracker not available');
                            }
                        } else {
                            console.warn('⚠️ [Answer Tracker] Could not find answer element in row');
                        }
                    }
                });
            });
        } else {
            console.warn('⚠️ [Answer Tracker] No radio buttons found on page');
        }

        // Also add submit button listener as fallback
        const submitButton = document.querySelector("input#btnSave, button[type='submit']");
        if (submitButton) {
            console.log('📤 [Answer Tracker] Found submit button, adding fallback listener');

            submitButton.addEventListener('click', function () {
                setTimeout(() => {
                    const checkedRadio = document.querySelector("input[type='radio'][id^='radioBtn']:checked");
                    if (checkedRadio) {
                        const row = checkedRadio.closest('tr');
                        const answerElement = row?.querySelector("span[id^='lblExpression'], textarea");
                        const selectedText = getAnswerTextWithLatex(answerElement);

                        if (selectedText && window.QuizTracker) {
                            const cached = window._lastCopiedQuiz;
                            if (cached && (Date.now() - cached.timestamp) < 300000) {
                                const result = window.QuizTracker.updateQuizWithAnswer(
                                    cached.questionText,
                                    cached.courseCode,
                                    selectedText
                                );
                                console.log('📤 [Answer Tracker] Submit button update:', result);

                                // Check if we have 10 quizzes and auto-sync to database
                                if (result.success) {
                                    const quizzes = window.QuizTracker.getQuizzes();
                                    if (quizzes.length === 10) {
                                        console.log('📤 [Auto-Sync] 10 quizzes completed! Syncing to database...');

                                        // Send to database
                                        if (window.QuizPDFGenerator && typeof window.QuizPDFGenerator.sendQuizzesToAPI === 'function') {
                                            window.QuizPDFGenerator.sendQuizzesToAPI(quizzes)
                                                .then(success => {
                                                    if (success) {
                                                        console.log('✅ [Auto-Sync] Successfully synced to database');
                                                    }
                                                })
                                                .catch(error => {
                                                    console.error('❌ [Auto-Sync] Error:', error);
                                                });
                                        }
                                    }
                                }
                            }
                        }
                    }
                }, 100);
            }, { once: true });
        }
    }

    // Handler for copying quiz to clipboard
    function handleCopyQuiz(event) {
        const button = event.target.closest('button');
        showButtonMessage(button, '⏳ Copying...');

        try {
            // STEP 1: Copy to clipboard first (this always works)
            const quizText = extractQuizData();

            if (!quizText) {
                showButtonMessage(button, '❌ No quiz found', 3000);
                return;
            }

            // Copy to clipboard immediately
            navigator.clipboard.writeText(quizText).then(() => {
                showButtonMessage(button, '✅ Copied!', 2000);

                // STEP 2: Now try to track (happens after copy, doesn't block)
                setTimeout(() => {
                    try {
                        // Extract structured quiz data for tracking
                        const getQuestionText = () => {
                            let questionText = null;

                            // Try multiple methods to get question text
                            // Method 1: Hidden textarea
                            const textareas = Array.from(document.querySelectorAll("textarea[id^='txtQuestion']"));
                            for (const textarea of textareas) {
                                if (textarea.value && textarea.value.trim()) {
                                    questionText = textarea.value.trim();
                                    break;
                                }
                            }

                            // Method 2: Visible div wrapper
                            if (!questionText) {
                                const wrapper = document.querySelector("div > table > tbody > tr > td > table > tbody > tr > td > div:first-child");
                                if (wrapper) {
                                    const children = Array.from(wrapper.children)
                                        .filter(el => el.style.display !== "none" && el.textContent && el.textContent.trim());

                                    for (const child of children) {
                                        if (child.children.length > 0) {
                                            const innerChild = Array.from(child.children).find(c =>
                                                c.style.display !== "none" && c.textContent && c.textContent.trim()
                                            );
                                            if (innerChild) {
                                                questionText = innerChild.textContent.trim();
                                                break;
                                            }
                                        } else if (child.textContent && child.textContent.trim()) {
                                            questionText = child.textContent.trim();
                                            break;
                                        }
                                    }
                                }
                            }

                            // Method 3: Extract from copied text (fallback)
                            if (!questionText && quizText) {
                                const lines = quizText.split('\n').filter(l => l.trim());
                                if (lines.length > 0) {
                                    questionText = lines[0].trim();
                                }
                            }

                            return questionText;
                        };

                        const getAnswersText = () => {
                            const answersElements = Array.from(document.querySelectorAll(
                                "table table table td > div span[id^='lblExpression'], textarea[name^='lblAnswer']"
                            ));

                            const answers = answersElements
                                .map(el => {
                                    const text = "value" in el ? el.value.trim() : el.textContent.trim();
                                    return text && text.length > 0 ? text : null;
                                })
                                .filter(text => text !== null);

                            // Fallback: extract from copied text
                            if (answers.length === 0 && quizText) {
                                const lines = quizText.split('\n').filter(l => l.trim());
                                // Skip first line (question), rest are options
                                for (let i = 1; i < lines.length; i++) {
                                    if (lines[i].trim()) {
                                        answers.push(lines[i].trim());
                                    }
                                }
                            }

                            return answers;
                        };

                        const getSelectedOption = () => {
                            const checkedInput = document.querySelector("table table table td > span input[id^='radioBtn']:checked");
                            if (checkedInput) {
                                const answerSpan = checkedInput.parentElement?.nextElementSibling?.querySelector("span[id^='lblExpression']");
                                return answerSpan ? answerSpan.textContent.trim() : null;
                            }
                            return null;
                        };

                        const getCourseCode = () => {
                            const courseEl = document.querySelector("#lblCourseCode, #m_lblCourseCode");
                            if (!courseEl) return { code: 'UNKNOWN', fullName: 'UNKNOWN' };

                            const fullText = courseEl.textContent.trim();
                            // Extract just the course code (e.g., "CS607" from "CS607 - Artificial Intelligence (Semester Quiz # 2)")
                            const codeMatch = fullText.match(/^([A-Z]{2,4}\d{3,4})/);
                            const code = codeMatch ? codeMatch[1] : fullText;

                            return { code: code, fullName: fullText };
                        };

                        // Extract data
                        const questionText = getQuestionText();
                        const options = getAnswersText();
                        const selectedOption = getSelectedOption();
                        const courseInfo = getCourseCode();

                        console.log('📊 [Copy Quiz] Extracted data:', {
                            questionPreview: questionText?.substring(0, 50) + '...',
                            optionsCount: options.length,
                            hasQuestion: !!questionText,
                            hasOptions: options.length > 0,
                            courseCode: courseInfo.code,
                            courseName: courseInfo.fullName
                        });

                        // Validate before tracking
                        if (!questionText || !options || options.length === 0) {
                            console.warn('⚠️ [Copy Quiz] Skipping tracking - incomplete data');
                            return;
                        }

                        // Structure quiz data for tracking
                        const structuredQuizData = {
                            questionText: questionText,
                            options: options.map(opt => opt.trim()), // Ensure options are trimmed strings
                            selectedOption: selectedOption ? selectedOption.trim() : null,
                            courseCode: courseInfo.code,
                            courseName: courseInfo.fullName
                        };

                        // Cache metadata globally for answer tracking
                        window._lastCopiedQuiz = {
                            questionText: questionText,
                            courseCode: courseInfo.code,
                            courseName: courseInfo.fullName,
                            options: options,
                            timestamp: Date.now()
                        };
                        console.log('💾 [Copy Quiz] Cached quiz metadata for answer tracking');

                        // Save to tracker if QuizTracker is available
                        if (window.QuizTracker) {
                            const result = window.QuizTracker.saveQuiz(structuredQuizData);
                            console.log('📊 Quiz tracking result:', result);

                            // Show notification and PDF button when 10th quiz is copied
                            const count = result.count || 0;
                            if (count === 10) {
                                showNotificationMessage(
                                    '🎉 10 quizzes collected! Select your answer to auto-sync.',
                                    5000
                                );

                                // Show Generate PDF button
                                if (window.QuizPDFGenerator && typeof window.QuizPDFGenerator.showGenerateButton === 'function') {
                                    window.QuizPDFGenerator.showGenerateButton();
                                }
                            }
                        } else {
                            console.warn('⚠️ QuizTracker not available');
                        }

                    } catch (trackError) {
                        console.error('❌ Error during quiz tracking:', trackError);
                        // Don't show error to user - copy already succeeded
                    }
                }, 100); // Small delay to ensure DOM is stable

            }).catch(err => {
                console.error('Failed to copy:', err);
                showButtonMessage(button, '❌ Copy failed', 3000);
            });

        } catch (error) {
            console.error('Error copying quiz:', error);
            showButtonMessage(button, '❌ Error', 3000);
        }
    }

    // Handler for solving quiz with AI
    // async function handleSolveWithAI(event) {
    //   const button = event.target.closest('button');

    //   // Save original button state
    //   const originalText = button.innerHTML;
    //   const originalDisabled = button.disabled;

    //   // Show loading state
    //   button.innerHTML = '<span style="font-size: 14px; margin-right: 4px;">⏳</span>Solving...';
    //   button.disabled = true;

    //   try {
    //     // Extract quiz data
    //     const quizText = extractQuizData();

    //     if (!quizText) {
    //       button.innerHTML = '<span style="font-size: 14px; margin-right: 4px;">❌</span>No quiz found';
    //       setTimeout(() => {
    //         button.innerHTML = originalText;
    //         button.disabled = originalDisabled;
    //       }, 3000);
    //       return;
    //     }

    //     // Create a unique event ID for communication
    //     const eventId = 'ai-solve-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    //     // Send message to content script to make API request (bypasses CORS)
    //     window.postMessage({
    //       type: 'FIREWALL_BYPASS_AI_REQUEST',
    //       eventId: eventId,
    //       quizText: quizText
    //     }, '*');

    //     // Wait for response
    //     const responsePromise = new Promise((resolve, reject) => {
    //       const timeout = setTimeout(() => {
    //         window.removeEventListener('message', messageHandler);
    //         reject(new Error('Request timeout - AI service took too long to respond'));
    //       }, 30000); // 30 second timeout

    //       const messageHandler = (event) => {
    //         if (event.data.type === 'FIREWALL_BYPASS_AI_RESPONSE' && event.data.eventId === eventId) {
    //           clearTimeout(timeout);
    //           window.removeEventListener('message', messageHandler);

    //           if (event.data.error) {
    //             reject(new Error(event.data.error));
    //           } else {
    //             resolve(event.data.solution);
    //           }
    //         }
    //       };

    //       window.addEventListener('message', messageHandler);
    //     });

    //     const solutionText = await responsePromise;

    //     // Display the AI solution
    //     displayAISolution(solutionText);

    //     // Show success state
    //     button.innerHTML = '<span style="font-size: 14px; margin-right: 4px;">✅</span>Solved!';
    //     setTimeout(() => {
    //       button.innerHTML = originalText;
    //       button.disabled = originalDisabled;
    //     }, 2000);

    //   } catch (error) {
    //     console.error('Error solving quiz with AI:', error);

    //     // Show error state
    //     button.innerHTML = '<span style="font-size: 14px; margin-right: 4px;">❌</span>Failed';
    //     setTimeout(() => {
    //       button.innerHTML = originalText;
    //       button.disabled = originalDisabled;
    //     }, 3000);

    //     // Show error message to user
    //     displayAISolution(`Error: ${error.message}\n\nPlease try again. If the problem persists, check your internet connection.`);
    //   }
    // }

    // Display AI solution in a small notification
    function displayAISolution(content) {
        // Remove existing notification if any
        const existingNotification = document.getElementById('ai-solution-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification container
        const notification = document.createElement('div');
        notification.id = 'ai-solution-notification';

        const isDarkModeNotif = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: isDarkModeNotif ? 'rgba(15,23,42,0.98)' : 'rgba(255,255,255,0.98)',
            borderRadius: '16px',
            padding: '20px 24px',
            maxWidth: '440px',
            maxHeight: '520px',
            overflow: 'auto',
            boxShadow: isDarkModeNotif
                ? '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1) inset'
                : '0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(226,232,240,0.8) inset',
            border: `2px solid ${isDarkModeNotif ? 'rgba(51,65,85,0.8)' : 'rgba(226,232,240,0.8)'}`,
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            zIndex: '9999999',
            animation: 'slideInRight 0.4s ease',
            fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif"
        });

        // Add animations
        const style = document.createElement('style');
        style.textContent = `
      @keyframes slideInRight {
        from {
          opacity: 0;
          transform: translateX(100px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      @keyframes slideOutRight {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(100px);
        }
      }
    `;
        if (!document.querySelector('style[data-ai-notification-style]')) {
            style.setAttribute('data-ai-notification-style', 'true');
            document.head.appendChild(style);
        }

        // Create header
        const header = document.createElement('div');
        Object.assign(header.style, {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: isDarkModeNotif ? '1px solid rgba(51,65,85,0.6)' : '1px solid rgba(226,232,240,0.8)'
        });

        const title = document.createElement('div');
        title.innerHTML = `<span style="font-size: 18px; margin-right: 8px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">🤖</span><strong style="background: linear-gradient(135deg, #06b6d4, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 15px; font-weight: 700;">AI Solution</strong>`;

        const closeButton = document.createElement('button');
        closeButton.innerHTML = '✕';
        Object.assign(closeButton.style, {
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            flexShrink: '0'
        });

        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.transform = 'scale(1.1) rotate(90deg)';
        });

        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.transform = 'scale(1) rotate(0deg)';
        });

        closeButton.addEventListener('click', () => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        });

        header.appendChild(title);
        header.appendChild(closeButton);

        // Create content area
        const contentArea = document.createElement('div');
        Object.assign(contentArea.style, {
            color: isDarkModeNotif ? '#e2e8f0' : '#334155',
            fontSize: '14px',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            marginBottom: '16px',
            fontWeight: '500'
        });
        contentArea.textContent = content;

        // Create copy button
        const copyButton = document.createElement('button');
        copyButton.innerHTML = '<span style="margin-right: 6px; font-size: 16px;">📋</span><span>Copy Answer</span>';
        Object.assign(copyButton.style, {
            width: '100%',
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
            letterSpacing: '0.01em'
        });

        copyButton.addEventListener('mouseenter', () => {
            copyButton.style.transform = 'translateY(-2px)';
            copyButton.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
        });

        copyButton.addEventListener('mouseleave', () => {
            copyButton.style.transform = 'translateY(0)';
            copyButton.style.boxShadow = '0 4px 12px rgba(59,130,246,0.3)';
        });

        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(content).then(() => {
                copyButton.innerHTML = '<span style="margin-right: 6px; font-size: 16px;">✅</span><span>Copied!</span>';
                copyButton.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
                setTimeout(() => {
                    copyButton.innerHTML = '<span style="margin-right: 6px; font-size: 16px;">📋</span><span>Copy Answer</span>';
                    copyButton.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy solution:', err);
                copyButton.innerHTML = '<span style="margin-right: 6px; font-size: 16px;">❌</span><span>Failed</span>';
                copyButton.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
                setTimeout(() => {
                    copyButton.innerHTML = '<span style="margin-right: 6px; font-size: 16px;">📋</span><span>Copy Answer</span>';
                    copyButton.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
                }, 2000);
            });
        });

        // Assemble notification
        notification.appendChild(header);
        notification.appendChild(contentArea);
        notification.appendChild(copyButton);

        // Add to page
        document.body.appendChild(notification);

        // Auto-dismiss after 7 seconds
        setTimeout(() => {
            if (notification && notification.parentElement) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 7000);
    }

    // Handler for skipping quiz (formative assessment)
    function handleSkipQuiz(event) {
        const button = event.target.closest('button');
        showButtonMessage(button, '⏳ Skipping...');

        const hiddenInputs = document.querySelectorAll('input[type="hidden"]');
        const activeTabElement = document.getElementById('hfActiveTab');

        if (!activeTabElement) {
            showButtonMessage(button, '❌ Not on quiz', 3000);
            return;
        }

        const numericPart = activeTabElement.value.match(/\d+/)[0];
        const hfIsVideo = 'hfIsVideo' + numericPart;
        let quizCompleted = null;

        hiddenInputs.forEach((input) => {
            if (input.id === hfIsVideo && input.value === '2') {
                input.value = '0';
                quizCompleted = 'Completed';
            }
        });

        if (quizCompleted === 'Completed') {
            showButtonMessage(button, '✅ Skipped!', 2000);

            setTimeout(() => {
                const activeTab = document.getElementById('hfActiveTab')?.value;
                const tabHeaderId = activeTab?.replace('tabHeader', 'tab');
                const currentLi = document.querySelector(`li[data-contentid="${tabHeaderId}"]`);
                const nextLi = currentLi?.nextElementSibling;

                if (nextLi) {
                    nextLi.click();
                }
            }, 2000);
        } else {
            showButtonMessage(button, '❌ Failed', 3000);
        }
    }

    // Handler for skipping assessment quiz (graded quiz)
    function handleSkipAssessmentQuiz(event) {
        const button = event.target.closest('button');
        showButtonMessage(button, '⏳ Bypassing...');

        const hiddenInputs = document.querySelectorAll('input[type="hidden"]');
        const activeTabElement = document.getElementById('hfActiveTab');

        if (!activeTabElement) {
            showButtonMessage(button, '❌ Not found', 3000);
            return;
        }

        const numericPart = activeTabElement.value.match(/\d+/)[0];
        const hfIsVideo = 'hfIsVideo' + numericPart;
        let quizCompleted = null;

        hiddenInputs.forEach((input) => {
            if (input.id === hfIsVideo) {
                input.value = '1';
            }
            if (input.value === 'Completed') {
                quizCompleted = input.value;
            }
        });

        if (quizCompleted === 'Completed') {
            showButtonMessage(button, '✅ Quiz bypassed!', 2000);

            setTimeout(() => {
                const url = window.location.href;
                if (url.includes('LessonViewer')) {
                    const nextButton = document.getElementById('lbtnNextLesson');
                    if (nextButton) {
                        nextButton.click();
                        showButtonMessage(button, '⏭️ Moving next...', 2000);
                    }
                }
            }, 2000);
        } else {
            showButtonMessage(button, '❌ Failed', 3000);
        }
    }

    // Populate buttons based on page type
    function populateButtons(container) {
        const pageType = getPageType();

        // Lesson page - Video bypass and skip assessment quiz
        if (pageType === 'lesson') {

            const videoBtn = createButton('Mark Lecture as Viewed', '✅', handleBypassVideo);
            videoBtn.id = 'bypass-video';
            container.appendChild(videoBtn);

            const skipAssessmentBtn = createButton('Skip Assessment Quiz', '🎯', handleSkipAssessmentQuiz);
            skipAssessmentBtn.id = 'skip-assessment-quiz';
            container.appendChild(skipAssessmentBtn);

        }

        // Quiz page - Copy quiz, solve with AI, and enable copy/paste
        if (pageType === 'quiz') {
            const copyQuizBtn = createButton('Copy Quiz', '📋', handleCopyQuiz);
            copyQuizBtn.id = 'allow-events';
            container.appendChild(copyQuizBtn);



            // const solveAIBtn = createButton('Solve with AI', '🤖', handleSolveWithAI);
            // solveAIBtn.id = 'solve-ai';
            // container.appendChild(solveAIBtn);
        }

        // GDB page - Enable copy-paste functionality
        if (pageType === 'gdb') {
            const gdbBtn = createButton('Enable GDB Copy & Paste', '📝', handleGDBCopyPaste);
            gdbBtn.id = 'gdb-copy-paste';
            container.appendChild(gdbBtn);
        }

        // Always available buttons (except ChatGPT on lesson pages)
        if (pageType !== 'lesson') {
            const chatBtn = createButton('Open ChatGPT', '🤖', () => {
                window.open('https://chatgpt.com/g/g-68fcba20984c8191b7687c026816d1cb-virtual-university-of-pakistan?utm_source=hackerwasii_blog&utm_medium=referral&utm_campaign=extension', 'ChatGPT',
                    `width=400,height=${screen.availHeight},left=${screen.availWidth - 400},top=0`);
            });
            chatBtn.id = 'chat-gpt';
            container.appendChild(chatBtn);
        }

        const examBtn = createButton('Exam Resources', '📚', () => {
            window.open('https://wasii.dev/vu-study-material?utm_source=browser_extension&utm_medium=referral&utm_campaign=vu_study_access', '_blank');
        });
        examBtn.id = 'exam-preparation';
        container.appendChild(examBtn);

        // Don't show Need Help button on quiz pages
        if (pageType !== 'quiz') {
            const supportBtn = createButton('Need Help?', '', () => {
                window.open('https://wasii.dev/s/whatsapp', '_blank');
            });
            supportBtn.id = 'support-btn';
            container.appendChild(supportBtn);
        }
    }

    // Initialize the UI
    function init() {
        // Always show the panel on page load (don't check localStorage)
        const container = createButtonContainer();
        populateButtons(container);
        document.body.appendChild(container);

        // Setup answer selection tracking on quiz pages
        const pageType = getPageType();
        if (pageType === 'quiz') {
            // Wait a bit for quiz to fully load
            setTimeout(() => {
                setupAnswerSelectionListener();
            }, 1000);
        }
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();