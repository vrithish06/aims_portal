import axios from "axios";
import toast from "react-hot-toast";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Track failed requests to prevent retry loops
let isRefreshingAuth = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  isRefreshingAuth = false;
  failedQueue = [];
}

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshingAuth) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => axiosClient(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshingAuth = true;

      try {
        // Try to re-authenticate by calling /me
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/me`, {
          withCredentials: true,
        });

        if (response.data?.success) {
          processQueue(null, response.data.data);
          // Retry original request
          return axiosClient(originalRequest);
        } else {
          throw new Error("Re-authentication failed");
        }
      } catch (reAuthError) {
        console.log("[API] Session expired or re-authentication failed – clearing auth");
        
        try {
          const { default: useAuthStore } = await import("../store/authStore");
          useAuthStore.getState().clearAuth();
          toast.error("Session expired. Please log in again.");
        } catch (e) {
          console.error("Auth cleanup failed", e);
        }
        
        processQueue(reAuthError, null);
        return Promise.reject(reAuthError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
