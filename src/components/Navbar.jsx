"use client";

import { useEffect, useState } from "react";
import { logout } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaBars, FaSignOutAlt, FaUserTie, FaUser, FaBell, FaCheck, FaTimes, FaCalendarPlus } from "react-icons/fa";

export default function Navbar({ onMenuClick }) {
  const router = useRouter();
  const [role, setRole] = useState("admin");
  const [userEmail, setUserEmail] = useState("admin@gmail.com");
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Read leaves from localStorage / state
  const loadPendingLeaves = () => {
    try {
      const saved = localStorage.getItem("software_house_leaves");
      if (saved) {
        const list = JSON.parse(saved);
        setPendingLeaves(list.filter(l => l.status === "pending"));
      } else {
        setPendingLeaves([
          { id: "1", employee_name: "Muhammad Rahim Bugti", type: "Emergency Leave", reason: "Family emergency medical checkup", start_date: "2026-08-01", end_date: "2026-08-01" }
        ]);
      }
    } catch(e) {}
  };

  useEffect(() => {
    const currentRole = localStorage.getItem("user_role") || "admin";
    const email = localStorage.getItem("current_user_email") || "admin@gmail.com";
    setRole(currentRole);
    setUserEmail(email);
    loadPendingLeaves();

    const handleRoleChange = () => {
      setRole(localStorage.getItem("user_role") || "admin");
      setUserEmail(localStorage.getItem("current_user_email") || "admin@gmail.com");
      loadPendingLeaves();
    };

    window.addEventListener("roleChanged", handleRoleChange);
    window.addEventListener("storage", loadPendingLeaves);
    return () => {
      window.removeEventListener("roleChanged", handleRoleChange);
      window.removeEventListener("storage", loadPendingLeaves);
    };
  }, []);

  const handleApprove = (id) => {
    try {
      const saved = localStorage.getItem("software_house_leaves");
      if (saved) {
        const list = JSON.parse(saved);
        const updated = list.map(l => l.id === id ? { ...l, status: "approved", salary_cut: false } : l);
        localStorage.setItem("software_house_leaves", JSON.stringify(updated));
      }
    } catch(e) {}
    loadPendingLeaves();
    window.dispatchEvent(new Event("storage"));
  };

  const handleReject = (id) => {
    try {
      const saved = localStorage.getItem("software_house_leaves");
      if (saved) {
        const list = JSON.parse(saved);
        const updated = list.map(l => l.id === id ? { ...l, status: "rejected", salary_cut: true } : l);
        localStorage.setItem("software_house_leaves", JSON.stringify(updated));
      }
    } catch(e) {}
    loadPendingLeaves();
    window.dispatchEvent(new Event("storage"));
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 md:hidden"
          aria-label="Open Sidebar"
        >
          <FaBars className="text-lg text-blue-600" />
        </button>

        <img
          src="/logo.jpeg"
          alt="Logo"
          className="h-8 w-8 rounded-md object-cover border border-slate-200"
        />
        <div>
          <h2 className="text-base font-bold text-slate-800 leading-tight">
            Software Management
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {role === "employee" ? "Employee Portal" : "Admin Panel"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Admin Notification Bell for Pending Student & Staff Leave Applications */}
        {role === "admin" && (
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              title="Pending Student & Staff Leave Notifications"
            >
              <FaBell className="text-lg text-amber-500" />
              {pendingLeaves.length > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-extrabold text-white animate-pulse">
                  {pendingLeaves.length}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white p-4 shadow-2xl border border-slate-200 space-y-3 z-50">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FaCalendarPlus className="text-blue-600" />
                    <span>Pending Leave Applications</span>
                  </h4>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                    {pendingLeaves.length} Pending
                  </span>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {pendingLeaves.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No pending leave applications!</p>
                  ) : (
                    pendingLeaves.map((l) => (
                      <div key={l.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{l.employee_name}</span>
                          <span className="text-[10px] text-blue-600 font-semibold">{l.type}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 italic">"{l.reason}"</p>
                        <p className="text-[10px] text-slate-400">{l.start_date} to {l.end_date}</p>
                        
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleApprove(l.id)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 rounded-lg text-[11px] flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <FaCheck /> Approve
                          </button>
                          <button
                            onClick={() => handleReject(l.id)}
                            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-1 rounded-lg text-[11px] flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <FaTimes /> Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-slate-100 pt-2 text-center">
                  <Link
                    href="/dashboard/leaves"
                    onClick={() => setShowNotifications(false)}
                    className="text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    Go to Leave Approvals Portal →
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Logged-in User Live Profile Badge Dropdown */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold shadow-2xs ${
              role === "admin"
                ? "bg-amber-100 text-amber-800 border border-amber-300"
                : role === "client"
                ? "bg-sky-100 text-sky-800 border border-sky-300"
                : "bg-emerald-100 text-emerald-800 border border-emerald-300"
            }`}
          >
            {role === "admin" ? <FaUserTie className="text-sm" /> : <FaUser className="text-sm" />}
          </div>
          <div className="text-left hidden sm:block">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {role === "admin"
                  ? "Muhammad Rahim (Admin)"
                  : userEmail
                  ? userEmail.split("@")[0]
                  : "User Portal"}
              </p>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Active Session"></span>
            </div>
            <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
              <span className="capitalize text-blue-700 font-bold">{role === "admin" ? "System Admin" : role === "employee" ? "Web Developer / Student" : "Client"}</span>
              <span>•</span>
              <span className="text-[10px] font-mono text-slate-400">{userEmail}</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
          title="Sign Out"
        >
          <FaSignOutAlt />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}