// ui/pages/home.js
import { registerRoute } from "../core/router.js";

registerRoute("home", () => {
  const container = document.createElement('div');
    container.classList.add('container','app-container');
  container.innerHTML = `
    <div id="advertisment-container" class="card bg-transparent mb-3">
      <!--ads will show here-->
    </div>
    <div class="mb-3">
      <div id="action-buttons-cont">
        <!-- Action buttons will be added here -->
      </div>
    </div>
    <div class="mt-0">
      <p class="text-muted">
        Welcome to VU Empire Genie! Get started by entering your API key and configuring your settings.
      </p>
    </div>
  `;

  return container;
});