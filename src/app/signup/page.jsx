"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { dbSaveRecord } from "@/lib/dbPersistence";
import Modal from "@/components/Modal";
import ToastContainer, { showToast } from "@/components/Toast";
import { FaLock, FaEnvelope, FaUser, FaBuilding, FaArrowRight, FaShieldAlt, FaSignInAlt } from "react-icons/fa";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanName = (fullName || "").trim();
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPassword = (password || "").trim();

    if (!cleanName || !cleanEmail || !cleanPassword) {
      showToast("Validation Error 🛑", "Please fill in all required fields.", "error");
      return;
    }

    if (cleanPassword.length < 6) {
      showToast("Password Error 🛑", "Password must be at least 6 characters long.", "error");
      return;
    }

    setLoading(true);

    try {
      // 1. Register with Supabase Auth Cloud
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
        options: {
          data: {
            full_name: cleanName,
            role: role,
          },
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
        },
      });

      if (authError) {
        setLoading(false);
        const msg = (authError.message || "").toLowerCase();
        if (msg.includes("already registered") || msg.includes("user already exists")) {
          showToast("Account Exists ⚠️", "An account with this email already exists. Please log in.", "warning");
          showAlert(
            "Account Already Exists ⚠️",
            `An account with email "${cleanEmail}" is already registered in the system.\n\nPlease proceed to the Sign In page to log into your portal.`,
            "warning"
          );
        } else {
          showToast("Registration Failed 🛑", authError.message || "Could not register account.", "error");
          showAlert("Registration Failed 🛑", authError.message || "An error occurred during account creation.", "error");
        }
        return;
      }

      const authUser = authData?.user;
      const authUserId = authUser?.id || `usr_${Date.now()}`;

      // 2. Persist user record in database
      if (role === "student") {
        const studentProfile = {
          student_id: `s-${Date.now()}`,
          auth_user_id: authUserId,
          full_name: cleanName,
          email: cleanEmail,
          course_name: "Full Stack MERN Web Development",
          role: "student",
          status: "active",
          created_at: new Date().toISOString(),
        };
        await dbSaveRecord("students", studentProfile).catch(() => {});
      } else if (role === "employee" || role === "admin" || role === "intern") {
        const employeeProfile = {
          employee_id: `emp-${Date.now()}`,
          auth_user_id: authUserId,
          full_name: cleanName,
          email: cleanEmail,
          role: role,
          department: role === "admin" ? "Administration" : "Software Engineering",
          status: "active",
          created_at: new Date().toISOString(),
        };
        await dbSaveRecord("employees", employeeProfile).catch(() => {});
      }

      // Also create profile record
      try {
        await supabase.from("profiles").upsert([
          {
            id: authUserId,
            full_name: cleanName,
            email: cleanEmail,
            role: role,
            updated_at: new Date().toISOString(),
          },
        ]);
      } catch (e) {}

      // Check if session was automatically established (email confirmations disabled or pre-confirmed)
      if (authData?.session) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("user_role", role);
        localStorage.setItem("current_user_email", cleanEmail);
        localStorage.setItem("current_user_name", cleanName);
        localStorage.setItem("current_user_id", authUserId);
        window.dispatchEvent(new Event("roleChanged"));

        setLoading(false);
        showToast("Account Created 🎉", `Welcome ${cleanName}! Accessing your ${role.toUpperCase()} Portal...`, "success");

        if (role === "student") {
          setTimeout(() => router.replace("/dashboard/student"), 800);
        } else if (role === "employee") {
          setTimeout(() => router.replace("/dashboard/employee"), 800);
        } else if (role === "intern") {
          setTimeout(() => router.replace("/dashboard/internships"), 800);
        } else {
          setTimeout(() => router.replace("/dashboard"), 800);
        }
      } else {
        // Confirmation email required
        setLoading(false);
        showToast("Verification Required ✉️", `Account created! Check ${cleanEmail} for confirmation.`, "success");
        showAlert(
          "Verification Email Sent ✉️",
          `Your account has been created successfully!\n\nWe sent a confirmation link to ${cleanEmail}.\nPlease click the link in your email to verify your account, then log in to access the portal.`,
          "success"
        );
      }
    } catch (err) {
      setLoading(false);
      console.error("Signup error:", err);
      showToast("Error", "An unexpected error occurred during signup. Please try again.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4">
      {/* Notification Modal */}
      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={closeModal}
      />

      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-[#E2E8F0] shadow-xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/20 text-xl font-black">
            <FaShieldAlt />
          </div>
          <h1 className="text-xl font-bold text-[#0F172A]">Create NEXA Account</h1>
          <p className="text-xs text-[#64748B]">Enterprise Management & Academic Portal</p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-[#0F172A] uppercase text-[10px]">Full Name *</label>
            <div className="relative">
              <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Muhammad Ali"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-xs text-[#0F172A] outline-none focus:border-[#2563EB] bg-white transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#0F172A] uppercase text-[10px]">Email Address *</label>
            <div className="relative">
              <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ali@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-xs text-[#0F172A] outline-none focus:border-[#2563EB] bg-white transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#0F172A] uppercase text-[10px]">Password *</label>
            <div className="relative">
              <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-xs text-[#0F172A] outline-none focus:border-[#2563EB] bg-white transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#0F172A] uppercase text-[10px]">Account Role *</label>
            <div className="relative">
              <FaBuilding className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-xs text-[#0F172A] outline-none focus:border-[#2563EB] bg-white transition-colors cursor-pointer"
              >
                <option value="student">🎓 Course Student</option>
                <option value="employee">👔 Staff / Engineer</option>
                <option value="intern">💼 Intern</option>
                <option value="admin">🛡️ Administrator</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Registering Account in Supabase...</span>
              </>
            ) : (
              <>
                <span>Create Account & Register</span>
                <FaArrowRight className="text-xs" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-[#64748B] border-t border-[#E2E8F0]">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-[#2563EB] hover:underline inline-flex items-center gap-1">
            <FaSignInAlt className="text-xs" /> Sign In here
          </Link>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
