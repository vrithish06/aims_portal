import { LogOut, Menu, X } from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { useEffect, useState } from "react";

function Navbar() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    console.log("Navbar updated - Auth:", { isAuthenticated, user: user?.email });
  }, [isAuthenticated, user]);

  const handleLogout = async () => {
    await logout();
    // Navigation is handled in logout function via window.location.href
  };

  // ✅ Your normal active class
  const navClass = ({ isActive }) =>
    `text-gray-700 font-medium transition-colors text-sm lg:text-base hover:text-black
   ${isActive ? "text-black underline underline-offset-8 decoration-2" : ""}`;

  // ✅ My Work should be active when these routes are active
  const isMyWorkActive =
    location.pathname.startsWith("/my-offerings") ||
    location.pathname.startsWith("/my-pending-works");

  const myWorkClass = `text-gray-700 hover:text-black font-medium transition-colors text-sm lg:text-base
    ${isMyWorkActive ? "text-black underline underline-offset-8 decoration-2" : ""}`;

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="navbar px-2 sm:px-4 min-h-[4rem]">

        {/* LOGO */}
        <div className="flex-none">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <div className="flex items-center gap-2 sm:gap-3">
              <img
                src="/logo.png"
                alt="AIMS Logo"
                className="h-8 sm:h-10 w-8 sm:w-10 object-contain"
              />
              <span className="font-semibold font-mono tracking-widest text-lg sm:text-2xl text-black">
                AIMS
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        {isAuthenticated && (
          <div className="hidden md:flex gap-4 lg:gap-8 items-center ml-12">
            <NavLink to="/" className={navClass}>
              Dashboard
            </NavLink>

            {user?.role === "student" && (
              <>
                <NavLink to="/enrolled-courses" className={navClass}>
                  My Courses
                </NavLink>

                <NavLink to="/course-offerings" className={navClass}>
                  Course Offerings
                </NavLink>

                <NavLink to="/student-record" className={navClass}>
                  Student Record
                </NavLink>
              </>
            )}

            {user?.role === "instructor" && (
              <>
                {/* ✅ My Work Dropdown */}
                <div className="dropdown dropdown-hover">
                  <NavLink
                    to="/my-offerings" className={myWorkClass}>
                    My Work
                  </NavLink>

                  <ul className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                    <li>
                      <NavLink to="/my-offerings" className={navClass}>
                        My Offerings
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/my-pending-works" className={navClass}>
                        My Pending Works
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/myadvisees" className={navClass}>
                        My Advisees
                      </NavLink>
                    </li>
                  </ul>
                </div>

                <NavLink to="/course-offerings" className={navClass}>
                  Course Offerings
                </NavLink>

                <NavLink to="/add-offering" className={navClass}>
                  Offer a Course
                </NavLink>

              </>
            )}

            {user?.role === "admin" && (
              <>
                <NavLink to="/course-offerings" className={navClass}>
                  Course Offerings
                </NavLink>

                <NavLink to="/current-session-details" className={navClass}>
                  Session Details
                </NavLink>

                <NavLink to="/add-user" className={navClass}>
                  Add User
                </NavLink>

                <NavLink to="/admin-alerts" className={navClass}>
                  Add Announcement
                </NavLink>

                <NavLink to="/course-add" className={navClass}>
                  Add Course
                </NavLink>

                <NavLink to="/all-advisors" className={navClass}>
                  All Advisors
                </NavLink>
              </>
            )}

            <NavLink to="/alerts" className={navClass}>
              Announcements
            </NavLink>
          </div>
        )}

        {/* Spacer to push profile to right */}
        <div className="flex-1"></div>

        {/* Right side actions */}
        <div className="flex-none flex items-center gap-2 sm:gap-4 pl-2 sm:pl-4">
          {isAuthenticated && user ? (
            <>
              {/* User Info Display */}
              <div className="hidden lg:flex flex-col items-end leading-tight mr-1">
                <span className="text-sm font-bold text-gray-900">
                  {user?.first_name} {user?.last_name}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                    {user?.role}
                  </span>
                  {user?.is_advisor && (
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      Advisor
                    </span>
                  )}
                </div>
              </div>

              <button
                className="hidden md:flex btn btn-ghost btn-circle hover:bg-red-50 text-gray-500 hover:text-red-600"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>

              {/* Mobile Menu Toggle */}
              <button
                className="md:hidden btn btn-ghost btn-circle hover:bg-blue-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>

              {/* Profile Dropdown */}
              <div className="dropdown dropdown-end">
                <div
                  tabIndex={0}
                  className="btn btn-ghost btn-circle hover:bg-blue-100 transition-colors p-0"
                >
                  <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
                    <span className="font-bold text-sm sm:text-xl text-white text-center">
                      {user.first_name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* DROPDOWN */}
                <ul
                  tabIndex={0}
                  className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-48 sm:w-52"
                >
                  <li className="menu-title">
                    <span className="text-sm">
                      {user?.first_name} {user?.last_name}
                    </span>
                  </li>

                  <li className="menu-title">
                    <span className="text-xs text-gray-500 truncate w-44 block">
                      {user?.email}
                    </span>
                  </li>

                  <li>
                    <Link to="/">Home</Link>
                  </li>

                  {user?.role === "student" && (
                    <>
                      <li>
                        <Link to="/enrolled-courses">My Courses</Link>
                      </li>
                      <li>
                        <Link to="/course-offerings">Course Offerings</Link>
                      </li>
                      <li>
                        <Link to="/student-record">Student Record</Link>
                      </li>
                    </>
                  )}

                  {user?.role === "instructor" && (
                    <>
                      <li>
                        <Link to="/my-offerings">My Offerings</Link>
                      </li>
                      <li>
                        <Link to="/my-pending-works">My Pending Works</Link>
                      </li>
                      <li>
                        <Link to="/myadvisees">My Advisees</Link>
                      </li>
                      <li>
                        <Link to="/course-offerings">Course Offerings</Link>
                      </li>
                      <li>
                        <Link to="/add-offering">Offer a Course</Link>
                      </li>
                    </>
                  )}

                  {user?.role === "admin" && (
                    <>
                      <li>
                        <Link to="/course-offerings">Course Offerings</Link>
                      </li>
                      <li>
                        <Link to="/current-session-details">Session Details</Link>
                      </li>
                      <li>
                        <Link to="/add-user">Add User</Link>
                      </li>
                      <li>
                        <Link to="/admin-alerts">Add Announcement</Link>
                      </li>
                      <li>
                        <Link to="/course-add">Add Course</Link>
                      </li>
                      <li>
                        <Link to="/all-advisors">All Advisors</Link>
                      </li>
                    </>
                  )}

                  <li>
                    <Link to="/alerts">Announcements</Link>
                  </li>

                  <li>
                    <a onClick={handleLogout} className="text-error">
                      <LogOut className="size-4" />
                      Logout
                    </a>
                  </li>
                </ul>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Mobile Menu */}
      {isAuthenticated && mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 p-4 space-y-2">
          {/* Mobile User Profile Header */}
          <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-blue-50/50 rounded-xl border border-blue-100">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold shadow-sm">
              {user?.first_name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-gray-900 leading-none">
                {user?.first_name} {user?.last_name}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs font-extrabold text-blue-600 uppercase tracking-widest">
                  {user?.role}
                </span>
                {user?.is_advisor && (
                  <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 leading-none">
                    Advisor
                  </span>
                )}
              </div>
            </div>
          </div>

          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-gray-700 hover:text-black hover:bg-gray-100 font-medium px-4 py-2 rounded transition-colors"
          >
            Dashboard
          </Link>

          {user?.role === "student" && (
            <>
              <Link
                to="/enrolled-courses"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-black hover:bg-gray-100 font-medium px-4 py-2 rounded transition-colors"
              >
                My Courses
              </Link>

              <Link
                to="/course-offerings"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-black hover:bg-gray-100 font-medium px-4 py-2 rounded transition-colors"
              >
                Course Offerings
              </Link>

              <Link
                to="/student-record"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-black hover:bg-gray-100 font-medium px-4 py-2 rounded transition-colors"
              >
                Student Record
              </Link>
            </>
          )}

          {user?.role === "instructor" && (
            <>
              <Link
                to="/my-offerings"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-black hover:bg-gray-100 font-medium px-4 py-2 rounded transition-colors"
              >
                My Offerings
              </Link>

              <Link
                to="/my-pending-works"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-black hover:bg-gray-100 font-medium px-4 py-2 rounded transition-colors"
              >
                My Pending Works
              </Link>

              <Link
                to="/myadvisees"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-black hover:bg-gray-100 font-medium px-4 py-2 rounded transition-colors"
              >
                My Advisees
              </Link>

              <Link
                to="/course-offerings"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-black hover:bg-gray-100 font-medium px-4 py-2 rounded transition-colors"
              >
                Browse Courses
              </Link>

              <Link
                to="/add-offering"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-black hover:bg-gray-100 font-medium px-4 py-2 rounded transition-colors"
              >
                Offer a Course
              </Link>
            </>
          )}

          {user?.role === "admin" && (
            <>
              <Link
                to="/course-offerings"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-black hover:bg-gray-100 font-medium px-4 py-2 rounded transition-colors"
              >
                Browse Courses
              </Link>

              <Link
                to="/current-session-details"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-black hover:bg-gray-100 font-medium px-4 py-2 rounded transition-colors"
              >
                Session Details
              </Link>

              <Link
                to="/add-user"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-black hover:bg-gray-100 font-medium px-4 py-2 rounded transition-colors"
              >
                Add User
              </Link>

              <Link
                to="/admin-alerts"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-black hover:bg-gray-100 font-medium px-4 py-2 rounded transition-colors"
              >
                Add Announcement
              </Link>

              <Link
                to="/course-add"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-black hover:bg-gray-100 font-medium px-4 py-2 rounded transition-colors"
              >
                Add Course
              </Link>


              <Link
                to="/all-advisors"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-black hover:bg-gray-100 font-medium px-4 py-2 rounded transition-colors"
              >
                All Advisors
              </Link>
            </>
          )}

          <Link
            to="/alerts"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-gray-700 hover:text-black hover:bg-gray-100 font-medium px-4 py-2 rounded transition-colors"
          >
            Announcements
          </Link>

          <button
            onClick={handleLogout}
            className="w-full text-left text-red-600 hover:bg-red-50 font-medium px-4 py-2 rounded transition-colors"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default Navbar;
