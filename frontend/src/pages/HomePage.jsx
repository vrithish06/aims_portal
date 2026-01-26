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
  Megaphone,
  Bell,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion"; // ✅ FIXED
import LoginPage from "./LoginPage";
import bgImage from "../assets/image.png";

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
      },
    ];

    if (user?.role === "student") {
      actions.unshift({
        title: "My Enrolled Courses",
        desc: "View your current enrollments",
        icon: <BookOpen className="w-7 h-7 text-blue-600" />,
        onClick: () => navigate("/enrolled-courses"),
      });
    }

    if (user?.role === "instructor" || user?.role === "admin") {
      actions.unshift({
        title: user.role === "admin" ? "Manage Offerings" : "My Offerings",
        desc: "Organize and update your courses",
        icon: <LayoutDashboard className="w-7 h-7 text-indigo-600" />,
        onClick: () => navigate("/my-offerings"),
      });
    }

    if (user?.role === "instructor" && user?.is_advisor) {
      actions.push({
        title: "My Advisees",
        desc: "Manage your assigned students",
        icon: <Users className="w-7 h-7 text-green-600" />,
        onClick: () => navigate("/faculty-advisees"),
        color: "bg-green-50 hover:bg-green-100",
      });
    }

    if (user?.role === "admin") {
      actions.push({
        title: "Academic Alerts",
        desc: "Publish announcements & notices",
        icon: <Megaphone className="w-7 h-7 text-amber-600" />,
        onClick: () => navigate("/admin-alerts"),
      });
    }

    return actions;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-10 lg:py-12">
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
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg border-2 border-white">
                  <span className="font-bold text-2xl text-white">
                    {user?.first_name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Welcome back, {user.first_name}
                  </h2>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                      {user.role}
                    </span>
                    {user.is_advisor && (
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        Advisor
                      </span>
                    )}
                  </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {getDashboardActions().map((action, idx) => (
                <div
                  key={idx}
                  onClick={action.onClick}
                  className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-gray-50/50 group-hover:scale-110 transition-transform">
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
                className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-gray-50/50 rounded-xl flex items-center justify-center mb-5">
                  {helpLoading ? (
                    <div className="loading loading-spinner loading-md text-emerald-600"></div>
                  ) : (
                    <HelpCircle className="w-7 h-7 text-emerald-600" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1.5">
                  Help & Support
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Guides, FAQs and assistance
                </p>
                <div className="text-emerald-600 text-sm font-medium flex items-center gap-1.5 group">
                  View Help <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
