import { create } from 'zustand';

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // Initialize auth state by checking current session
  initializeAuth: async () => {
    try {
      const response = await fetch('http://localhost:3000/me', {
        credentials: 'include' // Include cookies in the request
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          set({
            user: result.data,
            isAuthenticated: true,
            isLoading: false
          });
        } else {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  },

  login: async (email, password) => {
    try {
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (result.success) {
        set({
          user: result.data,
          isAuthenticated: true
        });
        return { success: true };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  logout: async () => {
    try {
      await fetch('http://localhost:3000/logout', {
        method: 'POST',
        credentials: 'include' // Include cookies in the request
      });
    } catch (error) {
      console.error('Logout error:', error);
    }

    // Clear local state regardless of API call success
    set({
      user: null,
      isAuthenticated: false
    });
  },

  // Clear auth state without calling API (used by 401 interceptor)
  clearAuth: () => {
    set({
      user: null,
      isAuthenticated: false
    });
  }
}));

export default useAuthStore;
