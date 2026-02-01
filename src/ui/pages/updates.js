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

    <div class="card mb-3">
      <div class="card-header bg-primary text-white p-2 mb-4 rounded">
        <h5 class="mb-0">Latest Release: v1.2.0</h5>
        <small>January 2026</small>
      </div>
      <div class="card-body">
        <h6 class="mb-3 fs-4">New Features</h6>
        <ul class="list-unstyled text-muted mb-3">
          <li class="mb-2 list-style-none">Enhanced AI quiz assistance with better accuracy</li>
          <li class="mb-2 list-style-none">Improved lecture navigation and skipping</li>
          <li class="mb-2 list-style-none">New dark mode support</li>
          <li class="mb-2 list-style-none">Performance optimizations</li>
        </ul>
        <h6 class="mb-3 fs-4">Improvements</h6>
        <ul class="list-unstyled text-muted mb-3">
          <li class="mb-2 list-style-none">Better error handling and user feedback</li>
          <li class="mb-2 list-style-none">Enhanced security measures</li>
          <li class="mb-2 list-style-none">Improved compatibility with latest browser versions</li>
        </ul>
        <h6 class="fs-4">Bug Fixes</h6>
        <ul class="list-unstyled text-muted">
          <li class="mb-2 list-style-none">Fixed issue with API key validation</li>
          <li class="mb-2 list-style-none">Resolved navigation timing issues</li>
          <li class="mb-2 list-style-none">Fixed sidebar overlay positioning</li>
        </ul>
      </div>
    </div>

    <div class="my-3">
      <div class="col-md-6 mb-3">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title fs-3 mb-2">Announcements</h5>
            <div class="alert alert-info mb-3">
              <strong>Mobile App Coming Soon!</strong>
              <p class="mb-0 mt-2 text-muted">We're working on a mobile version of VU Empire Genie. Stay tuned for updates!</p>
            </div>
            <div class="alert alert-success">
              <strong>Community Forum Live</strong>
              <p class="mb-0 mt-2 text-muted">Join our new community forum to connect with other VU students.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-md-6 mb-3">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title fs-3">Coming Soon</h5>
            <ul class="list-unstyled text-muted">
              <li class="mb-2 list-style-none">Advanced analytics dashboard</li>
              <li class="mb-2 list-style-none">Team collaboration features</li>
              <li class="mb-2 list-style-none">Mobile app support</li>
              <li class="mb-2 list-style-none">Multi-language support</li>
              <li class="mb-2 list-style-none">⚡ Offline mode capabilities</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-3">
      <div class="card-body">
        <h5 class="card-title fs-3">Usage Statistics</h5>
        <div class="d-flex mt-2 mb-5 text-center">
          <div class="col-md-3">
            <div class="card border-0">
              <div class="card-body">
                <h4 class="text-primary">10K+</h4>
                <p class="text-muted">Active Users</p>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-0">
              <div class="card-body">
                <h4 class="text-success">50K+</h4>
                <p class="text-muted">Quizzes Solved</p>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-0">
              <div class="card-body">
                <h4 class="text-info">100%</h4>
                <p class="text-muted">Student Satisfaction</p>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-0">
              <div class="card-body">
                <h4 class="text-warning">24/7</h4>
                <p class="text-muted">Support Available</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
    return container;
});