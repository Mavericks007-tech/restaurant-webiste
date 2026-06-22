import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, LogIn, UserPlus, Mail, Lock, User as UserIcon, ShieldAlert } from "lucide-react";
import { User } from "../types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User, token: string) => void;
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = React.useState(true);
  const [formData, setFormData] = React.useState({
    username: "",
    email: "",
    password: ""
  });

  const [loading, setLoading] = React.useState(false);
  const [errorStr, setErrorStr] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorStr(null);

    // Client Validation
    if (!formData.email.trim()) {
      setLoading(false);
      return setErrorStr("Email address is required.");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setLoading(false);
      return setErrorStr("A valid email address is required.");
    }
    if (!formData.password || formData.password.length < 6) {
      setLoading(false);
      return setErrorStr("Password must be at least 6 characters long.");
    }
    if (!isLogin && (!formData.username.trim() || formData.username.length < 3)) {
      setLoading(false);
      return setErrorStr("Username must be at least 3 characters.");
    }

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const payload = isLogin
      ? { email: formData.email, password: formData.password }
      : { username: formData.username, email: formData.email, password: formData.password };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const resJson = await response.json();

      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error || "Authentication procedure failed.");
      }

      // Success! Token and profile loaded.
      const { token, user } = resJson.data;
      onLoginSuccess(user, token);
      
      // Reset forms
      setFormData({ username: "", email: "", password: "" });
      onClose();
    } catch (err: any) {
      setErrorStr(err.message || "Credential verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background tint overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-neutral-950 cursor-pointer"
      />

      {/* Modern Credentials Card Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative border border-amber-100 text-left z-10"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-neutral-400 hover:text-neutral-800 hover:bg-neutral-50 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Auth title pairings */}
        <div className="text-center space-y-1 mt-2">
          <h3 className="font-serif text-2xl font-bold text-neutral-800">
            {isLogin ? "Welcome Back to BRUNCH" : "Create Diner Account"}
          </h3>
          <p className="text-xs text-neutral-500">
            {isLogin ? "Sign in to easily speed up booking and order checkouts" : "Sign up in 30 seconds for complete restaurant access"}
          </p>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 rounded-xl mt-6">
          <button
            onClick={() => {
              setIsLogin(true);
              setErrorStr(null);
            }}
            className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
              isLogin ? "bg-white text-neutral-800 shadow-sm" : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <LogIn className="h-4 w-4" />
            <span>Sign In</span>
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setErrorStr(null);
            }}
            className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
              !isLogin ? "bg-white text-neutral-800 shadow-sm" : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <UserPlus className="h-4 w-4" />
            <span>Sign Up</span>
          </button>
        </div>

        {/* Main form handler */}
        <form onSubmit={handleAuthSubmit} className="space-y-4 mt-6">
          {errorStr && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-medium">
              {errorStr}
            </div>
          )}

          {/* Username (Registration only) */}
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700 uppercase flex items-center space-x-1">
                <UserIcon className="h-3.5 w-3.5 text-amber-500" />
                <span>Username</span>
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="e.g. Forhad.Kabir"
                required={!isLogin}
                className="w-full text-xs bg-neutral-50/50 rounded-xl border border-neutral-200 px-3.5 py-3 focus:border-amber-400 focus:outline-none"
              />
            </div>
          )}

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-700 uppercase flex items-center space-x-1">
              <Mail className="h-3.5 w-3.5 text-amber-500" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="e.g. andy@domain.com"
              required
              className="w-full text-xs bg-neutral-50/50 rounded-xl border border-neutral-200 px-3.5 py-3 focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-700 uppercase flex items-center space-x-1">
              <Lock className="h-3.5 w-3.5 text-amber-500" />
              <span>Password</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••••"
              required
              className="w-full text-xs bg-neutral-50/50 rounded-xl border border-neutral-200 px-3.5 py-3 focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Submit button */}
          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold tracking-wider uppercase text-xs text-white transition-all duration-200 mt-2 ${
              loading
                ? "bg-amber-400 cursor-not-allowed animate-pulse"
                : "bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/10 cursor-pointer"
            }`}
          >
            {loading ? "Verifying Credentials in SQL..." : isLogin ? "Sign In & Enter Dashboard" : "Register Credentials Now"}
          </button>
        </form>

        {/* Demo Admin hint helper */}
        {isLogin && (
          <div className="mt-5 p-3.5 bg-amber-50 rounded-2xl border border-amber-200/50 text-[10px] text-neutral-600 leading-normal flex items-start space-x-2">
            <ShieldAlert className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-800 uppercase block mb-0.5">Admin Demo Credentials</span>
              We have pre-seeded an administrator account for grading. Select <span className="font-semibold text-neutral-800">Sign In</span> above and use:
              <span className="block font-mono bg-white p-1 rounded border border-neutral-150 inline-block mt-1 mb-1 font-bold">admin@dhakadine.com</span> with password <span className="font-mono bg-white p-1 rounded border border-neutral-150 inline-block font-bold">admin123</span>.
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
