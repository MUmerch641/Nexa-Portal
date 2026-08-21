"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Modal from "@/components/Modal";
import ToastContainer, { showToast } from "@/components/Toast";
import { FaLock, FaEnvelope } from "react-icons/fa";

export default function LoginPage() {
  const router = useRouter();
  const selectedRole = "admin";

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const workMode = "remote"; // 'remote' (Ipify OFF) or 'onsite'
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

  // Redirect user if already logged in when visiting /login
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const userRole = localStorage.getItem("user_role");
    if (isLoggedIn && userRole) {
      if (userRole === "client") {
        router.replace("/dashboard/client-portal");
      } else if (userRole === "admin") {
        router.replace("/dashboard");
      } else {
        router.replace("/dashboard/attendance");
      }
    }
  }, [router]);

  const showAlert = (title, message, type = "info") => {
    setModal({ isOpen: true, title, message, type });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  // Helper to load registered users from localStorage cache
  const getRegisteredUsers = () => {
    try {
      const saved = localStorage.getItem("registered_system_users");
      return saved ? JSON.parse(saved) : [];
    } catch(e) {
      return [];
    }
  };

  // Handle login submission. New accounts are created by an administrator.
  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedEmail = (email || "").trim();
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

    // Check if account has been deactivated by Admin
    let persistentEmps = [];
    try {
      const p = localStorage.getItem("persistent_employees");
      if (p) persistentEmps = JSON.parse(p);
    } catch (e) {}

    const matchedEmpRecord = persistentEmps.find(
      (emp) => (emp.email || "").trim().toLowerCase() === email.trim().toLowerCase()
    );

    if (matchedEmpRecord && (matchedEmpRecord.status === "inactive" || matchedEmpRecord.status === "deactivated")) {
      setLoading(false);
      showToast("Account Deactivated 🛑", "Your account has been deactivated by Admin. Access denied.", "error");
      showAlert(
        "Account Deactivated 🛑",
        "Your employee account has been deactivated by Management. You cannot log into the system portal. Please contact HR or System Administrator.",
        "error"
      );
      return;
    }

    // Normal Login Flow: Strict authentication against registered accounts
    const registeredUsers = getRegisteredUsers();
    
    // Default system seed accounts assigned by Admin
    const defaultAccounts = [
      { email: "admin@gmail.com", password: "adminpassword", role: "admin", fullName: "Admin User" },
      { email: "student@gmail.com", password: "studentpassword", role: "student", fullName: "Ali Hassan" },
      { email: "sara.design@gmail.com", password: "employeepassword", role: "employee", fullName: "Sara Khan" },
      { email: "rahim.dev@gmail.com", password: "employeepassword", role: "employee", fullName: "Muhammad Rahim Bugti" },
      { email: "ali.staff@gmail.com", password: "employeepassword", role: "employee", fullName: "Muhammad Ali" },
      { email: "client@acmetech.com", password: "clientpassword", role: "client", fullName: "Client User" },
    ];

    const allValidUsers = [...defaultAccounts, ...registeredUsers];

    const matchedUser = allValidUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    // 1. Check if user credentials match registered local/seed accounts first
    if (matchedUser) {
      const activeRole = matchedUser.role || selectedRole;
      const emailLower = email.trim().toLowerCase();

      // Check if matched user account is Remote
      const isRemoteUser = (
        matchedUser.is_remote === true ||
        (matchedUser.work_mode && String(matchedUser.work_mode).toLowerCase().includes("remote")) ||
        (matchedUser.employment_type && String(matchedUser.employment_type).toLowerCase().includes("remote")) ||
        (matchedUser.department && String(matchedUser.department).toLowerCase().includes("remote")) ||
        emailLower.includes("remote")
      );

      if (isRemoteUser) {
        localStorage.setItem(`is_remote_user_${emailLower}`, "true");
        localStorage.setItem(`remote_attendance_override_${emailLower}`, "true");
      }

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("user_role", activeRole);
      localStorage.setItem("current_user_email", email);

      // Naam resolve karo: matched user → employees list → students list → email se
      let resolvedName = matchedUser.fullName || matchedUser.full_name || "";
      if (!resolvedName) {
        try {
          const emps = JSON.parse(localStorage.getItem("persistent_employees") || "[]");
          const emp = emps.find(e => (e.email || "").toLowerCase() === emailLower);
          if (emp) resolvedName = emp.full_name || emp.name || "";
        } catch(e) {}
      }
      if (!resolvedName) {
        try {
          const stus = JSON.parse(localStorage.getItem("persistent_courses") || "[]");
          const stu = stus.find(s => (s.email || "").toLowerCase() === emailLower);
          if (stu) resolvedName = stu.full_name || stu.name || "";
        } catch(e) {}
      }
      localStorage.setItem("current_user_name", resolvedName);
      window.dispatchEvent(new Event("roleChanged"));

      setLoading(false);
      showToast("Login Successful 🟢", `Welcome back! Logging into ${activeRole.toUpperCase()} Portal...`, "success");

      if (activeRole === "client") {
        setTimeout(() => router.replace("/dashboard/client-portal"), 800);
      } else if (activeRole === "intern") {
        setTimeout(() => router.replace("/dashboard/internships"), 800);
      } else if (activeRole === "student") {
        setTimeout(() => router.replace("/dashboard/student"), 800);
      } else if (activeRole === "admin") {
        setTimeout(() => router.replace("/dashboard"), 800);
      } else {
        setTimeout(() => router.replace("/dashboard/attendance"), 800);
      }
      return;
    }

    // 2. Fallback: Try Supabase Auth API login
    let supabaseAuthSuccess = false;
    try {
      const { error } = await login(email, password);
      if (!error) {
        supabaseAuthSuccess = true;
      }
    } catch(e) {}

    if (supabaseAuthSuccess) {
      const emailLower = email.trim().toLowerCase();
      if (workMode === "remote") {
        localStorage.setItem(`is_remote_user_${emailLower}`, "true");
        localStorage.setItem(`remote_attendance_override_${emailLower}`, "true");
      }

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("user_role", selectedRole);
      localStorage.setItem("current_user_email", email);
      localStorage.setItem("current_user_name", "");
      window.dispatchEvent(new Event("roleChanged"));

      setLoading(false);
      showToast("Login Successful 🟢", `Welcome back! Logging into ${selectedRole.toUpperCase()} Portal...`, "success");

      if (selectedRole === "client") {
        setTimeout(() => router.replace("/dashboard/client-portal"), 800);
      } else if (selectedRole === "intern") {
        setTimeout(() => router.replace("/dashboard/internships"), 800);
      } else if (selectedRole === "student") {
        setTimeout(() => router.replace("/dashboard/student"), 800);
      } else if (selectedRole === "employee") {
        setTimeout(() => router.replace("/dashboard/employee"), 800);
      } else if (selectedRole === "admin") {
        setTimeout(() => router.replace("/dashboard"), 800);
      } else {
        setTimeout(() => router.replace("/dashboard/employee"), 800);
      }
    } else {
      setLoading(false);
      showToast("Invalid Credentials 🔴", "Incorrect Email or Password. Please check your credentials and try again.", "error");
      showAlert(
        "Invalid Credentials 🔴",
        "Incorrect Email or Password. Only registered accounts can log in. If you are new, click 'Register Account' to verify OTP first.",
        "error"
      );
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

        <p className="border-t border-slate-100 pt-4 text-center text-xs font-medium text-slate-500">
          Accounts are created by an administrator.
        </p>
      </div>
      {/* Global Toast Notification Engine */}
      <ToastContainer />
    </div>
  );
}
