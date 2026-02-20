import { registerRoute } from "../core/router.js";

registerRoute("pricing", () => {
    const container = document.createElement('div');
    container.classList.add('container','app-container');
    container.innerHTML = `
    <div class="fs-1 mb-3">Pricing</div>
    
    <div class="mb-3">
      <p class="text-muted">
        Choose the perfect plan for your VU Empire Genie needs. All plans include our core features.
      </p>
    </div>

    <div class="d-flex justify-content-center gap-2 my-5">
      <div class="col-md-6 mb-3 pricing-card free py-3 text-dark">
        <div class="card h-100 bg-transparent border-0">
          <div class="card-body text-center">
            <h2 class="card-title fs-2">Student</h2>
            <div class="mb-3">
              <span class="fs-2 fw-bold">Free</span>
              <small class="text-muted">/ forever</small>
            </div>
            <ul class="mb-4 text-muted">
              <li class="mb-2 fs-5 list-style-none"> <img class="me-1" src="../../assets/svg/check.svg"> Basic quiz assistance</li>
              <li class="mb-2 fs-5 list-style-none"> <img class="me-1" src="../../assets/svg/check.svg"> Lecture navigation</li>
              <li class="mb-2 fs-5 list-style-none"> <img class="me-1" src="../../assets/svg/check.svg"> GDB support</li>
              <li class="mb-2 fs-5 list-style-none"> <img class="me-1" src="../../assets/svg/check.svg"> Advanced AI features</li>
              <li class="mb-2 fs-5 list-style-none"> <img class="me-1" src="../../assets/svg/check.svg"> Priority support</li>
              <li class="mb-2 fs-5 list-style-none"> <img class="me-1" src="../../assets/svg/check.svg"> Custom settings</li>
            </ul>
            <button class="btn btn-outline-primary pricing-btn">Get Started</button>
          </div>
        </div>
      </div>
      
      <div class="col-md-6 mb-3 pricing-card pro py-3 position-relative text-dark">
        <div class="card h-100 border-0 bg-transparent">
          <div class="card-body text-center">
            <h2 class="card-title fs-2">Pro</h2>
            <div class="mb-3">
              <span class="fs-2 fw-bold">$4.99</span>
              <small class="text-muted">/ month</small>
            </div>
            <ul class="mb-4 text-muted">
              <li class="mb-2 fs-5 list-style-none"> <img class="me-1" src="../../assets/svg/check.svg"> Everything in Student</li>
              <li class="mb-2 fs-5 list-style-none"> <img class="me-1" src="../../assets/svg/check.svg"> Advanced AI features</li>
              <li class="mb-2 fs-5 list-style-none"> <img class="me-1" src="../../assets/svg/check.svg"> Custom settings</li>
              <li class="mb-2 fs-5 list-style-none"> <img class="me-1" src="../../assets/svg/check.svg"> Priority support</li>
              <li class="mb-2 fs-5 list-style-none"> <img class="me-1" src="../../assets/svg/check.svg"> Ad-free experience</li>
              <li class="mb-2 fs-5 list-style-none"> <img class="me-1" src="../../assets/svg/check.svg"> Team collaboration</li>
            </ul>
            <button class="btn btn-primary pricing-btn">Upgrade Now</button>
          </div>
        </div>
      </div>
    </div>

    <div class="card bg-transparent border-0">
      <div class="card-body p-0">
        <h5 class="card-title fs-3">Security & Privacy</h5>
        <p class="text-muted mt-1 fs-5">
          Your data is safe with us. We never sell your information and use industry-standard 
          encryption to protect your privacy. All payment processing is handled securely 
          through trusted third-party providers.
        </p>
      </div>
    </div>
  `;
    return container;
});