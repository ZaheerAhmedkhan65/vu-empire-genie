import { registerRoute } from "../core/router.js";

registerRoute("about", () => {
    const container = document.createElement('div');
    container.innerHTML = `
    <div class="fs-1 mb-3">About VU Empire Genie</div>
    
    <div class="mb-3">
      <p class="text-muted">
        VU Empire Genie is your ultimate AI-powered study assistant designed specifically for Virtual University students.
      </p>
    </div>

    <div class="mb-3">
      <h4 class="fs-4 mb-2">Our Mission</h4>
      <p class="text-muted">
        To empower VU students with cutting-edge AI technology that makes learning more efficient, 
        accessible, and effective. We believe every student deserves personalized support on their academic journey.
      </p>
    </div>

    <div class="mb-3">
      <h4 class="fs-4 mb-2">What We Offer</h4>
      <ul class="my-2 ms-5 text-muted">
        <li class="mb-2">
          <strong>AI-Powered Assistance:</strong> Get instant help with lectures, quizzes, and assignments
        </li>
        <li class="mb-2">
          <strong>Time-Saving Automation:</strong> Skip tedious tasks and focus on what matters most
        </li>
        <li class="mb-2">
          <strong>Personalized Learning:</strong> Tailored solutions for your specific academic needs
        </li>
        <li class="mb-2">
          <strong>Privacy First:</strong> Your data stays secure and private
        </li>
      </ul>
    </div>

    <div class="mb-3">
      <h4 class="fs-4 mb-2">Built for VU Students, by VU Students</h4>
      <p class="text-muted">
        Our team understands the unique challenges of Virtual University education. 
        We've designed VU Empire Genie to address the specific needs of online learners.
      </p>
    </div>
  `;
    return container;
});