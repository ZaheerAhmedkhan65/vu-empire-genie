// ui/pages/home.js
import { registerRoute } from "../core/router.js";

registerRoute("profile", () => {
  const container = document.createElement('div');
  container.classList.add('container','app-container');
  container.innerHTML = `
    <div class="d-flex align-center">
      <img alt="Student Profile" class="student-profile-image rounded-circle" width="45" height="45">
      <div class="d-flex flex-column align-start ms-2">
        <h2 class="mb-0">
          <span id="student-name" class="fs-3"></span>
        </h2>
        <div class="tagline text-muted">
          <span id="student-id" class="fs-3"></span>
        </div>
      </div>
    </div>
  `;

  return container;
});