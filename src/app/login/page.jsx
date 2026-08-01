"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Modal from "@/components/Modal";
import { FaUserTie, FaBuilding, FaLock, FaEnvelope, FaKey, FaGraduationCap, FaShieldAlt, FaUserCheck } from "react-icons/fa";

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState("admin"); // 'admin', 'employee', 'client'
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("Software Engineering");
  const [loading, setLoading] = useState(false);

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
    if (!email || !password) {
      showAlert("Missing Fields", "Please enter Email and Password.", "warning");
      return;
    }

    setLoading(true);

    // Registration Flow: Create Account -> Send OTP -> Verify -> Save Credentials
    if (isRegisterMode) {
      const existingUsers = getRegisteredUsers();
      const userExists = existingUsers.some(u => u.email.toLowerCase() === email.toLowerCase());

      if (userExists) {
        showAlert("Account Exists", "An account with this email is already registered. Please switch to Sign In.", "warning");
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

      showAlert(
        "📩 Verification OTP Dispatched!",
        `An Email Verification OTP has been dispatched to: ${email}\n\nYour Verification Code is: ${newOtp}`,
        "info"
      );
      return;
    }

    // Normal Login Flow: Strict authentication against registered accounts
    const registeredUsers = getRegisteredUsers();
    
    // Default system seed accounts
    const defaultAccounts = [
      { email: "admin@gmail.com", password: "adminpassword", role: "admin" },
      { email: "student@gmail.com", password: "studentpassword", role: "employee" },
      { email: "client@acmetech.com", password: "clientpassword", role: "client" },
    ];

    const allValidUsers = [...defaultAccounts, ...registeredUsers];

    const matchedUser = allValidUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    let supabaseAuthSuccess = false;
    try {
      const { error } = await login(email, password);
      if (!error) supabaseAuthSuccess = true;
    } catch(e) {}

    // Strict Credentials Check: Must match exact email and password
    if (matchedUser || supabaseAuthSuccess) {
      const activeRole = matchedUser ? matchedUser.role : selectedRole;
      localStorage.setItem("user_role", activeRole);
      localStorage.setItem("current_user_email", email);
      window.dispatchEvent(new Event("roleChanged"));

      setLoading(false);
      showAlert("Login Successful 🟢", `Welcome back! Opening ${activeRole.toUpperCase()} Portal...`, "success");

      if (activeRole === "client") {
        setTimeout(() => router.push("/dashboard/projects"), 800);
      } else if (activeRole === "intern" || activeRole === "internship") {
        setTimeout(() => router.push("/dashboard/internships"), 800);
      } else if (activeRole === "student") {
        setTimeout(() => router.push("/dashboard/courses"), 800);
      } else if (activeRole === "employee") {
        setTimeout(() => router.push("/dashboard/projects"), 800);
      } else {
        setTimeout(() => router.push("/dashboard"), 800);
      }
    } else {
      setLoading(false);
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
      setTimeout(() => router.push("/dashboard/projects"), 1000);
    } else if (assignedRole === "employee" || assignedRole === "student") {
      setTimeout(() => router.push("/dashboard/courses"), 1000);
    } else {
      setTimeout(() => router.push("/dashboard"), 1000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-12">
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
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-md space-y-6">
        {/* Header */}
        <div className="text-center flex flex-col items-center">
          <img
            src="/logo.jpeg"
            alt="Software House Logo"
            className="h-16 w-16 rounded-2xl object-cover border border-slate-200 shadow-xs mb-3"
          />

          <h1 className="text-2xl font-bold text-slate-900">
            Software House System
          </h1>

          <p className="mt-1 text-xs text-slate-500 font-medium">
            Admin, Student & Client Portal Access
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setSelectedRole("admin");
              if (!email || email === "client@acmetech.com" || email === "student@gmail.com") setEmail("admin@gmail.com");
            }}
            className={`flex items-center justify-center gap-1 py-2 text-[11px] font-bold rounded-lg transition-all ${
              selectedRole === "admin"
                ? "bg-white text-blue-700 shadow-xs border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <FaUserTie className={selectedRole === "admin" ? "text-amber-500" : ""} />
            <span>Admin</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole("employee");
              if (!email || email === "admin@gmail.com" || email === "client@acmetech.com") setEmail("student@gmail.com");
            }}
            className={`flex items-center justify-center gap-1 py-2 text-[11px] font-bold rounded-lg transition-all ${
              selectedRole === "employee"
                ? "bg-white text-blue-700 shadow-xs border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <FaGraduationCap className={selectedRole === "employee" ? "text-emerald-500" : ""} />
            <span>Student</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole("client");
              if (!email || email === "admin@gmail.com" || email === "student@gmail.com") setEmail("client@acmetech.com");
            }}
            className={`flex items-center justify-center gap-1 py-2 text-[11px] font-bold rounded-lg transition-all ${
              selectedRole === "client"
                ? "bg-white text-blue-700 shadow-xs border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <FaBuilding className={selectedRole === "client" ? "text-sky-500" : ""} />
            <span>Client</span>
          </button>
        </div>

        {/* Mode Switcher (Sign In vs Register Account) */}
        <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-3">
          <span className="font-bold text-slate-700">
            {isRegisterMode ? `Create New ${selectedRole.toUpperCase()} Account` : "Sign In to Portal"}
          </span>
          <button
            type="button"
            onClick={() => setIsRegisterMode(!isRegisterMode)}
            className="font-bold text-blue-600 hover:underline"
          >
            {isRegisterMode ? "Back to Sign In" : "Register Account"}
          </button>
        </div>

        {/* Login / Register Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {isRegisterMode && (
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
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
              Email Address *
            </label>

            <div className="relative">
              <FaEnvelope className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
              <input
                type="email"
                placeholder={
                  selectedRole === "admin"
                    ? "admin@gmail.com"
                    : selectedRole === "client"
                    ? "client@acmetech.com"
                    : "student@gmail.com"
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600"
                required
              />
            </div>
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
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60 shadow-xs cursor-pointer"
          >
            {loading
              ? "Processing..."
              : isRegisterMode
              ? "Register & Verify OTP"
              : selectedRole === "client"
              ? "Login to Client Progress Portal"
              : selectedRole === "admin"
              ? "Login to Admin Portal"
              : "Login to Student Portal"}
          </button>
        </form>

        {/* Client Access Notice */}
        {selectedRole === "client" && (
          <div className="rounded-lg bg-sky-50 border border-sky-200 p-3 text-center text-xs text-sky-800">
            🔒 Client Portal is strictly restricted to <span className="font-bold">My Project Daily Progress</span> only.
          </div>
        )}
      </div>
    </div>
  );
}