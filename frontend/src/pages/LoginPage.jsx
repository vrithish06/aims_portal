import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('User already authenticated, redirecting to home');
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Test backend connection on mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await axios.get('http://localhost:3000/test');
        if (response.data.success) {
          setBackendConnected(true);
          console.log('✓ Backend connected');
        }
      } catch (error) {
        console.error('Backend connection failed:', error);
        toast.error('Cannot connect to backend. Make sure it\'s running on http://localhost:3000');
        setBackendConnected(false);
      }
    };
    testConnection();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!backendConnected) {
      toast.error('Backend is not connected. Please start the backend server.');
      return;
    }

    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting login with email:', formData.email);
      
      const response = await axios.post('http://localhost:3000/login', {
        email: formData.email,
        password: formData.password
      });

      console.log('Login response received:', response.data);

      if (response.data.success && response.data.data) {
        console.log('✓ Login successful, storing user data');
        const userData = response.data.data;
        
        // Store user data
        login(userData);
        
        // Wait for state to be saved and then redirect
        toast.success('Login successful! Redirecting...');
        
        // Force redirect after a short delay to ensure state is saved
        setTimeout(() => {
          console.log('Navigating to home page');
          navigate('/', { replace: true });
        }, 300);
      } else {
        const errorMsg = response.data.message || 'Login failed';
        console.error('Login failed:', errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response?.status === 401) {
        toast.error('Invalid email or password');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message === 'Network Error') {
        toast.error('Backend connection failed');
      } else {
        toast.error(error.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-4">Login</h2>
          
          {!backendConnected && (
            <div className="alert alert-error mb-4">
              <span>⚠️ Backend not connected. Check server is running on port 3000</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-control w-full mb-4">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                className="input input-bordered w-full"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-control w-full mb-6">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                className="input input-bordered w-full"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading || !backendConnected}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          <div className="divider"></div>
          <p className="text-sm text-center">
            Test credentials: Check your database or admin
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
