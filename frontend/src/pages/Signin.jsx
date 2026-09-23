import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { LogIn, Mail, Lock, AlertCircle, ShieldCheck, Heart } from "lucide-react";
import SobdaLogo from "../Components/SobdaLogo.jsx";

function Signin({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const res = await axios.post("/api/users/login", {
        email: email.trim(),
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.user.role);
      localStorage.setItem("userName", res.data.user.name);

      setUser({ token: res.data.token, role: res.data.user.role });

      // Role-specific redirect
      if (res.data.user.role === "donor") {
        navigate("/dashboard/donor-requests");
      } else if (res.data.user.role === "hospital") {
        navigate("/dashboard/hospital-donors");
      } else if (res.data.user.role === "doctor") {
        navigate("/dashboard/doctor-inbox");
      } else if (res.data.user.role === "health_institution") {
        navigate("/dashboard/reports");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 py-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Top Centered Branding Logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Link to="/" className="inline-block transform hover:scale-105 transition-transform duration-200 mb-3 bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200/80">
            <SobdaLogo size="lg" />
          </Link>
          <p className="text-sm font-medium text-slate-600">
            Blood Donation Management System
          </p>
        </div>

        {/* Sign In Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 relative overflow-hidden">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-brand"></div>

          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Welcome Back</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Sign in to access your portal</p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm transition-all"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm transition-all"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-xl shadow-lg shadow-red-600/30 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
            >
              <LogIn className="w-4 h-4" />
              {loading ? "Signing in..." : "Sign In to Portal"}
            </button>
          </form>

          {/* Quick Role Notice */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-red-600"></span> Donor
            </span>
            <span className="flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span> Hospital
            </span>
            <span className="flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-slate-700"></span> Admin
            </span>
          </div>

          {/* Sign Up Link */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              New blood donor?{" "}
              <Link to="/signup" className="text-red-600 hover:text-red-700 font-bold hover:underline">
                Register as a Donor
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signin;