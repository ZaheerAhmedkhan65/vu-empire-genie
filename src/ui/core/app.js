// ui/core/app.js
import { initRouter, startRouter, registerPendingRoutes, registerRoute, navigate } from "./router.js";
import { initNavbar } from "../components/Navbar.js";
import Footer from "../components/Footer.js";

// Initialize router first
const router = initRouter("app-view");
initNavbar();

// --- Track current route ---
let currentRoute = 'home';  // default

// --- Helper to update active class on all nav buttons ---
const updateActiveClass = (route) => {
    // Use provided route, otherwise fall back to tracked currentRoute
    const targetRoute = route || currentRoute;
    console.log("Updating active class for route:", targetRoute);

    const navButtons = document.querySelectorAll('[data-route]');
    console.log("Found nav buttons:", navButtons);
    navButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.route === targetRoute) {
            btn.classList.add('active');
            console.log("Added active class to button:", btn);
        }
    });
};

// --- Override the router's navigate method to also update active class ---
const originalNavigate = router.navigate.bind(router);
router.navigate = (path, params = {}) => {
    currentRoute = path;                     // store the new route
    originalNavigate(path, params);          // perform the actual navigation
    updateActiveClass(path);                 // update active class immediately
};

// (Optional) If you need to export navigate for other modules, it's already exported from router.js

// --- Import pages and set up router ---
Promise.all([
    import("../pages/home.js"),
    import("../pages/profile.js"),
    import("../pages/faq.js"),
    import("../pages/privacy.js"),
    import("../pages/support.js"),
    import("../pages/feedback.js"),
    import("../pages/pricing.js"),
    import("../pages/updates.js"),
    import("../pages/terms.js"),
    import("../pages/about.js"),
    import("../pages/settings.js"),
    import("../pages/history.js")
]).then(() => {
    registerPendingRoutes();

    // Register 404 page
    registerRoute("not-found", () => {
        const container = document.createElement('div');
        container.innerHTML = `
            <div class="text-center">
                <h1 class="display-4">404 - Page Not Found</h1>
                <p class="lead">The page you are looking for does not exist.</p>
                <button id="go-home-btn" class="btn btn-primary mt-3">Go to Home</button>
            </div>
        `;
        container.querySelector("#go-home-btn").addEventListener("click", () => {
            navigate("home");   // uses the overridden navigate
        });
        return container;
    });

    // --- Footer injection via MutationObserver ---
    const appView = document.getElementById('app-view');
    const observer = new MutationObserver(() => {
        // Only act if footer is missing
        if (!document.getElementById('app-footer')) {
            const footer = Footer();
            appView.appendChild(footer);
            // Update active class now that footer buttons exist
            updateActiveClass();
        }
    });
    observer.observe(appView, { childList: true, subtree: false });

    // Also listen to hash changes (in case of manual URL changes)
    window.addEventListener('hashchange', () => {
        const hashRoute = location.hash.substring(1) || 'home';
        if (hashRoute !== currentRoute) {
            // If the hash changed externally, sync our tracker and update
            currentRoute = hashRoute;
            updateActiveClass();
        }
    });

    // Start the router with home page
    startRouter('home');
    // Ensure initial active class is set (redundant but safe)
    updateActiveClass('home');
}).catch(error => {
    console.error("Error loading pages:", error);
}); 