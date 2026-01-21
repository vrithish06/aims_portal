import React, { useState } from "react";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

function LoginPage({ insideModal = false }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const login = useAuthStore((state) => state.login);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      if (result?.success) {
        toast.success("Login successful!");
      } else {
        toast.error(result?.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("Login failed:", error);

      // Network / backend unreachable
      if (!error.response) {
        toast.error("Backend not reachable. Please try again later.");
      } else {
        toast.error("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={
        insideModal
          ? "bg-white"
          : "min-h-screen flex items-center justify-center bg-white"
      }
    >
      <div className="flex w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl">
        {/* Left Side */}
        <div className="w-1/2 flex flex-col items-center justify-center bg-white text-black p-16 relative">
          <img
            src="/logo.png"
            alt="AIMS Logo"
            className="w-40 h-40 mb-8 object-contain"
          />

          <h1 className="text-4xl font-bold mb-6 text-black text-center">
            AIMS
          </h1>

          <p className="text-lg font-light text-gray-700 text-center">
            Use your college mail id to signin
          </p>

          <p className="text-base font-light text-gray-600 mt-2 text-center">
            ending with @iitrpr.ac.in
          </p>

          {/* Divider */}
          <div className="absolute right-0 top-10 bottom-10 w-0.5 bg-gradient-to-b from-blue-200 to-blue-400"></div>
        </div>

        {/* Right Side */}
        <div className="w-1/2 bg-white text-black p-16 flex flex-col justify-center">
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
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
