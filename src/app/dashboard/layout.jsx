"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { resolveUserRoleAndProfile } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import ToastContainer, { showToast } from "@/components/Toast";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  // Default true so desktop loads with sidebar open immediately (no flash)
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [role, setRole] = useState("admin");
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // On mobile, close sidebar on first load
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    // Auto-close sidebar on mobile when navigating to a new page
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      let isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
      let userRole = localStorage.getItem("user_role");

      // If local storage is empty or needs refresh, check Supabase Auth Session
      if (!isLoggedIn || !userRole) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session && session.user) {
            const profile = await resolveUserRoleAndProfile(session.user);
            userRole = profile.role || "employee";
            isLoggedIn = true;

            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("user_role", userRole);
            localStorage.setItem("current_user_email", session.user.email);
            localStorage.setItem("current_user_name", profile.fullName || session.user.email.split("@")[0]);
            localStorage.setItem("current_user_id", session.user.id);
          }
        } catch (e) {}
      }

      if (!isLoggedIn || !userRole) {
        if (isMounted) {
          setAuthorized(false);
          router.replace("/login");
        }
        return;
      }

      // RBAC Route Guarding for Direct URL Access Protection
      const adminOnlyPaths = [
        "/dashboard",
        "/dashboard/employees",
        "/dashboard/courses",
        "/dashboard/finance",
        "/dashboard/settings",
        "/dashboard/payroll",
        "/dashboard/expenses",
        "/dashboard/clients"
      ];

      const currentPath = pathname ? pathname.replace(/\/$/, "") : "";

      if (userRole === "employee") {
        if (adminOnlyPaths.includes(currentPath) || currentPath === "/dashboard") {
          showToast("403 Forbidden 🛑", "Access Denied: Admin privileges required. Redirecting to Employee Portal...", "error");
          router.replace("/dashboard/employee");
          return;
        }
      } else if (userRole === "student") {
        if (adminOnlyPaths.includes(currentPath) || currentPath === "/dashboard") {
          showToast("403 Forbidden 🛑", "Access Denied: Admin privileges required. Redirecting to Student Portal...", "error");
          router.replace("/dashboard/student");
          return;
        }
      } else if (userRole === "intern") {
        if (adminOnlyPaths.includes(currentPath) || currentPath === "/dashboard") {
          showToast("403 Forbidden 🛑", "Access Denied. Redirecting to Internships Portal...", "error");
          router.replace("/dashboard/internships");
          return;
        }
      }

      if (isMounted) {
        setAuthorized(true);
        setRole(userRole);
      }
    };

    checkAuth();

    // Listen to Supabase Auth State changes & local storage events
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        if (isMounted) {
          setAuthorized(false);
          router.replace("/login");
        }
      }
    });

    window.addEventListener("popstate", checkAuth);
    const handleRoleChange = () => {
      const currentRole = localStorage.getItem("user_role") || "admin";
      setRole(currentRole);
    };
    window.addEventListener("roleChanged", handleRoleChange);

    return () => {
      isMounted = false;
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
      window.removeEventListener("popstate", checkAuth);
      window.removeEventListener("roleChanged", handleRoleChange);
    };
  }, [pathname, router]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-[#0F172A] p-6 text-center">
        <div className="flex items-center gap-3 text-xs font-bold uppercase bg-white px-5 py-3 rounded-2xl border border-[#E2E8F0] shadow-sm">
          <span className="w-4 h-4 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin"></span>
          <span>Security Guard Active • Verifying Permissions...</span>
        </div>
      </div>
    );
  }

  const isAdminRole = role === "admin" || role === "hr" || role === "manager" || role === "accounts";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
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