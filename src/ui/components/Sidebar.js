import { startRouter, navigate } from "../core/router.js";
import { authManager } from "../core/auth.js";
import { appView } from "../../views/js/appView.js";

const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("sidebarOverlay");
const menuIcon = document.querySelector(".menu-icon");
const closeBtn = document.getElementById("closeSidebar");

// Open
menuIcon?.addEventListener("click", () => {
    sidebar.classList.add("open");
    overlay.classList.remove("hidden");
});

// Close
function closeSidebar() {
    sidebar.classList.remove("open");
    overlay.classList.add("hidden");
}

closeBtn?.addEventListener("click", closeSidebar);
overlay?.addEventListener("click", closeSidebar);

// Update sidebar content based on authentication state
function updateSidebarContent(user) {
    const navbar = sidebar.querySelector('.sidebar-nav');
    const navAuthSection = sidebar.querySelector('#nav-auth-section');
    if (!navbar) return;

    // Clear existing auth-related items (keep navigation items)
    const existingAuthItems = navbar.querySelectorAll('.auth-item');
    existingAuthItems.forEach(item => item.remove());

    // Create auth section
    const authSection = document.createElement('div');
    authSection.className = 'auth-section mt-3';
    
    if (user) {
        // User is signed in - show avatar and logout
        authSection.innerHTML = `
            <div class="auth-item d-flex align-items-center mb-3 px-3">
                <div class="avatar-container me-3">
                    ${user.avatar ? 
                        `<img src="${user.avatar}" alt="Avatar" style="object-fit: cover;" width="40px" height="40px" class="avatar rounded-circle">` 
                        :`<strong>${user.username[0].toUpperCase()}</strong>`
                    }
                </div>
                <div class="user-info flex-grow-1">
                    <div class="fw-bold">${user.username || user.email}</div>
                </div>
            </div>
            <div class="auth-item px-3">
                <button class="btn btn-outline-primary w-100 auth-item" data-route="dashboard">
                    Dashboard
                </button>
            </div>
            <div class="auth-item px-3 mt-2">
                <button class="btn btn-danger w-100 auth-item" id="sidebar-signout-btn" onclick="return confirm('Are you sure to logout?')">
                    Sign Out
                </button>
            </div>
        `;
        
        // Add logout event listener
        const signoutBtn = authSection.querySelector('#sidebar-signout-btn');
        if (signoutBtn) {
            signoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                lm.show(appView, 'bars');
                const result = await authManager.signOut();
                closeSidebar();
                if (result.success) {
                    // Use setTimeout to allow current navigation to complete
                    setTimeout(() => {
                        alerts.show('success', result.message, { bounce: true });
                        navigate('home');
                    }, 100);
                } else {
                    alerts.show('warning', result.message, { bounce: true });
                }
                lm.hide(appView, 'bars');
            });
        }
    } else {
        // User is not signed in - show signup and signin buttons
        authSection.innerHTML = `
            <div class="d-flex align-center gap-2">
                <div class="auth-item px-1">
                    <button class="btn btn-primary w-100 auth-item" data-route="signup">
                        Create Account
                    </button>
                </div>
                <div class="auth-item px-1">
                    <button class="btn btn-outline-light w-100 auth-item" data-route="signin">
                        Sign In
                    </button>
                </div>
            </div>
        `;
    }

    // Insert auth section at the end of navbar (before footer if it exists)
    navAuthSection.appendChild(authSection);

    // Set up event delegation for auth buttons
    setupAuthEventDelegation(authSection);
}

function setupAuthEventDelegation(container) {
    container.addEventListener('click', (e) => {
        const link = e.target.closest('[data-route]');
        if (link) {
            e.preventDefault();
            const route = link.dataset.route;
            console.log(`Auth navigation to ${route}`);
            navigate(route);
            closeSidebar();
        }
    });
}

export function initSidebar() {
    // Set up initial sidebar content
    updateSidebarContent(authManager.getCurrentUser());

    // Listen for authentication state changes
    authManager.subscribe((user) => {
        updateSidebarContent(user);
    });

    // Set up event delegation for navigation links
    document.querySelectorAll("[data-route]").forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            console.log(`Navigating to ${link.dataset.route}`);
            navigate(link.dataset.route);
            closeSidebar();
        });
    });
}
