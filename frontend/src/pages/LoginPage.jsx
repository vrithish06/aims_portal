import React, { useState } from "react";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";
import bgImage from "../assets/image.png";

function LoginPage({ insideModal = false }) {
  const [step, setStep] = useState("email"); // "email" or "otp"
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const sendOTP = useAuthStore((state) => state.sendOTP);
  const verifyOTP = useAuthStore((state) => state.verifyOTP);

  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);

    try {
      const result = await sendOTP(email);

      if (result?.success) {
        toast.success("OTP sent to your email!");
        setStep("otp");
      } else {
        toast.error(result?.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Send OTP failed:", error);
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!otp) {
      toast.error("Please enter the OTP");
      return;
    }

    if (otp.length !== 6) {
      toast.error("OTP must be 6 digits");
      return;
    }

    setLoading(true);

    try {
      const result = await verifyOTP(email, otp);

      if (result?.success) {
        toast.success("Login successful!");
        // Navigation happens automatically via session check in App.jsx
      } else {
        toast.error(result?.message || "Invalid OTP");
      }
    } catch (error) {
      console.error("OTP verification failed:", error);
      toast.error("OTP verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep("email");
    setOtp("");
  };

  return (
    <div
      className={
        insideModal
          ? 'bg-transparent'
          : 'min-h-screen flex items-center justify-center bg-white relative overflow-hidden'
      }
    >
      {/* Background Image - Bottom Left */}
      {!insideModal && (
        <img
          src={bgImage}
          alt="Background Decoration"
          className="absolute bottom-0 right-0 w-[30vw] md:w-[25vw] object-contain z-0 pointer-events-none select-none opacity-90"
        />
      )}

      {/* Login Card */}
      <div className="relative z-10 flex flex-col md:flex-row w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl border border-gray-100">

        {/* LEFT SIDE */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm text-black px-6 py-10 md:p-16 relative">
          <img
            src="/logo.png"
            alt="AIMS Logo"
            className="w-24 h-24 md:w-40 md:h-40 mb-6 object-contain"
          />

          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center tracking-tight">
            AIMS
          </h1>

          <p className="text-base md:text-lg font-light text-gray-700 text-center">
            Use your college mail id to sign in
          </p>

          <p className="text-sm md:text-base font-light text-gray-600 mt-1 text-center">
            ending with @iitrpr.ac.in
          </p>

          {/* Divider (only desktop) */}
          <div className="hidden md:block absolute right-0 top-10 bottom-10 w-[1px] bg-gray-200"></div>
        </div>

        {/* RIGHT SIDE */}
        <div className="w-full md:w-1/2 bg-white/95 backdrop-blur-sm text-black px-6 py-10 md:p-16 flex flex-col justify-center">

          {step === "email" ? (
            // STEP 1: EMAIL ENTRY
            <form onSubmit={handleSendOTP}>
              <h2 className="text-2xl font-bold mb-6 text-gray-900 tracking-tight">Enter Your Email</h2>

              <div className="mb-8">
                <input
                  type="email"
                  placeholder="Enter email"
                  className="w-full bg-transparent border-b border-gray-300 text-black text-base md:text-lg py-3 focus:outline-none focus:border-black placeholder-gray-400 transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gray-900 hover:bg-black text-white font-medium py-3 rounded-full transition-all disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                disabled={loading}
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            // STEP 2: OTP VERIFICATION
            <form onSubmit={handleVerifyOTP}>
              <h2 className="text-2xl font-bold mb-2 text-gray-900 tracking-tight">Verify OTP</h2>
              <p className="text-gray-600 text-sm mb-6">
                Enter the 6-digit code sent to <span className="font-semibold text-black">{email}</span>
              </p>

              <div className="mb-8">
                <input
                  type="text"
                  placeholder="000000"
                  className="w-full bg-transparent border-b border-gray-300 text-black text-base md:text-lg py-3 focus:outline-none focus:border-black placeholder-gray-400 text-center tracking-[0.5em] font-medium"
                  value={otp}
                  onChange={(e) => {
                    // Only allow digits
                    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                    setOtp(value);
                  }}
                  disabled={loading}
                  maxLength="6"
                  inputMode="numeric"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gray-900 hover:bg-black text-white font-medium py-3 rounded-full transition-all disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg mb-4"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>

              <button
                type="button"
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-3 rounded-full transition-colors border border-gray-200"
                onClick={handleBackToEmail}
                disabled={loading}
              >
                Back
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
