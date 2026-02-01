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

// Navigation
document.querySelectorAll(".sidebar-nav a").forEach(link => {
    link.addEventListener("click", () => {
        const page = link.dataset.page;
        chrome.tabs.create({
            url: chrome.runtime.getURL(`views/${page}`)
        });
        closeSidebar();
    });
});
