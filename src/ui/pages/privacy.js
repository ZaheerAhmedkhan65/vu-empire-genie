import { registerRoute } from "../core/router.js";

registerRoute("privacy", () => {
  const container = document.createElement('div');
  container.classList.add('container','app-container');
    container.innerHTML = `
    <div class="fs-1 mb-2">Privacy</div>
    <div class="mb-3">
      <p class="text-muted">
        Your privacy is our top priority. We are committed to protecting your personal information and ensuring that your data is handled with the utmost care and security.
      </p>
    </div>

    <div class="mb-3">
      <h4 class="fs-4 mb-2">Data Collection</h4>
      <p class="text-muted">
        We only collect data that is necessary for providing our services, such as quiz history and user preferences. We do not collect any personally identifiable information without your explicit consent.
      </p>
    </div>

    <div class="mb-3">
      <h4 class="fs-4 mb-2">Data Usage</h4>
      <p class="text-muted">
        The data we collect is used solely to enhance your experience with VU Empire Genie, such as providing personalized quiz assistance and improving our services. We do not sell or share your data with third parties.
      </p>
    </div>

    <div class="mb-3">
      <h4 class="fs-4 mb-2">Data Security</h4>
      <p class="text-muted">
        We implement robust security measures to protect your data from unauthorized access, disclosure, alteration, and destruction. Your data is stored securely and encrypted where applicable.
      </p>
    </div>

    <div class="mt-0">
      <h4 class="fs-4 mb-2">Your Rights</h4>
      <p class="text-muted">
        You have the right to access, correct, or delete your personal data at any time. If you have any questions or concerns about your privacy, please contact our support team.
      </p>
    </div>
  `;
    return container;
});
