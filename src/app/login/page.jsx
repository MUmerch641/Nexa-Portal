"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login, resolveUserRoleAndProfile } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Modal from "@/components/Modal";
import ToastContainer, { showToast } from "@/components/Toast";
import { FaLock, FaEnvelope, FaShieldAlt, FaArrowRight, FaUserPlus } from "react-icons/fa";

export default function LoginPage() {
  const router = useRouter();

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);

  // Form Validation Errors State
  const [errors, setErrors] = useState({ email: "", password: "" });

  // Notification Modal State
  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

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

  // Redirect user if already logged in when visiting /login
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
        const userRole = localStorage.getItem("user_role");

        if (session || (isLoggedIn && userRole)) {
          const activeRole = userRole || session?.user?.user_metadata?.role || "admin";
          if (activeRole === "client") {
            router.replace("/dashboard/client-portal");
          } else if (activeRole === "intern") {
            router.replace("/dashboard/internships");
          } else if (activeRole === "student") {
            router.replace("/dashboard/student");
          } else if (activeRole === "employee") {
            router.replace("/dashboard/employee");
          } else if (activeRole === "admin") {
            router.replace("/dashboard");
          } else {
            router.replace("/dashboard");
          }
        }
      } catch (e) {}
    };

    checkActiveSession();
  }, [router]);

  const showAlert = (title, message, type = "info") => {
    setModal({ isOpen: true, title, message, type });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  // Resend email verification link
  const handleResendVerification = async () => {
    const trimmedEmail = (email || "").trim().toLowerCase();
    if (!trimmedEmail) {
      showToast("Email Required", "Please enter your registered email address.", "error");
      return;
    }

    setResendingEmail(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: trimmedEmail,
      });

      if (error) {
        showToast("Resend Failed 🛑", error.message || "Failed to resend confirmation email.", "error");
      } else {
        showToast("Verification Sent ✉️", `Confirmation email resent to ${trimmedEmail}. Please check your inbox.`, "success");
        showAlert(
          "Verification Email Sent ✉️",
          `A new confirmation link has been sent to ${trimmedEmail}.\n\nPlease open the link from your email to activate your account, then return here to log in.`,
          "success"
        );
      }
    } catch (err) {
      showToast("Error", "Could not send verification email. Please try again later.", "error");
    } finally {
      setResendingEmail(false);
    }
  };

  // Handle login submission using Supabase Auth (Single Source of Truth)
  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedEmail = (email || "").trim().toLowerCase();
    const trimmedPassword = (password || "").trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const newErrors = { email: "", password: "" };

    if (!trimmedEmail) {
      newErrors.email = "Email is required.";
    } else if (!emailRegex.test(trimmedEmail)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!trimmedPassword) {
      newErrors.password = "Password is required.";
    }

    if (newErrors.email || newErrors.password) {
      setErrors(newErrors);
      return;
    }

    setErrors({ email: "", password: "" });
    setLoading(true);
    setShowResendVerification(false);

    try {
      // 1. Authenticate with Supabase Auth (Single Source of Truth)
      const { data: authData, error: authError } = await login(trimmedEmail, trimmedPassword);

      if (authError) {
        setLoading(false);
        const errMsg = (authError.message || "").toLowerCase();

        // Case A: Email Not Verified / Confirmed
        if (
          errMsg.includes("email not confirmed") ||
          errMsg.includes("not confirmed") ||
          errMsg.includes("verification")
        ) {
          setShowResendVerification(true);
          showToast("Email Not Verified ✉️", "Please verify your email before logging in.", "warning");
          showAlert(
            "Email Verification Required ✉️",
            `Your account (${trimmedEmail}) is registered, but the email address has not been verified yet.\n\nPlease check your inbox for the confirmation link. If you didn't receive it, click 'Resend Verification Link' below.`,
            "warning"
          );
          return;
        }

        // Case B: Invalid Credentials (Wrong Email or Wrong Password)
        if (
          errMsg.includes("invalid login credentials") ||
          errMsg.includes("invalid_grant") ||
          errMsg.includes("invalid credentials")
        ) {
          // Check local offline fallback seed for offline development simulation
          const defaultAccounts = [
            { email: "admin@gmail.com", password: "adminpassword", role: "admin", fullName: "Admin User" },
            { email: "student@gmail.com", password: "studentpassword", role: "student", fullName: "Ali Hassan" },
            { email: "sara.design@gmail.com", password: "employeepassword", role: "employee", fullName: "Sara Khan" },
            { email: "rahim.dev@gmail.com", password: "employeepassword", role: "employee", fullName: "Muhammad Rahim Bugti" },
            { email: "ali.staff@gmail.com", password: "employeepassword", role: "employee", fullName: "Muhammad Ali" },
            { email: "client@acmetech.com", password: "clientpassword", role: "client", fullName: "Client User" },
          ];

          let registeredUsers = [];
          try {
            const saved = localStorage.getItem("registered_system_users");
            if (saved) registeredUsers = JSON.parse(saved);
          } catch (e) {}

          const offlineMatch = [...defaultAccounts, ...registeredUsers].find(
            (u) => (u.email || "").toLowerCase() === trimmedEmail && u.password === trimmedPassword
          );

          if (offlineMatch) {
            // Local dev fallback match
            const activeRole = offlineMatch.role || "employee";
            const fullName = offlineMatch.fullName || offlineMatch.full_name || trimmedEmail.split("@")[0];

            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("user_role", activeRole);
            localStorage.setItem("current_user_email", trimmedEmail);
            localStorage.setItem("current_user_name", fullName);
            window.dispatchEvent(new Event("roleChanged"));

            showToast("Login Successful 🟢", `Welcome back! Logging into ${activeRole.toUpperCase()} Portal...`, "success");
            redirectToDashboard(activeRole);
            return;
          }

          showToast("Invalid Credentials 🔴", "Incorrect email or password. Please check your credentials.", "error");
          showAlert(
            "Invalid Credentials 🔴",
            "The email address or password you entered is incorrect. Please check your credentials and try again.",
            "error"
          );
          return;
        }

        // Case C: Network or Service Error
        if (errMsg.includes("fetch") || errMsg.includes("network") || errMsg.includes("connection")) {
          showToast("Network Error 🌐", "Could not connect to authentication service. Please check your connection.", "error");
          showAlert(
            "Connection Error 🌐",
            "Unable to reach the authentication service. Please check your internet connection or try again in a few moments.",
            "error"
          );
          return;
        }

        // Case D: Other Supabase Auth Error
        showToast("Authentication Error 🛑", authError.message || "Failed to sign in.", "error");
        showAlert("Authentication Error 🛑", authError.message || "An error occurred during authentication.", "error");
        return;
      }

      // 2. Successful Supabase Auth Login
      if (authData && authData.user) {
        const user = authData.user;

        // Resolve user role, full name, and remote work properties
        const profileInfo = await resolveUserRoleAndProfile(user);
        const resolvedRole = profileInfo.role || "employee";
        const resolvedName = profileInfo.fullName || user.user_metadata?.full_name || trimmedEmail.split("@")[0];

        // Store active session keys
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("user_role", resolvedRole);
        localStorage.setItem("current_user_email", trimmedEmail);
        localStorage.setItem("current_user_name", resolvedName);
        localStorage.setItem("current_user_id", user.id);

        if (profileInfo.isRemote) {
          localStorage.setItem(`is_remote_user_${trimmedEmail}`, "true");
          localStorage.setItem(`remote_attendance_override_${trimmedEmail}`, "true");
        }

        window.dispatchEvent(new Event("roleChanged"));
        setLoading(false);

        showToast("Login Successful 🟢", `Welcome back, ${resolvedName}! Accessing ${resolvedRole.toUpperCase()} Portal...`, "success");
        redirectToDashboard(resolvedRole);
      }
    } catch (err) {
      setLoading(false);
      console.error("Login exception:", err);
      showToast("System Error", "An unexpected error occurred during login. Please try again.", "error");
    }
  };

  const redirectToDashboard = (role) => {
    const targetRole = (role || "").toLowerCase().trim();
    if (targetRole === "client") {
      setTimeout(() => router.replace("/dashboard/client-portal"), 500);
    } else if (targetRole === "intern") {
      setTimeout(() => router.replace("/dashboard/internships"), 500);
    } else if (targetRole === "student") {
      setTimeout(() => router.replace("/dashboard/student"), 500);
    } else if (targetRole === "employee") {
      setTimeout(() => router.replace("/dashboard/employee"), 500);
    } else if (targetRole === "admin") {
      setTimeout(() => router.replace("/dashboard"), 500);
    } else {
      setTimeout(() => router.replace("/dashboard"), 500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white bg-dot-matrix px-4 py-12 relative overflow-hidden">
      {/* Soft Ambient Radial Glow */}
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
            alt="Nexa Logo"
            className="h-16 w-16 object-contain mb-3 rounded-xl shadow-xs"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
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

        {/* Login Form */}
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
              <FaLock className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={handlePasswordChange}
                className={`w-full rounded-lg border pl-10 pr-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 ${
                  errors.password ? "border-red-500 bg-red-50/30" : "border-slate-300"
                }`}
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.password}</p>
            )}
          </div>

          {/* Resend Verification Button if unconfirmed */}
          {showResendVerification && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-2">
              <p className="font-semibold">Account pending email verification.</p>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendingEmail}
                className="w-full py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                {resendingEmail ? "Sending Verification..." : "Resend Confirmation Email"}
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-bold text-white transition-all hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 shadow-lg cursor-pointer relative overflow-hidden group flex items-center justify-center gap-2"
          >
            <span className="relative z-10 flex items-center gap-2">
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <FaArrowRight className="text-xs" />
                </>
              )}
            </span>
          </button>
        </form>

        {/* Footer Actions */}
        <div className="space-y-3 pt-2 text-center border-t border-slate-100">
          <div className="text-xs text-slate-600">
            Need a new account?{" "}
            <Link href="/signup" className="font-bold text-blue-600 hover:underline inline-flex items-center gap-1">
              <FaUserPlus className="text-xs" /> Register Account
            </Link>
          </div>
          <p className="text-[11px] text-slate-400">
            Internal Portal • Nexa Innovation & Technology
          </p>
        </div>
      </div>

      {/* Global Toast Notification Engine */}
      <ToastContainer />
    </div>
  );
}
