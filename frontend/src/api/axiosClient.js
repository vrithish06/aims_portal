import axios from "axios";
import toast from "react-hot-toast";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log("[API] 401 Unauthorized – clearing auth");

      try {
        const { default: useAuthStore } = await import(
          "../store/authStore"
        );

        // ✅ ONLY clear frontend state
        useAuthStore.getState().clearAuth();

        toast.error("Session expired. Please log in again.");
      } catch (e) {
        console.error("Auth cleanup failed", e);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
