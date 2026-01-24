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
import LoginPage from "./LoginPage";

// Removed framer-motion container/item variants since we want no entrance animations

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
        color: "bg-violet-50/70 hover:bg-violet-100/60 hover:shadow-violet-200/40",
      },
    ];

    if (user?.role === "student") {
      actions.unshift({
        title: "My Enrolled Courses",
        desc: "View your current enrollments",
        icon: <BookOpen className="w-7 h-7 text-blue-600" />,
        onClick: () => navigate("/enrolled-courses"),
        color: "bg-blue-50/70 hover:bg-blue-100/60 hover:shadow-blue-200/40",
      });
    }

    if (user?.role === "instructor" || user?.role === "admin") {
      actions.unshift({
        title: user.role === "admin" ? "Manage Offerings" : "My Offerings",
        desc: "Organize and update your courses",
        icon: <LayoutDashboard className="w-7 h-7 text-indigo-600" />,
        onClick: () => navigate("/my-offerings"),
        color: "bg-indigo-50/70 hover:bg-indigo-100/60 hover:shadow-indigo-200/40",
      });
    }

    if (user?.role === "admin") {
      actions.push({
        title: "Academic Alerts",
        desc: "Publish announcements & notices",
        icon: <Megaphone className="w-7 h-7 text-amber-600" />,
        onClick: () => navigate("/admin-alerts"),
        color: "bg-amber-50/70 hover:bg-amber-100/60 hover:shadow-amber-200/40",
      });
    }

    return actions;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-10 lg:py-12">
        {/* HEADER - no animation */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-white px-6 py-3.5 rounded-xl shadow-sm border border-gray-200">
            <GraduationCap className="w-10 h-10 text-indigo-600" strokeWidth={1.7} />
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
                className="cursor-pointer group bg-white border border-amber-200 rounded-xl p-5 flex items-center gap-5 shadow-sm hover:shadow-md hover:border-amber-300 transition-all duration-200"
                onClick={() => navigate("/alerts")}
              >
                <div className="shrink-0 p-3 bg-amber-100 rounded-full transition-transform group-hover:scale-105">
                  <Bell className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-800">Latest Announcement</p>
                  <p className="text-gray-700 text-sm line-clamp-2 mt-0.5">
                    {latestAlert.content}
                  </p>
                </div>
                <span className="hidden sm:inline text-xs text-gray-500 whitespace-nowrap">
                  {new Date(latestAlert.created_at).toLocaleDateString()}
                </span>
              </div>
            )}

            {/* WELCOME CARD */}
            <div className="bg-white border border-gray-200 rounded-2xl p-7 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:shadow-md hover:border-gray-300 transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center shrink-0 transition-transform hover:scale-105">
                  <UserCircle className="w-8 h-8 text-indigo-600" strokeWidth={1.6} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Welcome back, {user.first_name}
                  </h2>
                  <p className="text-sm text-gray-600 mt-0.5">{user.email}</p>
                  <span className="inline-block mt-2 px-3 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full uppercase tracking-wide">
                    {user.role}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="px-5 py-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-medium transition-all duration-200 flex items-center gap-2 border border-red-200 hover:border-red-300 hover:shadow-sm"
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
                  className={`group bg-white border border-gray-200 rounded-xl p-6 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-gray-300 ${action.color}`}
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-105 ${action.color.split(" ")[0]}`}>
                    {action.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1.5 group-hover:text-indigo-700 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{action.desc}</p>
                  <div className="text-indigo-600 text-sm font-medium flex items-center gap-1.5 opacity-80 group-hover:opacity-100 group-hover:text-indigo-700 transition-all">
                    Open <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              ))}

              {/* HELP CARD */}
              <div
                onClick={handleHelp}
                className="group bg-white border border-gray-200 rounded-xl p-6 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-teal-300"
              >
                <div className="w-14 h-14 bg-teal-50 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-105">
                  {helpLoading ? (
                    <div className="loading loading-spinner loading-md text-teal-600"></div>
                  ) : (
                    <HelpCircle className="w-7 h-7 text-teal-600" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1.5 group-hover:text-teal-700 transition-colors">
                  Help & Support
                </h3>
                <p className="text-sm text-gray-600 mb-4">Guides, FAQs and assistance</p>
                <div className="text-teal-600 text-sm font-medium flex items-center gap-1.5 opacity-80 group-hover:opacity-100 group-hover:text-teal-700 transition-all">
                  View Help <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* NOT LOGGED IN */
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-200 flex flex-col lg:flex-row hover:shadow-lg transition-shadow duration-300">
              <div className="p-10 lg:p-12 lg:w-3/5">
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                  Manage your academic journey with ease
                </h2>
                <p className="mt-5 text-lg text-gray-600">
                  Access course materials, browse offerings, track enrollments — all in one modern portal.
                </p>
                <button
                  onClick={() => setShowLogin(true)}
                  className="mt-8 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2.5 text-base"
                >
                  Login to Portal
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>

              <div className="bg-gradient-to-br from-indigo-600 to-violet-600 lg:w-2/5 p-10 lg:p-12 text-white flex flex-col justify-center gap-6">
                <div className="flex items-center gap-3 text-lg font-medium">
                  <BookOpen className="w-6 h-6" /> Track your courses
                </div>
                <div className="flex items-center gap-3 text-lg font-medium">
                  <Search className="w-6 h-6" /> Explore catalog
                </div>
                <div className="flex items-center gap-3 text-lg font-medium">
                  <LayoutDashboard className="w-6 h-6" /> Manage academics
                </div>
              </div>
            </div>

            <p className="text-center text-gray-500 text-sm mt-8">
              Need assistance?{" "}
              <button onClick={handleHelp} className="text-indigo-600 hover:underline font-medium">
                Contact Support
              </button>
            </p>
          </div>
        )}
      </div>

      {/* LOGIN MODAL - kept simple fade + slight scale on open */}
      {showLogin && !isAuthenticated && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden scale-100 transition-transform duration-200">
            <button
              onClick={() => setShowLogin(false)}
              className="absolute top-5 right-5 p-2.5 bg-white/90 hover:bg-gray-100 rounded-full shadow-sm transition-colors z-10"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>

            <LoginPage insideModal />
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;