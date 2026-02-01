import { registerRoute } from "../core/router.js";

registerRoute("support", () => {
    const container = document.createElement('div');
    container.innerHTML = `
    <div class="fs-1 mb-3">Support</div>
    
    <div class="mb-3">
      <p class="text-muted">
        Need help? We're here to assist you with any questions or issues you may have.
      </p>
    </div>

    <div class="my-5">
      <div class="mb-3">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title fs-2">Documentation</h5>
            <p class="card-text text-muted">
              Comprehensive guides and tutorials to help you get the most out of VU Empire Genie.
            </p>
            <button class="btn btn-outline-primary" onclick="window.open('https://vulms.vu.edu.pk', '_blank')">
              View Documentation
            </button>
          </div>
        </div>
      </div>
      
      <div class="mb-3">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title fs-2">Community</h5>
            <p class="card-text text-muted">
              Join our community of VU students to share tips, ask questions, and get help.
            </p>
            <button class="btn btn-outline-info" onclick="window.open('https://vulms.vu.edu.pk', '_blank')">
              Join Community
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="my-5">
      <div class="mb-3">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title fs-2">Email Support</h5>
            <p class="card-text text-muted">
              Contact our support team directly for personalized assistance.
            </p>
            <button class="btn btn-outline-success" onclick="window.open('mailto:support@vuempire.com')">
              Send Email
            </button>
          </div>
        </div>
      </div>
      
      <div class="mb-3">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title fs-2">Emergency Help</h5>
            <p class="card-text text-muted">
              For urgent issues that need immediate attention.
            </p>
            <button class="btn btn-outline-danger" onclick="window.open('https://vulms.vu.edu.pk', '_blank')">
              Get Emergency Help
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="mb-5">
      <h4 class="fs-4">Common Issues</h4>
      <div class="accordion" id="supportAccordion">
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne">
              Extension not working
            </button>
          </h2>
          <div id="collapseOne" class="accordion-collapse collapse" data-bs-parent="#supportAccordion">
            <div class="accordion-body text-muted">
              Try refreshing the page, checking if the extension is enabled, or reinstalling the extension.
            </div>
          </div>
        </div>
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo">
              API key issues
            </button>
          </h2>
          <div id="collapseTwo" class="accordion-collapse collapse" data-bs-parent="#supportAccordion">
            <div class="accordion-body text-muted">
              Make sure you have a valid Google AI Studio API key and it's properly entered in the settings.
            </div>
          </div>
        </div>
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree">
              Performance issues
            </button>
          </h2>
          <div id="collapseThree" class="accordion-collapse collapse" data-bs-parent="#supportAccordion">
            <div class="accordion-body text-muted">
              Try disabling other extensions, clearing your browser cache, or restarting your browser.
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
    return container;
});