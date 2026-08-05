"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import ToastContainer from "@/components/Toast";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [role, setRole] = useState("admin");
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // 1. Check Authentication Guard
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
      const userRole = localStorage.getItem("user_role");

      if (!isLoggedIn || !userRole) {
        setAuthorized(false);
        router.replace("/login");
        return;
      }

      setAuthorized(true);
      setRole(userRole);
    };

    checkAuth();

    // Listen to browser Back/Forward navigation buttons (popstate event)
    window.addEventListener("popstate", checkAuth);
    const handleRoleChange = () => setRole(localStorage.getItem("user_role") || "admin");
    window.addEventListener("roleChanged", handleRoleChange);

    return () => {
      window.removeEventListener("popstate", checkAuth);
      window.removeEventListener("roleChanged", handleRoleChange);
    };
  }, [pathname, router]);

  // Prevent flash of protected content before auth clearance completes
  if (!authorized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white p-6 text-center">
        <div className="flex items-center gap-3 text-xs font-black tracking-wider uppercase bg-slate-800 px-5 py-3 rounded-2xl border border-slate-700 shadow-xl">
          <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
          <span>Authentication Guard Active • Redirecting to Login...</span>
        </div>
      </div>
    );
  }

  const isAdminRole = role === "admin" || role === "hr" || role === "manager" || role === "accounts";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex">
      {/* Sidebar (Rendered for Admin roles with toggle state) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area (Dynamic padding when sidebar toggled) */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
        isAdminRole 
          ? (sidebarOpen ? "md:pl-64" : "md:pl-0") 
          : "pl-0"
      }`}>
        <Navbar isSidebarOpen={sidebarOpen} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Toast Notification System */}
      <ToastContainer />
    </div>
  );
}
