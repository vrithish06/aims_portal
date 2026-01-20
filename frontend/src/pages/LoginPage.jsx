import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
        const response = await fetch('http://localhost:3000/test');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setBackendConnected(true);
            console.log('✓ Backend connected');
          }
        } else {
          setBackendConnected(false);
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
      
      const result = await login(formData.email, formData.password);

      if (result.success) {
        console.log('✓ Login successful');
        toast.success('Login successful! Redirecting...');
        
        // Redirect after successful login
        setTimeout(() => {
          console.log('Navigating to home page');
          navigate('/', { replace: true });
        }, 300);
      } else {
        const errorMsg = result.message || 'Login failed';
        console.error('Login failed:', errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An unexpected error occurred');
    }  finally {
      setLoading(false);
    }
  };

    return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl">
        {/* Left Side - Logo and Branding (Centered) */}
        <div className="w-1/2 flex flex-col items-center justify-center bg-white text-black p-16 relative">
          {/* Logo Image */}
          <img 
            src="/logo.png" 
            alt="AIMS Logo" 
            className="w-40 h-40 mb-8 object-contain"
          />
          <h1 className="text-4xl font-bold mb-6 text-black text-center">AIMS</h1>
          <p className="text-lg font-light text-gray-700 text-center">
            Use your college mail id to signin
          </p>
          <p className="text-base font-light text-gray-600 mt-2 text-center">
            ending with @iitrpr.ac.in
          </p>
          
          {/* Vertical Divider Line */}
          <div className="absolute right-0 top-10 bottom-10 w-0.5 bg-gradient-to-b from-blue-200 to-blue-400"></div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-1/2 bg-white text-black p-16 flex flex-col justify-center">
          {!backendConnected && (
            <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded mb-6">
              <span>⚠️ Backend not connected. Check server is running on port 3000</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <input
                type="email"
                name="email"
                placeholder="Enter email"
                className="w-full bg-transparent border-b border-gray-400 text-black text-lg py-3 focus:outline-none focus:border-blue-600 placeholder-gray-500"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="mb-8">
              <input
                type="password"
                name="password"
                placeholder="Enter password"
                className="w-full bg-transparent border-b border-gray-400 text-black text-lg py-3 focus:outline-none focus:border-blue-600 placeholder-gray-500"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-full transition-colors"
              disabled={loading || !backendConnected}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-xs mr-2"></span>
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
