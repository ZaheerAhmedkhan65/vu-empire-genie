// core/router.js
export class Router {
    constructor({ outlet }) {
        this.outlet = document.getElementById(outlet);
        this.routes = {};
        this.protectedRoutes = new Set();
        this.authRequiredRoutes = new Set();
        
        // Set up global event delegation for data-route links
        this.setupGlobalEventDelegation();
    }

    register(path, component, options = {}) {
        this.routes[path] = component;
        
        // Mark route as protected if specified
        if (options.protected) {
            this.protectedRoutes.add(path);
        }
        
        // Mark route as requiring auth if specified
        if (options.authRequired) {
            this.authRequiredRoutes.add(path);
        }
    }

    navigate(path, params = {}) {
        // Check if route requires authentication
        if (this.authRequiredRoutes.has(path)) {
            // Import auth manager dynamically to avoid circular imports
            import('./auth.js').then(({ authManager }) => {
                if (!authManager.isAuthenticated()) {
                    this.navigate('signin', { redirectTo: path });
                    return;
                }
                this.performNavigation(path, params);
            }).catch(error => {
                console.error('Error checking authentication:', error);
                this.navigate('signin', { redirectTo: path });
            });
        } else {
            this.performNavigation(path, params);
        }
    }

    performNavigation(path, params = {}) {
        const Screen = this.routes[path];
        if (!Screen) throw new Error(`Route ${path} not found`);

        this.outlet.innerHTML = "";
        const screenElement = Screen(params);
        this.outlet.appendChild(screenElement);
        
        // Set up event delegation for this specific screen
        this.setupScreenEventDelegation(screenElement);
    }

    setupGlobalEventDelegation() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[data-route]');
            if (link) {
                e.preventDefault();
                const route = link.dataset.route;
                this.navigate(route);
            }
        });
    }

    setupScreenEventDelegation(screenElement) {
        // Set up event delegation for dynamically created elements
        screenElement.addEventListener('click', (e) => {
            const link = e.target.closest('[data-route]');
            if (link) {
                e.preventDefault();
                const route = link.dataset.route;
                this.navigate(route);
            }
        });
    }
}

// Global router instance
let routerInstance = null;

export function initRouter(outlet) {
    routerInstance = new Router({ outlet });
    return routerInstance;
}

// Helper function to create protected routes
export function createProtectedRoute(component, authCheck = null) {
    return (params) => {
        // Import auth manager dynamically to avoid circular imports
        return import('./auth.js').then(({ authManager }) => {
            if (!authManager.isAuthenticated()) {
                // Redirect to signin with current path as redirect target
                const currentPath = window.location.hash.replace('#/', '') || 'home';
                navigate('signin', { redirectTo: currentPath });
                return document.createElement('div'); // Return empty element
            }
            return component(params);
        }).catch(error => {
            console.error('Error checking authentication:', error);
            navigate('signin');
            return document.createElement('div'); // Return empty element
        });
    };
}

export function startRouter(defaultRoute) {
    if (routerInstance) {
        routerInstance.navigate(defaultRoute);
    }
}

export function navigate(path, params = {}) {
    if (routerInstance) {
        routerInstance.navigate(path, params);
    }
}

// Page registration function
export function registerRoute(path, component, options = {}) {
    if (routerInstance) {
        routerInstance.register(path, component, options);
    } else {
        // Store for later registration when router is initialized
        if (!window.__pendingRoutes) {
            window.__pendingRoutes = [];
        }
        window.__pendingRoutes.push({ path, component, options });
    }
}

// Register pending routes after router initialization
export function registerPendingRoutes() {
    if (window.__pendingRoutes && routerInstance) {
        window.__pendingRoutes.forEach(({
            path,
            component,
            options
        }) => {
            routerInstance.register(path, component, options);
        });
        delete window.__pendingRoutes;
    }
}
