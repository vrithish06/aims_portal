import { LogOut, LogIn } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { useEffect } from "react";

function Navbar() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Navbar updated - Auth:", {
      isAuthenticated,
      user: user?.email,
    });
  }, [isAuthenticated, user]);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="navbar px-4 min-h-[4rem] justify-between">

        {/* LOGO */}
        <div className="flex-1">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="AIMS Logo"
                className="h-10 w-10 object-contain"
              />
              <span className="font-semibold font-mono tracking-widest text-2xl text-black">
                AIMS
              </span>
            </div>
          </Link>
        </div>

        {/* NAV LINKS */}
        {isAuthenticated && (
          <div className="flex gap-8 items-center pr-12">
            <Link className="text-gray-700 hover:text-black font-medium" to="/">
              Dashboard
            </Link>

            {user?.role === "student" && (
              <>
                <Link
                  to="/enrolled-courses"
                  className="text-gray-700 hover:text-black font-medium"
                >
                  My Courses
                </Link>

                <Link
                  to="/course-offerings"
                  className="text-gray-700 hover:text-black font-medium"
                >
                  Browse Courses
                </Link>

                <Link
                  to="/student-record"
                  className="text-gray-700 hover:text-black font-medium"
                >
                  Student Record
                </Link>
              </>
            )}
          </div>
        )}

        {/* RIGHT SIDE */}
        <div className="flex-none gap-3">
          {isAuthenticated && user ? (
            <div className="dropdown dropdown-end">

              {/* AVATAR */}
              <div
                tabIndex={0}
                className="btn btn-ghost btn-circle hover:bg-blue-100 transition-colors p-0"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
                  <span className="font-bold text-xl text-white text-center">
                    {user.first_name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* DROPDOWN */}
              <ul
                tabIndex={0}
                className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-56"
              >
                <li className="menu-title">
                  <span>
                    {user?.first_name} {user?.last_name}
                  </span>
                </li>

                <li className="menu-title">
                  <span className="text-xs text-gray-500">
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
                      <Link to="/course-offerings">Available Courses</Link>
                    </li>
                    <li>
                      <Link to="/student-record">Student Record</Link>
                    </li>
                  </>
                )}

                <li>
                  <a onClick={handleLogout} className="text-error">
                    <LogOut className="size-4" />
                    Logout
                  </a>
                </li>
              </ul>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm gap-2">
              <LogIn className="size-4" />
              Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default Navbar;
