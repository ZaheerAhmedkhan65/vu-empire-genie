import { registerRoute } from "../core/router.js";

registerRoute("updates", () => {
    const container = document.createElement('div');
    container.innerHTML = `
    <div class="fs-1 mb-3">Updates</div>
    
    <div class="mb-3">
      <p class="text-muted">
        Stay up to date with the latest features, improvements, and bug fixes.
      </p>
    </div>

    <div class="card mb-3 bg-transparent border-0">
      <div class="card-header bg-primary text-white p-2 mb-4 rounded">
        <h5 class="mb-0">Latest Release: v1.2.0</h5>
        <small>January 2026</small>
      </div>
      <div class="card-body p-0">
        <h6 class="mb-3 fs-4">New Features</h6>
        <ul class="my-1 ms-5 text-muted mb-3">
          <li class="mb-2 ">Enhanced AI quiz assistance with better accuracy</li>
          <li class="mb-2 ">Improved lecture navigation and skipping</li>
          <li class="mb-2 ">New dark mode support</li>
          <li class="mb-2 ">Performance optimizations</li>
        </ul>
        <h6 class="mb-3 fs-4">Improvements</h6>
        <ul class="my-1 ms-5 text-muted mb-3">
          <li class="mb-2 ">Better error handling and user feedback</li>
          <li class="mb-2 ">Enhanced security measures</li>
          <li class="mb-2 ">Improved compatibility with latest browser versions</li>
        </ul>
        <h6 class="mb-3 fs-4">Bug Fixes</h6>
        <ul class="my-1 ms-5 text-muted">
          <li class="mb-2 ">Fixed issue with API key validation</li>
          <li class="mb-2 ">Resolved navigation timing issues</li>
          <li class="mb-2 ">Fixed sidebar overlay positioning</li>
        </ul>
      </div>
    </div>
  `;
    return container;
});