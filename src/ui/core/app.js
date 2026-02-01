import { initRouter, startRouter, registerPendingRoutes, registerRoute, navigate } from "./router.js";
import { initSidebar } from "../components/Sidebar.js";
import { authManager } from "./auth.js";

// Initialize router first
const router = initRouter("app-view");

// Initialize sidebar
initSidebar();

// Set up authentication state listener to update UI
authManager.subscribe((user) => {
    // Update UI elements based on authentication state
    updateAuthUI(user);
});

function updateAuthUI(user) {
    // Update any auth-related UI elements
    const authButtons = document.querySelectorAll('[data-auth-action]');
    authButtons.forEach(button => {
        if (user) {
            button.textContent = 'Sign Out';
            button.dataset.route = 'signout';
        } else {
            button.textContent = 'Sign In';
            button.dataset.route = 'signin';
        }
    });
}

// Import pages after router is initialized and wait for them to complete
Promise.all([
    import("../pages/home.js"),
    import("../pages/faq.js"),
    import("../pages/privacy.js"),
    import("../pages/support.js"),
    import("../pages/feedback.js"),
    import("../pages/pricing.js"),
    import("../pages/updates.js"),
    import("../pages/terms.js"),
    import("../pages/about.js"),
    import("../pages/signin.js"),
    import("../pages/signup.js"),
    import("../pages/dashboard.js")
]).then(() => {
    // Register any pending routes and start with home page
    registerPendingRoutes();
    
    // Register special routes
    registerRoute("signout", () => {
        const container = document.createElement('div');
        container.innerHTML = `
            <div class="fs-1 mb-3">Signing Out...</div>
            <div class="text-muted">You will be redirected to the home page shortly.</div>
        `;
        
        // Sign out and redirect
        setTimeout(() => {
            authManager.signOut();
            navigate('home');
        }, 1000);
        
        return container;
    });
    
    // Start with home page
    startRouter('home');
}).catch(error => {
    console.error("Error loading pages:", error);
});
