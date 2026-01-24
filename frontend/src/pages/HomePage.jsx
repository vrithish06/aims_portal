import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import axiosClient from "../api/axiosClient";
import toast from "react-hot-toast";
import {
  LogOut,
  HelpCircle,
  X,
  BookOpen,
  Search,
  GraduationCap,
  LayoutDashboard,
  ArrowRight,
  UserCircle,
  Megaphone,
  Bell,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion"; // ✅ FIXED
import LoginPage from "./LoginPage";

function HomePage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const [helpLoading, setHelpLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [latestAlert, setLatestAlert] = useState(null);

  // Fetch latest alert
  useEffect(() => {
    const fetchAlert = async () => {
      try {
        const response = await axiosClient.get("/alerts");
        const alerts = response.data?.data;
        if (alerts?.length > 0) {
          setLatestAlert(alerts[0]);
        }
      } catch (error) {
        console.error("Error fetching alert:", error);
      }
    };
    fetchAlert();
  }, []);

  useEffect(() => {
    if (isAuthenticated) setShowLogin(false);
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
  };

  const handleHelp = async () => {
    try {
      setHelpLoading(true);
      const response = await axiosClient.get("/help");
      const helpLink = response?.data?.helpLink;

      if (!helpLink || typeof helpLink !== "string" || !helpLink.startsWith("http")) {
        toast.error("Help link not available");
        return;
      }
      window.open(helpLink, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Help API error:", error);
      toast.error("Failed to open help");
    } finally {
      setHelpLoading(false);
    }
  };

  const getDashboardActions = () => {
    const actions = [
      {
        title: "Browse Offerings",
        desc: "Explore all available courses",
        icon: <Search className="w-7 h-7 text-violet-600" />,
        onClick: () => navigate("/course-offerings"),
        color: "bg-violet-50 hover:bg-violet-100",
      },
    ];

    if (user?.role === "student") {
      actions.unshift({
        title: "My Enrolled Courses",
        desc: "View your current enrollments",
        icon: <BookOpen className="w-7 h-7 text-blue-600" />,
        onClick: () => navigate("/enrolled-courses"),
        color: "bg-blue-50 hover:bg-blue-100",
      });
    }

    if (user?.role === "instructor" || user?.role === "admin") {
      actions.unshift({
        title: user.role === "admin" ? "Manage Offerings" : "My Offerings",
        desc: "Organize and update your courses",
        icon: <LayoutDashboard className="w-7 h-7 text-indigo-600" />,
        onClick: () => navigate("/my-offerings"),
        color: "bg-indigo-50 hover:bg-indigo-100",
      });
    }

    if (user?.role === "admin") {
      actions.push({
        title: "Academic Alerts",
        desc: "Publish announcements & notices",
        icon: <Megaphone className="w-7 h-7 text-amber-600" />,
        onClick: () => navigate("/admin-alerts"),
        color: "bg-amber-50 hover:bg-amber-100",
      });
    }

    return actions;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-10 lg:py-12">

        {/* HEADER */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-white px-6 py-3.5 rounded-xl shadow-sm border border-gray-200">
            <GraduationCap className="w-10 h-10 text-indigo-600" />
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              AIMS Portal
            </h1>
          </div>
          <p className="mt-4 text-lg text-gray-600 font-medium">
            Academic Information Management System
          </p>
        </div>

        {isAuthenticated && user ? (
          <div className="space-y-10">

            {/* ALERT BAR */}
            {latestAlert && (
              <div
                className="cursor-pointer bg-white border border-amber-200 rounded-xl p-5 flex items-center gap-5 shadow-sm hover:shadow-md transition"
                onClick={() => navigate("/alerts")}
              >
                <div className="p-3 bg-amber-100 rounded-full">
                  <Bell className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800">
                    Latest Announcement
                  </p>
                  <p className="text-gray-700 text-sm line-clamp-2">
                    {latestAlert.content}
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(latestAlert.created_at).toLocaleDateString()}
                </span>
              </div>
            )}

            {/* WELCOME CARD */}
            <div className="bg-white border border-gray-200 rounded-2xl p-7 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center">
                  <UserCircle className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Welcome back, {user.first_name}
                  </h2>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <span className="inline-block mt-2 px-3 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full uppercase">
                    {user.role}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="px-5 py-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-medium flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>

            {/* DASHBOARD GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {getDashboardActions().map((action, idx) => (
                <div
                  key={idx}
                  onClick={action.onClick}
                  className={`bg-white border border-gray-200 rounded-xl p-6 shadow-sm cursor-pointer hover:shadow-lg hover:-translate-y-1 transition ${action.color}`}
                >
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 bg-white">
                    {action.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1.5">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {action.desc}
                  </p>
                  <div className="text-indigo-600 text-sm font-medium flex items-center gap-1.5">
                    Open <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              ))}

              {/* HELP CARD */}
              <div
                onClick={handleHelp}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm cursor-pointer hover:shadow-lg hover:-translate-y-1 transition"
              >
                <div className="w-14 h-14 bg-teal-50 rounded-xl flex items-center justify-center mb-5">
                  {helpLoading ? (
                    <div className="loading loading-spinner loading-md text-teal-600"></div>
                  ) : (
                    <HelpCircle className="w-7 h-7 text-teal-600" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1.5">
                  Help & Support
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Guides, FAQs and assistance
                </p>
                <div className="text-teal-600 text-sm font-medium flex items-center gap-1.5">
                  View Help <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Manage your academic journey with ease
            </h2>
            <p className="mt-4 text-gray-600">
              Access courses, browse offerings, and manage enrollments in one place.
            </p>
            <div className="mt-8 w-full flex justify-center">
              <button
                onClick={() => setShowLogin(true)}
                className="px-10 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2 transition-transform hover:scale-105"
              >
                Login to Portal
                <ArrowRight className="w-5 h-5" />
              </button>
           </div>

          </div>
        )}
      </div>

      {/* LOGIN MODAL */}
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
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <button
                onClick={() => setShowLogin(false)}
                className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white rounded-full"
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
