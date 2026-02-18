// ui/core/app.js
import { initRouter, startRouter, registerPendingRoutes, registerRoute, navigate } from "./router.js";
import { initNavbar } from "../components/Navbar.js";

// Initialize router first
const router = initRouter("app-view");
initNavbar();

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
    import("../pages/settings.js"),
    import("../pages/history.js")
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

        return container;
    });

    // Start with home page
    startRouter('home');
}).catch(error => {
    console.error("Error loading pages:", error);
});
