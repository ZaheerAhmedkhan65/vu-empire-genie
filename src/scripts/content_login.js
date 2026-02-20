// content_login.js – Auto‑fill VULMS login credentials

(function () {
    'use strict';
    
    // Clear any stale student info when visiting the login page
    chrome.storage.local.remove('studentInfo');
    chrome.storage.sync.remove('studentInfo');

    // Only run on the login page – verify required elements exist
    const studentIdInput = document.getElementById('txtStudentID');
    const passwordInput = document.getElementById('txtPassword');
    const loginButton = document.getElementById('ibtnLogin');

    if (!studentIdInput || !passwordInput || !loginButton) {
        return; // Not the login page
    }

    // ----- Inject the "Auto Login" button -----
    const autoLoginBtn = document.createElement('button');
    autoLoginBtn.id = 'vu-auto-login-btn';
    autoLoginBtn.textContent = 'Auto Sign In';
    Object.assign(autoLoginBtn.style, {
        backgroundColor: '#4CAF50',
        border: 'none',
        color: 'white',
        padding: '12px 20px',
        textAlign: 'center',
        textDecoration: 'none',
        display: 'inline-block',
        fontSize: '16px',
        margin: '4px 2px',
        cursor: 'pointer',
        borderRadius: '33px',
        fontWeight: 'bold'
    });

    // Insert button near the original Sign In button
    const formActionDiv = document.querySelector('.m-login__form-action');
    if (formActionDiv) {
        formActionDiv.appendChild(autoLoginBtn);
    } else {
        // Fallback: place right after the login button
        loginButton.parentNode.insertBefore(autoLoginBtn, loginButton.nextSibling);
    }

    // ----- Helper: fill credentials and trigger login -----
    function autoLogin(studentId, password) {
        studentIdInput.value = studentId;
        passwordInput.value = password;
        // Dispatch input events in case the page listens for them
        studentIdInput.dispatchEvent(new Event('input', { bubbles: true }));
        passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
        // Click the login button – this will run ValidateFields() as usual
        loginButton.click();
    }

    // ----- Helper: show a form to collect credentials -----
    function showCredentialForm() {
        // Semi‑transparent overlay
        const overlay = document.createElement('div');
        overlay.id = 'vu-cred-overlay';
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '10000'
        });

        // White form container
        const formContainer = document.createElement('div');
        Object.assign(formContainer.style, {
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '300px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
        });

        formContainer.innerHTML = `
      <h3 style="margin-top:0;">Enter VU Credentials</h3>
      <label style="display:block; margin-bottom:8px;">Student ID:</label>
      <input type="text" id="vu-cred-studentid" style="width:100%; padding:8px; margin-bottom:12px; border:1px solid #ccc; border-radius:4px;">
      <label style="display:block; margin-bottom:8px;">Password:</label>
      <input type="password" id="vu-cred-password" style="width:100%; padding:8px; margin-bottom:16px; border:1px solid #ccc; border-radius:4px;">
      <div style="text-align:right;">
        <button id="vu-cred-cancel" style="padding:8px 16px; margin-right:8px; border:none; background:#ccc; border-radius:4px; cursor:pointer;">Cancel</button>
        <button id="vu-cred-save" style="padding:8px 16px; border:none; background:#4CAF50; color:white; border-radius:4px; cursor:pointer;">Save & Login</button>
      </div>
    `;

        overlay.appendChild(formContainer);
        document.body.appendChild(overlay);

        // Focus the first field
        document.getElementById('vu-cred-studentid').focus();

        // Cancel button
        document.getElementById('vu-cred-cancel').addEventListener('click', () => {
            overlay.remove();
        });

        // Save button
        document.getElementById('vu-cred-save').addEventListener('click', () => {
            const sid = document.getElementById('vu-cred-studentid').value.trim();
            const pwd = document.getElementById('vu-cred-password').value;
            if (!sid || !pwd) {
                alert('Please enter both Student ID and Password');
                return;
            }
            // Store in chrome.storage.sync
            chrome.storage.sync.set({ studentId: sid, password: pwd }, () => {
                overlay.remove();
                autoLogin(sid, pwd);
            });
        });

        // Allow Enter key to trigger save
        formContainer.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('vu-cred-save').click();
            }
        });
    }

    // ----- Button click handler -----
    autoLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Check if credentials are already stored
        chrome.storage.sync.get(['studentId', 'password'], (result) => {
            if (result.studentId && result.password) {
                autoLogin(result.studentId, result.password);
            } else {
                showCredentialForm();
            }
        });
    });
})();