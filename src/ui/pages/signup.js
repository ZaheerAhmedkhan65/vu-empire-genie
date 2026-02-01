import { registerRoute, navigate } from "../core/router.js";
import { authManager } from "../core/auth.js";
import { appView } from "../../views/js/appView.js";

registerRoute("signup", () => {
    const container = document.createElement('div');
    container.innerHTML = `
    <div class="fs-1 mb-3">Sign Up</div>
    
    <div class="mb-3">
      <p class="text-muted">
        Sign up to create your VU Empire Genie account.
      </p>
    </div>

    <div class="my-5">
      <div class="mb-3">
        <div class="card h-100">
          <div class="card-body">
            <form id="signup-form">
                <div class="mb-3">
                  <label for="name" class="form-label">Name</label>
                  <input type="text" class="form-control" id="name" placeholder="Please enter your name" required>
                </div>
                <div class="mb-3">
                  <label for="email" class="form-label">Email</label>
                  <input type="email" class="form-control" id="email" aria-describedby="emailHelp" placeholder="Please enter your email" required>
                  <div id="emailHelp" class="form-text text-muted fs-5">We'll never share your email with anyone.</div>
                </div>
                <div class="mb-3">
                  <label for="password" class="form-label">Password</label>
                  <input type="password" class="form-control" id="password" placeholder="Create a strong password" required>
                </div>
                <div class="text-center">
                    <button class="btn btn-primary" type="submit">
                      Sign Up
                    </button>
                </div>
            </form>
            <div class="mt-5 mb-2">
              <p class="text-muted">
                Already have an account? 
                <button class="btn px-1 text-primary text-decoration-none border-0 bg-transparent outline-0" data-route="signin">Sign In</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

    // Set up form submission handler
    const form = container.querySelector('#signup-form');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        

        lm.show(appView, 'bars');

        const name = container.querySelector('#name').value;
        const email = container.querySelector('#email').value;
        const password = container.querySelector('#password').value;
        
        // Basic validation
        if (!name || !email || !password) {
            alerts.show('warning', 'Please fill in all fields', { bounce: true });
            return;
        }

        try {
            const result = await authManager.signUp(name, email, password);

            lm.hide(appView);
            
            if (result.success) {
                // Redirect to home page after successful signup using router navigation
                setTimeout(() => {
                    alerts.show('success', result.message, { bounce: true });
                    navigate('home');
                }, 100);
            } else {
                alerts.show('warning', result.message, { bounce: true });
            }
        } catch (error) {
            alerts.show('error', error.message, { bounce: true });
        }
    });

    return container;
});
