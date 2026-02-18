// theme.js
document.querySelectorAll(".alert-close").forEach(btn => {
    btn.addEventListener("click", function () {
        this.closest(".alert").classList.add("hide");
        setTimeout(() => this.closest(".alert").remove(), 300);
    });
});

function openModal(id) {
    document.getElementById(id).classList.add("show");
    document.body.insertAdjacentHTML("beforeend", '<div class="modal-backdrop"></div>');
}

function closeModal(id) {
    document.getElementById(id).classList.remove("show");
    document.querySelector(".modal-backdrop")?.remove();
}

// Replace the accordion block in theme.js with:
document.addEventListener("click", function (e) {
    const button = e.target.closest(".accordion-button");
    if (!button) return;

    const accordionItem = button.closest(".accordion-item");
    if (!accordionItem) return;

    const accordion = button.closest(".accordion");
    const body = accordionItem.querySelector(".accordion-body");

    // Close all other bodies in this accordion
    accordion.querySelectorAll(".accordion-body").forEach(b => {
        if (b !== body) b.classList.remove("show");
    });

    // Toggle current body
    body.classList.toggle("show");
});

document.querySelectorAll(".dropdown-toggle").forEach(btn => {
    btn.addEventListener("click", function () {
        const menu = this.nextElementSibling;
        menu.classList.toggle("show");
    });
});