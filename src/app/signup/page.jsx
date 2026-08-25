"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/Toast";
import { supabase } from "@/lib/supabase";
import { FaLock, FaEnvelope, FaUser, FaBuilding, FaArrowRight, FaShieldAlt } from "react-icons/fa";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) {
      showToast("Validation Error 🛑", "Please fill all required fields.", "error");
      return;
    }

    if (password.length < 6) {
      showToast("Password Error 🛑", "Password must be at least 6 characters.", "error");
      return;
    }

    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { full_name: fullName.trim(), role },
        },
      });

      if (error) throw error;

      if (data.session) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("user_role", role);
        localStorage.setItem("current_user_email", cleanEmail);
        localStorage.setItem("current_user_name", fullName.trim());
        showToast("Account Created 🎉", `Welcome ${fullName}! Logging you into the portal...`, "success");

        const destination = role === "admin"
          ? "/dashboard"
          : role === "employee"
            ? "/dashboard/employee"
            : role === "student"
              ? "/dashboard/student"
              : role === "intern"
                ? "/dashboard/internships"
                : "/dashboard";
        router.replace(destination);
      } else {
        showToast("Account Created 📧", "Check your email to confirm the account, then sign in from any device.", "success");
        router.replace("/login");
      }
    } catch (error) {
      showToast("Registration Failed 🔴", error.message || "Unable to create your account.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4">
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
                placeholder="Muhammad Ali"
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
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-xs text-[#0F172A] outline-none focus:border-[#2563EB] bg-white transition-colors"
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
            {loading ? "Setting up Account..." : "Create Account & Enter Portal"}
            <FaArrowRight className="text-xs" />
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-[#64748B] border-t border-[#E2E8F0]">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-[#2563EB] hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
