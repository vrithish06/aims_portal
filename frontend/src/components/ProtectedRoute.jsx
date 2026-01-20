import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

/**
 * ProtectedRoute component: Ensures user is authenticated
 * Redirects to login if not authenticated
 * Also watches for auth state changes (e.g., from 401 interceptor)
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
