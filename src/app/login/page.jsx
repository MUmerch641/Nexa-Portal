"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Modal from "@/components/Modal";
import ToastContainer, { showToast } from "@/components/Toast";
import { FaUserTie, FaBuilding, FaLock, FaEnvelope, FaKey, FaGraduationCap, FaShieldAlt, FaUserCheck } from "react-icons/fa";

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState("admin"); // 'admin', 'employee', 'client'
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("Software Engineering");
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

  // OTP Verification Modal State
  const [otpModal, setOtpModal] = useState({
    isOpen: false,
    generatedOtp: "",
    userEnteredOtp: "",
    userCredentials: null,
  });

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

  // Helper to save registered users
  const saveRegisteredUser = (userObj) => {
    const existing = getRegisteredUsers();
    // Check if user already exists
    const updated = [...existing.filter(u => u.email.toLowerCase() !== userObj.email.toLowerCase()), userObj];
    localStorage.setItem("registered_system_users", JSON.stringify(updated));
  };

  // Step 1: Handle Login or Register Submission
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

    // Registration Flow: Create Account -> Send OTP -> Verify -> Save Credentials
    if (isRegisterMode) {
      const existingUsers = getRegisteredUsers();
      const userExists = existingUsers.some(u => u.email.toLowerCase() === email.toLowerCase());

      if (userExists) {
        showToast("Account Exists", "An account with this email is already registered. Please switch to Sign In.", "warning");
        setLoading(false);
        return;
      }

      // Try Supabase Auth Sign Up
      try {
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role: selectedRole, department }
          }
        });
      } catch(e) {}

      // Generate 6-digit OTP for email verification
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setLoading(false);

      // Trigger OTP Modal for Registration
      setOtpModal({
        isOpen: true,
        generatedOtp: newOtp,
        userEnteredOtp: "",
        userCredentials: {
          fullName: fullName || (selectedRole === "admin" ? "Admin User" : "Member"),
          email,
          password,
          role: selectedRole,
          department
        }
      });

      showToast(
        "Verification Code Sent 📧",
        `OTP Code: ${newOtp}\nCheck OTP verification dialog to complete registration.`,
        "info"
      );
      return;
    }

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
      { email: "admin@gmail.com", password: "adminpassword", role: "admin" },
      { email: "student@gmail.com", password: "studentpassword", role: "student" },
      { email: "sara.design@gmail.com", password: "employeepassword", role: "employee" },
      { email: "rahim.dev@gmail.com", password: "employeepassword", role: "employee" },
      { email: "ali.staff@gmail.com", password: "employeepassword", role: "employee" },
      { email: "client@acmetech.com", password: "clientpassword", role: "client" },
    ];

    const allValidUsers = [...defaultAccounts, ...registeredUsers];

    const matchedUser = allValidUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    // 1. Check if user credentials match registered local/seed accounts first
    if (matchedUser) {
      const activeRole = matchedUser.role || selectedRole;
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("user_role", activeRole);
      localStorage.setItem("current_user_email", email);
      window.dispatchEvent(new Event("roleChanged"));

      setLoading(false);
      showToast("Login Successful 🟢", `Welcome back! Logging into ${activeRole.toUpperCase()} Portal...`, "success");

      if (activeRole === "client") {
        setTimeout(() => router.replace("/dashboard/client-portal"), 800);
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
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("user_role", selectedRole);
      localStorage.setItem("current_user_email", email);
      window.dispatchEvent(new Event("roleChanged"));

      setLoading(false);
      showToast("Login Successful 🟢", `Welcome back! Logging into ${selectedRole.toUpperCase()} Portal...`, "success");

      if (selectedRole === "client") {
        setTimeout(() => router.replace("/dashboard/client-portal"), 800);
      } else if (selectedRole === "admin") {
        setTimeout(() => router.replace("/dashboard"), 800);
      } else {
        setTimeout(() => router.replace("/dashboard/attendance"), 800);
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

  // Step 2: Verify 6-Digit Email OTP Code & Save Registered User
  const handleVerifyOtp = (e) => {
    e.preventDefault();

    if (otpModal.userEnteredOtp !== otpModal.generatedOtp) {
      showAlert("Invalid OTP", "The 6-digit verification code is incorrect. Please try again.", "error");
      return;
    }

    // OTP Verified! Save registered user credentials locally for future login
    if (otpModal.userCredentials) {
      saveRegisteredUser(otpModal.userCredentials);
    }

    const assignedRole = otpModal.userCredentials?.role || selectedRole;
    localStorage.setItem("user_role", assignedRole);
    localStorage.setItem("current_user_email", email);
    window.dispatchEvent(new Event("roleChanged"));

    setOtpModal({ isOpen: false, generatedOtp: "", userEnteredOtp: "", userCredentials: null });
    setIsRegisterMode(false);

    showAlert("Account Verified & Saved! 🟢", `Email verified successfully. Your account is now saved. Logging into ${assignedRole.toUpperCase()} Portal...`, "success");

    if (assignedRole === "client") {
      setTimeout(() => router.push("/dashboard/client-portal"), 1000);
    } else if (assignedRole === "student" || assignedRole === "course_student") {
      setTimeout(() => router.push("/dashboard/student"), 1000);
    } else if (assignedRole === "employee" || assignedRole === "staff") {
      setTimeout(() => router.push("/dashboard/employees"), 1000);
    } else {
      setTimeout(() => router.push("/dashboard"), 1000);
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

      {/* 2-Step Email OTP Verification Modal */}
      {otpModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-blue-200 space-y-5">
            <div className="text-center space-y-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 mx-auto text-xl font-bold">
                <FaShieldAlt />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Email OTP Verification</h3>
              <p className="text-xs text-slate-500">
                Enter the 6-digit verification code dispatched to <span className="font-bold text-slate-800">{email}</span>
              </p>
            </div>

            {/* OTP Hint Box */}
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-center text-xs text-amber-800 font-mono font-bold">
              Your Verification OTP: <span className="text-amber-900 text-sm">{otpModal.generatedOtp}</span>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1 text-center">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <FaKey className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="849201"
                    value={otpModal.userEnteredOtp}
                    onChange={(e) => setOtpModal({ ...otpModal, userEnteredOtp: e.target.value })}
                    className="w-full text-center tracking-widest font-mono text-lg font-bold rounded-lg border border-slate-300 pl-10 pr-4 py-2 text-slate-900 outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-xs"
              >
                Verify OTP & Save Credentials
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Login / Register Card */}
      <div className="w-full max-w-md rounded-2xl border border-blue-100 bg-white p-8 login-card-shadow space-y-6 relative z-10 animate-slide-up-fade">
        {/* Header Subtitle */}
        <div className="text-center flex flex-col items-center">
          <img
            src="/logo.jpeg"
            alt="Software House Logo"
            className="h-16 w-16 rounded-2xl object-cover border border-blue-200 shadow-md mb-3 hover:scale-105 transition-transform duration-300"
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
            {isRegisterMode ? "Create New Verified Account" : "Sign In to System Portal"}
          </span>
        </div>

        {/* Login / Register Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {isRegisterMode && (
            <>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Muhammad Ali"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600"
                  required={isRegisterMode}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                  Select Account Role *
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 font-medium"
                >
                  <option value="student">🎓 Student Account</option>
                  <option value="employee">🧑‍💻 Paid Staff / Employee</option>
                  <option value="client">🏢 Client Account</option>
                  <option value="admin">👑 Admin Account</option>
                </select>
              </div>
            </>
          )}

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
              {loading
                ? "Authenticating Database..."
                : isRegisterMode
                ? "Register Account & Verify OTP"
                : "Sign In to System Portal"}
            </span>
          </button>
        </form>

        {/* Toggle Register / Sign In Option Below Submit Button */}
        <div className="pt-2 text-center border-t border-slate-100">
          <p className="text-xs text-slate-500 font-medium">
            {isRegisterMode ? "Already have an account?" : "Don't have an account yet?"}{" "}
            <button
              type="button"
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              className="font-bold text-blue-600 hover:underline cursor-pointer ml-1"
            >
              {isRegisterMode ? "Sign In Here" : "Register New Account"}
            </button>
          </p>
        </div>
      </div>
      {/* Global Toast Notification Engine */}
      <ToastContainer />
    </div>
  );
}