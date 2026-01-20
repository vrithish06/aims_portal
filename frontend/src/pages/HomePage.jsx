import React, { useEffect, useState } from 'react'
import useAuthStore from '../store/authStore'
import axiosClient from '../api/axiosClient'
import toast from 'react-hot-toast'
import { LogOut, HelpCircle, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import LoginPage from './LoginPage'

function HomePage() {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const logout = useAuthStore((state) => state.logout)

  const [helpLoading, setHelpLoading] = useState(false)
  const [showLogin, setShowLogin] = useState(false)

  useEffect(() => {
    console.log('HomePage mounted/updated - Auth state:', {
      isAuthenticated,
      user: user ? `${user.first_name} ${user.last_name}` : null
    })
  }, [isAuthenticated, user])

  useEffect(() => {
    if (isAuthenticated) {
      setShowLogin(false) // ✅ auto close modal after login success
    }
  }, [isAuthenticated])

  const handleLogout = () => {
    logout()
  }

  const handleHelp = async () => {
    try {
      setHelpLoading(true)

      const response = await axiosClient.get('/help')
      const helpLink = response?.data?.helpLink

      if (!helpLink || typeof helpLink !== 'string' || !helpLink.startsWith('http')) {
        toast.error('Help link not found / invalid')
        return
      }

      window.open(helpLink, '_blank', 'noopener,noreferrer')
    } catch (error) {
      console.log('Help API error:', error)

      if (error?.response?.status === 401) {
        toast.error('Unauthorized. Please login again.')
        return
      }

      toast.error('Failed to open help')
    } finally {
      setHelpLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 relative">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">AIMS Portal</h1>
          <p className="text-xl text-gray-600">Academic Information Management System</p>
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
                <p className="text-gray-600">
                  Role: <span className="badge badge-primary">{user.role}</span>
                </p>
              </div>

              <button onClick={handleLogout} className="btn btn-error gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 mb-8 flex items-center justify-between gap-4">
            <p className="text-yellow-800">
              You are not logged in. Please click the Login button in the top navigation.
            </p>

            {/* ✅ Login button */}
            <button
              onClick={() => setShowLogin(true)}
              className="px-6 py-2 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
            >
              Login
            </button>
          </div>
        )}

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

              {/* ✅ Help */}
              <li className="flex items-center gap-2">
                <span className="badge badge-neutral">
                  <HelpCircle className="w-3 h-3" />
                </span>

                <button
                  onClick={handleHelp}
                  disabled={helpLoading}
                  className="underline text-blue-600 hover:text-blue-800 disabled:opacity-60"
                >
                  {helpLoading ? 'Opening Help...' : 'Help'}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ✅ Animated Login Container Overlay */}
      <AnimatePresence>
        {showLogin && !isAuthenticated && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-5xl"
              initial={{ y: 40, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              {/* Close */}
              <button
                onClick={() => setShowLogin(false)}
                className="absolute -top-3 -right-3 bg-white rounded-full shadow p-2 hover:scale-105 transition"
              >
                <X className="w-5 h-5" />
              </button>

              {/* ✅ Login container inside Home */}
              <div className="rounded-2xl overflow-hidden shadow-2xl bg-white">
                <LoginPage insideModal />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default HomePage
