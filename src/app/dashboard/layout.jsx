"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import ToastContainer, { showToast } from "@/components/Toast";
import { supabase } from "@/lib/supabase";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  // Default false so sidebar is hidden on first load
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [role, setRole] = useState(null);
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
    let active = true;
    const checkAuth = async () => {
      setAuthorized(false);
      setRole(null);

      // localStorage is editable in the browser, so it must never grant a role.
      // Verify the Supabase session and load the authoritative profile instead.
      const { data: { user } = {}, error: authError } = await supabase.auth.getUser();
      if (!active) return;
      if (authError || !user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("role, status")
        .eq("id", user.id)
        .maybeSingle();
      if (!active) return;

      if (profileError || !profile || profile.status !== "active") {
        if (!profileError && profile && profile.status !== "active") {
          await supabase.auth.signOut();
        }
        if (active) router.replace("/login");
        return;
      }

      const cleanRole = String(profile.role || "").toLowerCase().trim();
      const knownRoles = ["admin", "manager", "hr", "employee", "intern", "student", "client"];
      if (!knownRoles.includes(cleanRole)) {
        await supabase.auth.signOut();
        if (active) router.replace("/login");
        return;
      }

      // Keep the UI cache current for existing widgets. Route authorization
      // continues to use the verified profile above, never this cache.
      try {
        localStorage.setItem("user_role", cleanRole);
      } catch {
        // Dashboard access does not depend on browser storage.
      }
      window.dispatchEvent(new Event("roleChanged"));

      // Admin, HR, and Manager accounts have access to all dashboard routes.
      const isAdminUser = ["admin", "hr", "manager"].includes(cleanRole);

      if (isAdminUser) {
        if (!active) return;
        setAuthorized(true);
        setRole(cleanRole);
        return;
      }

      // RBAC Route Guarding for Direct URL Access Protection (Non-Admin Users)
      const adminOnlyPaths = [
        "/dashboard/employees",
        "/dashboard/courses",
        "/dashboard/finance",
        "/dashboard/settings",
        "/dashboard/settings/users",
        "/dashboard/payroll",
        "/dashboard/expenses",
        "/dashboard/clients"
      ];

      const currentPath = pathname ? pathname.replace(/\/$/, "") : "";
      const isAdminOnlyRoute = currentPath === "/dashboard" || adminOnlyPaths.some(
        (path) => currentPath === path || currentPath.startsWith(`${path}/`)
      );

      if (cleanRole === "employee") {
        if (isAdminOnlyRoute || currentPath === "/dashboard/student") {
          showToast("403 Forbidden 🛑", "Access Denied: You do not have permission to access this area. Redirecting to Employee Portal...", "error");
          router.replace("/dashboard/employee");
          return;
        }
      } else if (cleanRole === "student") {
        if (isAdminOnlyRoute || currentPath === "/dashboard/employee") {
          showToast("403 Forbidden 🛑", "Access Denied: You do not have permission to access this area. Redirecting to Student Portal...", "error");
          router.replace("/dashboard/student");
          return;
        }
      } else if (cleanRole === "intern") {
        if (isAdminOnlyRoute || currentPath === "/dashboard/employee") {
          showToast("403 Forbidden 🛑", "Access Denied. Redirecting to Internships Portal...", "error");
          router.replace("/dashboard/internships");
          return;
        }
      } else if (cleanRole === "client") {
        if (isAdminOnlyRoute) {
          showToast("403 Forbidden 🛑", "Redirecting to Client Portal...", "info");
          router.replace("/dashboard/client-portal");
          return;
        }
      }

      if (!active) return;
      setAuthorized(true);
      setRole(cleanRole);
    };

    checkAuth().catch(() => {
      if (!active) return;
      router.replace("/login");
    });

    // Recheck on sign-in, sign-out, and token refresh so stale browser role data
    // cannot keep someone in the dashboard after access changes.
    const { data: { subscription } = {} } = supabase.auth.onAuthStateChange(() => {
      queueMicrotask(() => {
        if (active) checkAuth().catch(() => active && router.replace("/login"));
      });
    });

    return () => {
      active = false;
      subscription?.unsubscribe();
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

  const isAdminRole = role === "admin" || role === "hr" || role === "manager";

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

