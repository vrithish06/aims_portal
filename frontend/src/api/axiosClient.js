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
  (response) => {
    console.log(`[AXIOS] ✅ ${response.config.method.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    console.log(`[AXIOS] ❌ ${originalRequest.method.toUpperCase()} ${originalRequest.url} - Status: ${error.response?.status}`);

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log(`[AXIOS] 401 Unauthorized - Attempting re-authentication`);
      
      if (isRefreshingAuth) {
        console.log(`[AXIOS] Already refreshing auth, queuing request`);
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => axiosClient(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshingAuth = true;

      try {
        console.log(`[AXIOS] Calling /me to re-authenticate`);
        // Try to re-authenticate by calling /me
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/me`, {
          withCredentials: true,
        });

        console.log(`[AXIOS] /me response:`, response.data);
        
        if (response.data?.success) {
          console.log(`[AXIOS] ✅ Re-authentication successful, retrying original request`);
          processQueue(null, response.data.data);
          // Retry original request
          return axiosClient(originalRequest);
        } else {
          console.log(`[AXIOS] ❌ /me endpoint returned success:false`);
          throw new Error("Re-authentication failed");
        }
      } catch (reAuthError) {
        console.log("[AXIOS] ❌ Session expired or re-authentication failed – clearing auth");
        console.log("[AXIOS] Error:", reAuthError.message);
        
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
