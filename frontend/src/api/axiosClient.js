import axios from "axios";
import toast from "react-hot-toast";

/**
 * Axios client
 * - baseURL is read from environment variables
 * - works both locally and in production (Render)
 */
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // required for session cookies
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Global response interceptor
 * Handles expired / invalid sessions (401)
 */
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log("[API] 401 Unauthorized – session expired");

      try {
        // Dynamic import to avoid circular dependency
        const { default: useAuthStore } = await import(
          "../store/authStore"
        );

        // Clear frontend auth state
        useAuthStore.getState().clearAuth();

        // Notify user
        toast.error("Session expired. Please log in again.");

        /**
         * Fire-and-forget logout
         * (backend should delete session row if exists)
         */
        axiosClient.post("/logout").catch(() => {});
      } catch (e) {
        console.error("[API] Failed to handle 401 cleanup", e);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
