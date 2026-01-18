import { ShoppingCartIcon, LogOut, LogIn } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { useEffect } from "react";

function Navbar() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Navbar updated - Auth:', { isAuthenticated, user: user?.email });
  }, [isAuthenticated, user]);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="bg-base-100/80 backdrop-blur-lg border-b border-base-content/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto">
        <div className="navbar px-4 min-h-[4rem] justify-between">
          {/* LOGO */}
          <div className="flex-1 lg:flex-none">
            <Link to="/" className="hover:opacity-80 transition-opacity">
              <div className="flex items-center gap-2">
                <ShoppingCartIcon className="size-9 text-primary" />
                <span
                  className="font-semibold font-mono tracking-widest text-2xl
                  bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary"
                >
                  AIMS
                </span>
              </div>
            </Link>
          </div>

          {/* Right side actions */}
          <div className="flex-none gap-3">
            {isAuthenticated && user ? (
              <>
                <div className="dropdown dropdown-end">
                  <div tabIndex={0} className="btn btn-ghost btn-circle avatar cursor-pointer">
                    <div className="bg-primary text-primary-content rounded-full w-10 flex items-center justify-center font-bold">
                      {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                    </div>
                  </div>
                  <ul
                    tabIndex={0}
                    className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                  >
                    <li className="menu-title">
                      <span>{user?.first_name} {user?.last_name}</span>
                    </li>
                    <li className="menu-title">
                      <span className="text-xs text-gray-500">{user?.email}</span>
                    </li>
                    <li>
                      <Link to="/">Home</Link>
                    </li>
                    {user?.role === 'student' && (
                      <>
                        <li>
                          <Link to="/enrolled-courses">My Courses</Link>
                        </li>
                        <li>
                          <Link to="/course-offerings">Available Courses</Link>
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
              </>
            ) : (
              <Link
                to="/login"
                className="btn btn-primary gap-2 btn-sm"
              >
                <LogIn className="size-4" />
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Navbar;