// Authentication state management
export class AuthManager {
    constructor() {
        this.currentUser = null;
        this.listeners = [];

        // Check for existing session on initialization
        this.checkSession();
    }

    // Subscribe to auth state changes
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(listener => listener !== callback);
        };
    }

    // Notify all listeners of auth state change
    notifyListeners() {
        this.listeners.forEach(callback => callback(this.currentUser));
    }

    // Check for existing session
    checkSession() {
        try {
            const savedUser = localStorage.getItem('vu_empire_user');
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
                this.notifyListeners();
            }
        } catch (error) {
            console.error('Error checking session:', error);
        }
    }

    // Sign in user
    async signIn(email, password) {
        try {
            const response = await fetch('https://vu-empire-genie.vercel.app/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.status === 'success') {
                    // Extract user data from the response
                    const userData = {
                        id: result.data.id,
                        name: result.data.name,
                        email: result.data.email,
                        role: result.data.role,
                        avatar: result.data.avatar
                    };

                    this.currentUser = userData;
                    localStorage.setItem('vu_empire_user', JSON.stringify(userData));
                    this.notifyListeners();
                    return { success: true, user: userData, message: result.message };
                } else {
                    return { success: false, error: result.message || 'Invalid credentials' };
                }
            } else {
                const errorData = await response.json();
                return { success: false, error: errorData.message || 'Invalid credentials' };
            }
        } catch (error) {
            return { success: false, error: 'Network error. Please check your connection.' };
        }
    }

    // Sign up user
    async signUp(name, email, password) {
        try {
            const response = await fetch('https://vu-empire-genie.vercel.app/api/auth/create-account', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: name, email, password })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.status === 'success') {
                    // Extract user data from the response
                    const userData = {
                        id: result.data.id,
                        name: result.data.name,
                        email: result.data.email,
                        role: result.data.role,
                        avatar: result.data.avatar
                    };

                    this.currentUser = userData;
                    localStorage.setItem('vu_empire_user', JSON.stringify(userData));
                    this.notifyListeners();
                    return { success: true, user: userData, message: result.message };
                } else {
                    return { success: false, error: result.message || 'Registration failed' };
                }
            } else {
                const errorData = await response.json();
                return { success: false, error: errorData.message || 'Registration failed' };
            }
        } catch (error) {
            return { success: false, error: 'Network error. Please check your connection.' };
        }
    }

    // Sign out user
    async signOut() {
        try {
            const response = await fetch('https://vu-empire-genie.vercel.app/api/auth/logout');

            const result = await response.json();
            if (response.ok && result.status === 'success') {
                this.currentUser = null;
                localStorage.removeItem('vu_empire_user');
                this.notifyListeners();
                return { success: true, message: result.message };
            } else {
                return { success: false, error: result.message || 'Logout failed' };
            }
        } catch (error) {
            return { success: false, error: 'Network error. Please check your connection.' };
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }
}

// Global auth instance
export const authManager = new AuthManager();