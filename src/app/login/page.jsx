"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login, clearLegacyCredentialCache } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Modal from "@/components/Modal";
import ToastContainer, { showToast } from "@/components/Toast";
import { FaLock, FaEnvelope, FaEye, FaEyeSlash } from "react-icons/fa";

export default function LoginPage() {
  const router = useRouter();

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form Validation Errors State
  const [errors, setErrors] = useState({ email: "", password: "" });

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (errors.email) {
      if (val.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(val.trim())) {
          setErrors((prev) => ({ ...prev, email: "" }));
        }
      }
    }
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (errors.password && val.trim()) {
      setErrors((prev) => ({ ...prev, password: "" }));
    }
  };

  // Notification Modal State
  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  // Redirect only after Supabase confirms both the session and approved profile.
  useEffect(() => {
    clearLegacyCredentialCache();
    let active = true;
    const redirectIfApproved = async () => {
      const { data: { session } = {} } = await supabase.auth.getSession();
      if (!session?.user || !active) return;
      const { data: profile } = await supabase.from("user_profiles")
        .select("role, status")
        .eq("id", session.user.id)
        .maybeSingle();
      if (!active || !profile || profile.status !== "active") return;
      const destination = profile.role === "admin" || profile.role === "manager" || profile.role === "hr"
        ? "/dashboard"
        : profile.role === "client" ? "/dashboard/client-portal"
        : profile.role === "student" || profile.role === "intern" ? "/dashboard/student"
        : "/dashboard/employee";
      router.replace(destination);
    };
    redirectIfApproved().catch(() => {});
    return () => { active = false; };
  }, [router]);

  const showAlert = (title, message, type = "info") => {
    setModal({ isOpen: true, title, message, type });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nextErrors = { email: "", password: "" };
    if (!cleanEmail) nextErrors.email = "Email is required.";
    else if (!emailRegex.test(cleanEmail)) nextErrors.email = "Please enter a valid email address.";
    if (!cleanPassword) nextErrors.password = "Password is required.";
    if (nextErrors.email || nextErrors.password) { setErrors(nextErrors); return; }

    setErrors({ email: "", password: "" });
    setLoading(true);
    try {
      const { data, error } = await login(cleanEmail, cleanPassword);
      if (error || !data?.user) throw new Error("Incorrect email or password.");
      const { data: profile, error: profileError } = await supabase.from("user_profiles")
        .select("role, status, full_name")
        .eq("id", data.user.id)
        .maybeSingle();
      if (profileError || !profile) throw new Error("Your account profile is not ready. Contact the portal administrator.");
      if (profile.status !== "active") {
        await supabase.auth.signOut();
        throw new Error("Your account is waiting for administrator approval.");
      }

      const role = profile.role;
      const fullName = profile.full_name || data.user.user_metadata?.full_name || cleanEmail.split("@")[0];
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("user_role", role);
      localStorage.setItem("current_user_email", cleanEmail);
      localStorage.setItem("current_user_name", fullName);
      window.dispatchEvent(new Event("roleChanged"));
      showToast("Login successful", `Welcome back, ${fullName}.`, "success");
      const destination = ["admin", "manager", "hr"].includes(role) ? "/dashboard"
        : role === "client" ? "/dashboard/client-portal"
        : ["student", "intern"].includes(role) ? "/dashboard/student"
        : "/dashboard/employee";
      router.replace(destination);
    } catch (error) {
      setErrors({ email: "", password: error?.message || "Unable to sign in." });
      showToast("Sign in failed", error?.message || "Unable to sign in.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white bg-dot-matrix px-4 py-12 relative overflow-hidden">
      {/* Ultra-Subtle Soft Ambient Pulse Dots (Minimal & Elegant) */}
      <div className="absolute top-20 left-24 w-2 h-2 rounded-full bg-blue-500/40 animate-dot-pulse-1 pointer-events-none"></div>
      <div className="absolute bottom-24 right-28 w-2 h-2 rounded-full bg-indigo-500/40 animate-dot-pulse-2 pointer-events-none"></div>

      {/* Single Soft Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-50/40 rounded-full blur-3xl pointer-events-none"></div>

      {/* Notification Modal */}
      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={closeModal}
      />

      {/* Main Login Card */}
      <div className="w-full max-w-md rounded-2xl border border-blue-100 bg-white p-8 login-card-shadow space-y-6 relative z-10 animate-slide-up-fade">
        {/* Header Subtitle */}
        <div className="text-center flex flex-col items-center">
          <img
            src="/logo.jpeg"
            alt="Software House Logo"
            className="h-16 w-16 object-contain mb-3"
          />

          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Nexa Innovation and Technology
          </h1>

          <p className="mt-1 text-xs text-slate-500 font-medium">
            Universal Single Sign-On Portal (Automatic Role Recognition)
          </p>
        </div>

        {/* Mode Title Sub-Header */}
        <div className="border-b border-slate-100 pb-3 text-center">
          <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">
            Sign In to System Portal
          </span>
        </div>

        {/* Login / Register Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
              Email Address *
            </label>

            <div className="relative">
              <FaEnvelope className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={handleEmailChange}
                className={`w-full rounded-lg border pl-10 pr-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 ${
                  errors.email ? "border-red-500 bg-red-50/30" : "border-slate-300"
                }`}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
              Password *
            </label>

            <div className="relative">
              <FaLock className="absolute left-3.5 top-3.5 text-slate-400 text-sm pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={handlePasswordChange}
                className={`w-full rounded-lg border pl-10 pr-10 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 transition-colors ${
                  errors.password ? "border-red-500 bg-red-50/30" : "border-slate-300"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer focus:outline-none p-0.5 rounded"
                title={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <FaEyeSlash className="text-base" />
                ) : (
                  <FaEye className="text-base" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.password}</p>
            )}
          </div>

          <div className="-mt-2 text-right">
            <Link href="/forgot-password" className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-bold text-white transition-all hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 shadow-lg cursor-pointer relative overflow-hidden group"
          >
            {/* Shimmer sweep animation effect */}
            <span className="absolute inset-0 w-1/2 h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:animate-shimmer-pass"></span>
            <span className="relative z-10">
              {loading ? "Authenticating Database..." : "Sign In to System Portal"}
            </span>
          </button>
        </form>

        <div className="border-t border-slate-100 pt-4 text-center text-xs">
          <p className="font-medium text-slate-600">
            New to NEXA?{" "}
            <Link href="/signup" className="font-bold text-blue-600 hover:text-blue-700 hover:underline">
              Create an account
            </Link>
          </p>
          <p className="mt-2 text-slate-500">
            An administrator must approve your account before you can sign in.
          </p>
        </div>
      </div>
      {/* Global Toast Notification Engine */}
      <ToastContainer />
    </div>
  );
}
