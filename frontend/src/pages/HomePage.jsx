import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { BookOpen, LogOut, LogIn, Zap } from 'lucide-react'

function HomePage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const logout = useAuthStore((state) => state.logout)

  // Debug logging
  useEffect(() => {
    console.log('HomePage mounted/updated - Auth state:', {
      isAuthenticated,
      user: user ? `${user.first_name} ${user.last_name}` : null
    });
  }, [isAuthenticated, user]);

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            AIMS Portal
          </h1>
          <p className="text-xl text-gray-600">
            Academic Information Management System
          </p>
        </div>

        {/* User Info */}
        {isAuthenticated && user ? (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Welcome, {user.first_name} {user.last_name}!
                </h2>
                <p className="text-gray-600 mt-2">Email: {user.email}</p>
                <p className="text-gray-600">Role: <span className="badge badge-primary">{user.role}</span></p>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-error gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 mb-8">
            <p className="text-yellow-800">
              You are not logged in. Please click the Login button in the top navigation.
            </p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Login Card */}
          {!isAuthenticated ? (
            <div className="card bg-white shadow-lg hover:shadow-xl transition">
              <div className="card-body">
                <LogIn className="w-12 h-12 text-blue-600 mb-4" />
                <h2 className="card-title text-2xl mb-4">Login</h2>
                <p className="text-gray-600 mb-6">
                  Sign in with your credentials to access the portal
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="btn btn-primary gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Go to Login
                </button>
              </div>
            </div>
          ) : null}

          {/* Enrolled Courses Card */}
          {isAuthenticated && user ? (
            <div className="card bg-white shadow-lg hover:shadow-xl transition">
              <div className="card-body">
                <BookOpen className="w-12 h-12 text-green-600 mb-4" />
                <h2 className="card-title text-2xl mb-4">My Courses</h2>
                <p className="text-gray-600 mb-6">
                  View all your enrolled courses and grades
                </p>
                <button
                  onClick={() => navigate('/enrolled-courses')}
                  className="btn btn-success gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  View Enrolled Courses
                </button>
              </div>
            </div>
          ) : null}

          {/* Course Offerings Card */}
          {isAuthenticated && user ? (
            <div className="card bg-white shadow-lg hover:shadow-xl transition">
              <div className="card-body">
                <Zap className="w-12 h-12 text-yellow-600 mb-4" />
                <h2 className="card-title text-2xl mb-4">Available Courses</h2>
                <p className="text-gray-600 mb-6">
                  Browse and enroll in available course offerings
                </p>
                <button
                  onClick={() => navigate('/course-offerings')}
                  className="btn btn-warning gap-2"
                >
                  <Zap className="w-4 h-4" />
                  View Course Offerings
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Additional Info */}
        <div className="card bg-white shadow-lg">
          <div className="card-body">
            <h3 className="card-title mb-4">About AIMS Portal</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center gap-2">
                <span className="badge badge-primary">✓</span>
                Register and login to your account
              </li>
              <li className="flex items-center gap-2">
                <span className="badge badge-success">✓</span>
                View your enrolled courses
              </li>
              <li className="flex items-center gap-2">
                <span className="badge badge-warning">✓</span>
                Browse available course offerings
              </li>
              <li className="flex items-center gap-2">
                <span className="badge badge-info">✓</span>
                Enroll in new courses
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
