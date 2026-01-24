import { create } from "zustand";
import axiosClient from "../api/axiosClient";

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // Initialize auth state by checking current session
  initializeAuth: async () => {
    try {
      const response = await axiosClient.get("/me");

      if (response.data?.success) {
        set({
          user: response.data.data,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return false;
      }
    } catch (error) {
      console.error("Error initializing auth:", error);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return false;
    }
  },

  // Login user
  login: async (email, password) => {
    try {
      const response = await axiosClient.post("/login", {
        email,
        password,
      });

      if (response.data?.success) {
        set({
          user: response.data.data,
          isAuthenticated: true,
        });
        return { success: true };
      }

      return {
        success: false,
        message: response.data?.message || "Login failed",
      };
    } catch (error) {
      console.error("Login error:", error);

      if (!error.response) {
        return { success: false, message: "Backend not reachable" };
      }

      return {
        success: false,
        message: error.response?.data?.message || "Invalid credentials",
      };
    }
  },

  // Logout user
  logout: async () => {
    try {
      // Try to logout on server, but don't fail if session is already expired
      await axiosClient.post("/logout").catch((error) => {
        // If logout fails (e.g., session already expired), that's okay
        console.log("Logout API call failed (may be expected):", error?.message);
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clear local state regardless of API success
      set({
        user: null,
        isAuthenticated: false,
      });
      // Force navigation to home page
      window.location.href = '/';
    }
  },

  // Clear auth state without API call (used by axios 401 interceptor)
  clearAuth: () => {
    set({
      user: null,
      isAuthenticated: false,
    });
  },

  // Set user directly (for testing/manual override)
  setUser: (user) => {
    if (user) {
      set({
        user,
        isAuthenticated: true,
      });
    } else {
      set({
        user: null,
        isAuthenticated: false,
      });
    }
  },
}));

export default useAuthStore;
