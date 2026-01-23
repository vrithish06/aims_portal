import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import axiosClient from '../api/axiosClient';
import toast from 'react-hot-toast';
import { 
  LogOut, 
  HelpCircle, 
  X, 
  BookOpen, 
  Search, 
  GraduationCap, 
  LayoutDashboard,
  ArrowRight,
  UserCircle
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import LoginPage from './LoginPage';

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 50 }
  }
};

function HomePage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const [helpLoading, setHelpLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setShowLogin(false);
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  const handleHelp = async () => {
    try {
      setHelpLoading(true);
      const response = await axiosClient.get('/help');
      const helpLink = response?.data?.helpLink;

      if (!helpLink || typeof helpLink !== 'string' || !helpLink.startsWith('http')) {
        toast.error('Help link not available');
        return;
      }
      window.open(helpLink, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.log('Help API error:', error);
      toast.error('Failed to open help');
    } finally {
      setHelpLoading(false);
    }
  };

  // --- Dynamic Dashboard Actions based on Role ---
  const getDashboardActions = () => {
    const actions = [
      {
        title: 'Browse Offerings',
        desc: 'View all available courses',
        icon: <Search className="w-6 h-6 text-purple-600" />,
        onClick: () => navigate('/course-offerings'),
        color: 'bg-purple-50 hover:bg-purple-100',
      }
    ];

    if (user?.role === 'student') {
      actions.unshift({
        title: 'My Enrolled Courses',
        desc: 'View your active enrollments',
        icon: <BookOpen className="w-6 h-6 text-blue-600" />,
        onClick: () => navigate('/enrolled-courses'),
        color: 'bg-blue-50 hover:bg-blue-100',
      });
    } else if (user?.role === 'instructor' || user?.role === 'admin') {
      actions.unshift({
        title: user.role === 'admin' ? 'Manage Offerings' : 'My Offerings',
        desc: 'Manage your course offerings',
        icon: <LayoutDashboard className="w-6 h-6 text-indigo-600" />,
        onClick: () => navigate('/my-offerings'),
        color: 'bg-indigo-50 hover:bg-indigo-100',
      });
    }

    return actions;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden">
      {/* Background Decor Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-24 w-72 h-72 bg-purple-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-sm mb-6">
            <GraduationCap className="w-10 h-10 text-blue-600 mr-3" />
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">
              AIMS Portal
            </h1>
          </div>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto font-light">
            Academic Information Management System
          </p>
        </motion.div>

        {/* Main Content Area */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full"
        >
          {isAuthenticated && user ? (
            /* --- LOGGED IN VIEW --- */
            <div className="grid gap-8">
              {/* Welcome Card */}
              <motion.div variants={itemVariants} className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                <div className="p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                      <UserCircle className="w-10 h-10" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-800">
                        Welcome back, {user.first_name}!
                      </h2>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 uppercase tracking-wide border border-gray-200">
                          {user.role}
                        </span>
                        <span className="text-gray-500 text-sm">{user.email}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleLogout} 
                    className="px-6 py-3 rounded-xl bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition-colors flex items-center gap-2 group"
                  >
                    <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    Logout
                  </button>
                </div>
              </motion.div>

              {/* Dashboard Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Dynamic Role Actions */}
                {getDashboardActions().map((action, idx) => (
                  <motion.div
                    key={idx}
                    variants={itemVariants}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 cursor-pointer group"
                    onClick={action.onClick}
                  >
                    <div className={`w-14 h-14 rounded-xl ${action.color} flex items-center justify-center mb-4 transition-colors`}>
                      {action.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-gray-500 text-sm mb-4">{action.desc}</p>
                    <div className="flex items-center text-blue-600 font-semibold text-sm">
                      Open <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>
                ))}

                {/* Help Card */}
                <motion.div
                  variants={itemVariants}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 cursor-pointer group"
                  onClick={handleHelp}
                >
                  <div className="w-14 h-14 rounded-xl bg-teal-50 hover:bg-teal-100 flex items-center justify-center mb-4 transition-colors">
                    {helpLoading ? (
                      <div className="loading loading-spinner loading-sm text-teal-600"></div>
                    ) : (
                      <HelpCircle className="w-6 h-6 text-teal-600" />
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-teal-600 transition-colors">
                    Need Help?
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">Access guides and support</p>
                  <div className="flex items-center text-teal-600 font-semibold text-sm">
                    View Docs <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>

              </div>
            </div>
          ) : (
            /* --- LOGGED OUT VIEW --- */
            <div className="max-w-4xl mx-auto">
              {/* Hero Banner */}
              <motion.div 
                variants={itemVariants}
                className="bg-white rounded-3xl shadow-xl overflow-hidden mb-12 flex flex-col md:flex-row"
              >
                <div className="p-10 md:w-3/5 flex flex-col justify-center">
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">
                    Manage your academic journey effortlessly.
                  </h2>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    Access your courses, view offerings, and manage enrollments all in one place. Please login to continue to your dashboard.
                  </p>
                  <button
                    onClick={() => setShowLogin(true)}
                    className="w-fit px-8 py-4 rounded-xl bg-blue-600 text-white font-bold text-lg shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-105 transition-all duration-200 flex items-center gap-2"
                  >
                    Login to Portal
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
                <div className="bg-blue-600 md:w-2/5 p-10 flex items-center justify-center bg-pattern">
                  <div className="text-white/90 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg"><BookOpen className="w-5 h-5" /></div>
                      <span className="font-medium">Track Courses</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg"><Search className="w-5 h-5" /></div>
                      <span className="font-medium">Browse Catalog</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg"><LayoutDashboard className="w-5 h-5" /></div>
                      <span className="font-medium">Manage Academics</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Bottom Info */}
              <motion.div variants={itemVariants} className="text-center text-gray-400 text-sm">
                Need assistance? <button onClick={handleHelp} className="text-blue-600 hover:underline">Contact Support</button>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>

      {/* --- ANIMATED LOGIN MODAL --- */}
      <AnimatePresence>
        {showLogin && !isAuthenticated && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <button
                onClick={() => setShowLogin(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white rounded-full shadow-sm transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
              
              <LoginPage insideModal />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default HomePage;