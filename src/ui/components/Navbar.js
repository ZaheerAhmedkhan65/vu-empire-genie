//ui/components/Navbar.js
import { startRouter, navigate } from "../core/router.js";
import { appView } from "../../views/js/appView.js";

// Update Navbar content based on authentication state
function updateNavbarContent(user) {
    const currentPlan = document.getElementById("current-plan-section");
    currentPlan.innerHTML = `
    <span class="badge badge-primary fs-4 p-1">
        ${user.subscriptionPlan || "Free"}
    </span>`   
}

export function initNavbar() {
    // Set up initial sidebar content
    updateNavbarContent({
        "subscriptionPlan": "Free"
    });

    // Set up event delegation for navigation links
    document.querySelectorAll("[data-route]").forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            navigate(link.dataset.route);
        });
    });
}

startRouter(appView);