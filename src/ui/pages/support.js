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
      <div class="my-3">
        <div class="card h-100 bg-transparent border-0">
          <div class="card-body p-0">
            <h5 class="card-title fs-2">Documentation</h5>
            <p class="card-text text-muted">
              Comprehensive guides and tutorials to help you get the most out of VU Empire Genie.
            </p>
            <a class="btn btn-outline-primary" href="https://vu-empire-genie.vercel.app/docs" target="_blank">
              View Documentation
            </a>
          </div>
        </div>
      </div>
      
      <div class="my-3">
        <div class="card h-100 bg-transparent border-0">
          <div class="card-body p-0">
            <h5 class="card-title fs-2">Community</h5>
            <p class="card-text text-muted">
              Join our whatsapp community of VU Empire Genie users to share tips, ask questions, and get help.
            </p>
            <a class="btn btn-outline-info" href="https://chat.whatsapp.com/LOM1LuF7zrYEPEYeUR6hqL" target="_blank">
              Join Community
            </a>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-2">
      <h5 class="fs-2 mb-2">Common Issues</h5>
      <div class="accordion border-0 rounded-0" id="supportAccordion">
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button class="accordion-button collapsed bg-transparent" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne">
              Extension not working
            </button>
          </h2>
          <div id="collapseOne" class="accordion-collapse collapse" data-bs-parent="#supportAccordion">
            <div class="accordion-body text-muted bg-transparent">
              Try refreshing the page, checking if the extension is enabled, or reinstalling the extension.
            </div>
          </div>
        </div>
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button class="accordion-button collapsed bg-transparent" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo">
              API key issues
            </button>
          </h2>
          <div id="collapseTwo" class="accordion-collapse collapse" data-bs-parent="#supportAccordion">
            <div class="accordion-body text-muted bg-transparent">
              Make sure you have a valid Google AI Studio API key and it's properly entered in the settings.
            </div>
          </div>
        </div>
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button class="accordion-button collapsed bg-transparent" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree">
              Performance issues
            </button>
          </h2>
          <div id="collapseThree" class="accordion-collapse collapse" data-bs-parent="#supportAccordion">
            <div class="accordion-body text-muted bg-transparent">
              Try disabling other extensions, clearing your browser cache, or restarting your browser.
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
    return container;
});