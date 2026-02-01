import { registerRoute } from "../core/router.js";

registerRoute("faq", () => {
    const container = document.createElement('div');
    container.innerHTML = `
    <div class="fs-1 mb-3">Frequently Asked Questions</div>
    
    <div class="mb-3">
      <p class="text-muted">
        Find answers to common questions about VU Empire Genie and how it can help you with your studies.
      </p>
    </div>

    <div class="accordion" id="faqAccordion">
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne">
            🤖 What is VU Empire Genie?
          </button>
        </h2>
        <div id="collapseOne" class="accordion-collapse collapse show" data-bs-parent="#faqAccordion">
          <div class="accordion-body">
            <strong>VU Empire Genie</strong> is an AI-powered browser extension designed specifically for Virtual University students. 
            It helps automate tedious tasks, provides intelligent assistance with quizzes and assignments, and enhances your overall 
            learning experience on the VU LMS platform.
          </div>
        </div>
      </div>
      
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo">
            🔒 Is my data safe with VU Empire Genie?
          </button>
        </h2>
        <div id="collapseTwo" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
          <div class="accordion-body">
            <strong>Absolutely!</strong> We take your privacy and security very seriously. VU Empire Genie:
            <ul class="mt-2">
              <li>Never stores your personal information</li>
              <li>Uses encrypted connections for all API communications</li>
              <li>Only accesses data necessary for the extension's functionality</li>
              <li>Complies with all relevant data protection regulations</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree">
            🚀 How do I get started?
          </button>
        </h2>
        <div id="collapseThree" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
          <div class="accordion-body">
            Getting started is easy:
            <ol>
              <li>Install the VU Empire Genie extension from your browser's extension store</li>
              <li>Get a free API key from <a href="https://makersuite.google.com/app/apikey" target="_blank">Google AI Studio</a></li>
              <li>Open the extension popup and enter your API key in Settings</li>
              <li>Enable the features you want to use</li>
              <li>Start using it on the VU LMS platform!</li>
            </ol>
          </div>
        </div>
      </div>
      
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseFour">
            💰 Is VU Empire Genie free?
          </button>
        </h2>
        <div id="collapseFour" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
          <div class="accordion-body">
            <strong>Yes, we offer a free version!</strong> Our free Student plan includes:
            <ul class="mt-2">
              <li>Basic quiz assistance</li>
              <li>Lecture navigation</li>
              <li>GDB support</li>
            </ul>
            We also offer Pro and Premium plans with advanced features for power users who need more functionality.
          </div>
        </div>
      </div>
      
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseFive">
            ⚙️ How do I configure the settings?
          </button>
        </h2>
        <div id="collapseFive" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
          <div class="accordion-body">
            To configure settings:
            <ol>
              <li>Click on the VU Empire Genie icon in your browser toolbar</li>
              <li>Enter your Google AI Studio API key</li>
              <li>Toggle the features you want to enable/disable</li>
              <li>Click "Save Settings" to apply your changes</li>
            </ol>
            Your settings are automatically saved and will persist across browser sessions.
          </div>
        </div>
      </div>
      
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseSix">
            🐛 What if I encounter a bug?
          </button>
        </h2>
        <div id="collapseSix" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
          <div class="accordion-body">
            If you encounter a bug:
            <ul class="mt-2">
              <li>Try refreshing the page first</li>
              <li>Check if the extension is enabled</li>
              <li>Verify your API key is valid</li>
              <li>Clear your browser cache if issues persist</li>
              <li>Contact our support team through the Feedback page</li>
            </ul>
            We're constantly working to improve the extension and fix any issues quickly.
          </div>
        </div>
      </div>
      
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseSeven">
            📱 Does it work on mobile devices?
          </button>
        </h2>
        <div id="collapseSeven" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
          <div class="accordion-body">
            Currently, VU Empire Genie is designed for desktop browsers. However, we're actively working on a mobile version 
            that will be available soon. Stay tuned for updates in the Updates section!
          </div>
        </div>
      </div>
      
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseEight">
            🔄 How often is the extension updated?
          </button>
        </h2>
        <div id="collapseEight" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
          <div class="accordion-body">
            We regularly update VU Empire Genie to:
            <ul class="mt-2">
              <li>Fix bugs and improve stability</li>
              <li>Add new features based on user feedback</li>
              <li>Ensure compatibility with VU LMS updates</li>
              <li>Enhance AI capabilities and accuracy</li>
            </ul>
            Updates are automatically installed when available. You can check the Updates page for release notes.
          </div>
        </div>
      </div>
    </div>

    <div class="card mt-4">
      <div class="card-body">
        <h5 class="card-title">💡 Still Have Questions?</h5>
        <p class="card-text text-muted">
          If you couldn't find an answer to your question here, don't worry! Our support team is here to help.
        </p>
        <div class="d-flex gap-2">
          <button class="btn btn-primary" onclick="window.open('https://vulms.vu.edu.pk', '_blank')">Visit VU LMS</button>
          <button class="btn btn-outline-info" data-route="support">Contact Support</button>
          <button class="btn btn-outline-success" data-route="feedback">Send Feedback</button>
        </div>
      </div>
    </div>
  `;
    return container;
});