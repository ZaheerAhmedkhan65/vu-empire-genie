import { startRouter, navigate } from "../core/router.js";
import { authManager } from "../core/auth.js";
import { appView } from "../../views/js/appView.js";

// Update Navbar content based on authentication state
function updateNavbarContent(user) {
    const navAuthSection = document.querySelector('#nav-auth-section');

    // Clear existing auth-related items (keep navigation items)
    const existingAuthItems = document.querySelectorAll('.auth-item');
    existingAuthItems.forEach(item => item.remove());

    // Create auth section
    const authSection = document.createElement('div');
    authSection.className = 'auth-section';

    if (user) {
        // User is signed in - show avatar and logout
        authSection.innerHTML = `
            <div class="auth-item d-flex align-items-center mb-3 px-3">
                <div class="avatar-container me-3">
                    ${user.avatar ?
                `<img src="${user.avatar}" alt="Avatar" style="object-fit: cover;" width="40px" height="40px" class="avatar rounded-circle">`
                : `<strong>${user.name[0].toUpperCase()}</strong>`
            }
                </div>
                <div class="user-info flex-grow-1">
                    <div class="fw-bold">${user.name || user.email}</div>
                </div>
            </div>
            <div class="auth-item px-3">
                <button class="btn btn-outline-primary w-100 auth-item" data-route="dashboard">
                    Dashboard
                </button>
            </div>
            <div class="auth-item px-3 mt-2">
                <button class="btn btn-danger w-100 auth-item" id="navbar-signout-btn" onclick="return confirm('Are you sure to logout?')">
                    Sign Out
                </button>
            </div>
        `;

        // Add logout event listener
        const signoutBtn = authSection.querySelector('#navbar-signout-btn');
        if (signoutBtn) {
            signoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                lm.show(appView, 'bars');
                const result = await authManager.signOut();
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
            <button class="btn btn-primary auth-item" data-route="signin">
                Sign In
            </button>
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
        }
    });
}

export function initNavbar() {
    // Set up initial sidebar content
    updateNavbarContent(authManager.getCurrentUser());

    // Listen for authentication state changes
    authManager.subscribe((user) => {
        updateNavbarContent(user);
    });

    // Set up event delegation for navigation links
    document.querySelectorAll("[data-route]").forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            console.log(`Navigating to ${link.dataset.route}`);
            navigate(link.dataset.route);
        });
    });
}
