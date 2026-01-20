import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance with default config
const axiosClient = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true, // Include cookies/session by default
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Response interceptor: Handle 401 Unauthorized globally
 * When session expires or becomes invalid, clear frontend auth state and redirect to login
 */
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired or invalid - handle gracefully
      console.log('[API] 401 Unauthorized - Session expired');

      // Import here to avoid circular dependency
      import('../store/authStore').then(({ default: useAuthStore }) => {
        const clearAuth = useAuthStore.getState().clearAuth;
        
        // Clear frontend auth state
        clearAuth();
        
        // Show message to user
        toast.error('Session expired. Please log in again.');
        
        // Redirect to login (let useNavigate in component handle it, or use window.location)
        // Optionally call /logout endpoint for server-side cleanup (fire-and-forget)
        axios.post('/logout', {}, { withCredentials: true }).catch(() => {
          // Ignore logout errors
        });
      });
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
