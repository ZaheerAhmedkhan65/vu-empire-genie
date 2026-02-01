import { navigate, registerRoute } from "../core/router.js";
import { authManager } from "../core/auth.js";

// Example of a protected route that requires authentication
registerRoute("dashboard", (params = {}) => {
    // Check if user is authenticated
    if (!authManager.isAuthenticated()) {
        // Redirect to signin with current path as redirect target
        return navigate('signin', { redirectTo: 'dashboard' });
    }

    const container = document.createElement('div');
    const user = authManager.getCurrentUser();
    
    container.innerHTML = `
    <div class="fs-1 mb-3">Dashboard</div>
    
    <div class="mb-3">
      <p class="text-muted">
         <strong>${user ? user.username : 'User'}</strong>!
      </p>
    </div>

    <div class="my-5">
      <div class="mb-3">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">Your Account</h5>
            <p class="card-text">
              Email: ${user ? user.email : 'Not available'}<br>
            </p>
          </div>
        </div>
      </div>
    </div>
  `;

    return container;
});