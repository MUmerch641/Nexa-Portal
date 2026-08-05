"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FaChartPie,
  FaUsers,
  FaCalendarCheck,
  FaUserClock,
  FaMoneyBillWave,
  FaWallet,
  FaGraduationCap,
  FaProjectDiagram,
  FaUserTie,
  FaTimes,
  FaLandmark,
  FaBuilding,
  FaFileAlt,
  FaLaptopCode,
  FaExclamationTriangle,
  FaVideo,
  FaTrophy,
  FaDesktop,
  FaBullhorn,
  FaChevronLeft,
  FaCogs
} from "react-icons/fa";

const adminMenus = [
  { name: "Overview Dashboard", href: "/dashboard", icon: FaChartPie },
  { name: "Company Settings & Branding", href: "/dashboard/settings", icon: FaCogs },
  { name: "Student Portal Dashboard", href: "/dashboard/student", icon: FaGraduationCap },
  { name: "Announcement Board", href: "/dashboard/announcements", icon: FaBullhorn },
  { name: "Remote Monitoring", href: "/dashboard/remote-monitoring", icon: FaDesktop },
  { name: "Performance & Ranking", href: "/dashboard/performance", icon: FaTrophy },
  { name: "Meeting Management", href: "/dashboard/meetings", icon: FaVideo },
  { name: "Complaint System", href: "/dashboard/complaints", icon: FaExclamationTriangle },
  { name: "Payroll, Payslips & Staff", href: "/dashboard/payroll", icon: FaWallet },
  { name: "Leave Approvals", href: "/dashboard/leaves", icon: FaUserClock },
  { name: "Attendance Control", href: "/dashboard/attendance", icon: FaCalendarCheck },
  { name: "Finance & Accounting", href: "/dashboard/finance", icon: FaLandmark },
  { name: "Clients & Deals", href: "/dashboard/clients", icon: FaBuilding },
  { name: "Projects Progress Feed", href: "/dashboard/projects", icon: FaProjectDiagram },
  { name: "Courses & Paid Students", href: "/dashboard/courses", icon: FaGraduationCap },
  { name: "3-Month Free Internships", href: "/dashboard/internships", icon: FaLaptopCode },
];

// Employee / Staff Menus
const employeeMenus = [
  { name: "My Dashboard & Staff Portal", href: "/dashboard/employees", icon: FaUserTie },
  { name: "Company Settings & Branding", href: "/dashboard/settings", icon: FaCogs },
  { name: "My Salary & Payslips", href: "/dashboard/payroll", icon: FaWallet },
  { name: "Announcement Board", href: "/dashboard/announcements", icon: FaBullhorn },
  { name: "Remote Work Monitor", href: "/dashboard/remote-monitoring", icon: FaDesktop },
  { name: "My Performance Score", href: "/dashboard/performance", icon: FaTrophy },
  { name: "Meeting Management", href: "/dashboard/meetings", icon: FaVideo },
  { name: "Complaint System", href: "/dashboard/complaints", icon: FaExclamationTriangle },
  { name: "My Projects Progress", href: "/dashboard/projects", icon: FaProjectDiagram },
  { name: "Leave Application", href: "/dashboard/leaves", icon: FaUserClock },
];

// Course Student Specific Menus
const courseStudentMenus = [
  { name: "Student Portal Dashboard", href: "/dashboard/student", icon: FaGraduationCap },
  { name: "Announcement Board", href: "/dashboard/announcements", icon: FaBullhorn },
  { name: "Remote Work Monitor", href: "/dashboard/remote-monitoring", icon: FaDesktop },
  { name: "Student Performance Score", href: "/dashboard/performance", icon: FaTrophy },
  { name: "Meeting Management", href: "/dashboard/meetings", icon: FaVideo },
  { name: "Complaint System", href: "/dashboard/complaints", icon: FaExclamationTriangle },
  { name: "Leave Application", href: "/dashboard/leaves", icon: FaUserClock },
];

// Intern Specific Menus
const internMenus = [
  { name: "My 3-Month Internship", href: "/dashboard/internships", icon: FaLaptopCode },
  { name: "Announcement Board", href: "/dashboard/announcements", icon: FaBullhorn },
  { name: "Remote Work Monitor", href: "/dashboard/remote-monitoring", icon: FaDesktop },
  { name: "My Performance Score", href: "/dashboard/performance", icon: FaTrophy },
  { name: "Meeting Management", href: "/dashboard/meetings", icon: FaVideo },
  { name: "Complaint System", href: "/dashboard/complaints", icon: FaExclamationTriangle },
  { name: "My Assigned Project", href: "/dashboard/projects", icon: FaProjectDiagram },
  { name: "Leave Application", href: "/dashboard/leaves", icon: FaUserClock },
];

const clientMenus = [
  { name: "My Client Portal Dashboard", href: "/dashboard/client-portal", icon: FaProjectDiagram },
];

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const [role, setRole] = useState("admin");

  useEffect(() => {
    const savedRole = localStorage.getItem("user_role") || "admin";
    setRole(savedRole);

    const handleRoleChange = () => {
      setRole(localStorage.getItem("user_role") || "admin");
    };

    window.addEventListener("roleChanged", handleRoleChange);
    return () => window.removeEventListener("roleChanged", handleRoleChange);
  }, []);

  const changeRole = (newRole) => {
    setRole(newRole);
    localStorage.setItem("user_role", newRole);
    window.dispatchEvent(new Event("roleChanged"));
  };

  const navItems =
    role === "admin"
      ? adminMenus
      : role === "client"
      ? clientMenus
      : role === "intern" || role === "internship"
      ? internMenus
      : role === "student" || role === "course_student" || role === "course"
      ? courseStudentMenus
      : employeeMenus;

  // Allow Sidebar for client role as well
  if (role !== "admin" && role !== "hr" && role !== "manager" && role !== "accounts" && role !== "client") {
    return null;
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col bg-blue-700 text-white shadow-xl transition-all duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-blue-600/50 px-5">
          <Link href="/dashboard" className="flex items-center gap-3">
            <img
              src="/logo.jpeg"
              alt="NEXA Logo"
              className="h-9 w-9 rounded-lg object-cover border border-white/20 shadow-xs"
            />
            <div>
              <span className="text-sm font-black tracking-tight text-white block leading-tight">
                NEXA
              </span>
              <span className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">
                Software House System
              </span>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-blue-100 hover:text-white hover:bg-blue-600/80 transition-all border border-blue-500/50 cursor-pointer flex items-center gap-1.5 shadow-sm"
            title="Close / Minimize Sidebar"
          >
            <FaTimes className="text-base" />
          </button>
        </div>

        {/* Role Indicator & Admin Role Switcher */}
        <div className="border-b border-blue-600/50 p-4 bg-blue-800/40">
          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-200 mb-1.5 flex items-center justify-between">
            <span>Portal View Mode</span>
            {role === "admin" && (
              <span className="text-[9px] bg-amber-400 text-slate-900 px-1.5 py-0.5 rounded font-extrabold">
                ADMIN
              </span>
            )}
          </div>

          {role === "admin" ? (
            <select
              value={role}
              onChange={(e) => changeRole(e.target.value)}
              className="w-full rounded-lg bg-blue-900/80 border border-blue-500/50 px-3 py-1.5 text-xs text-white outline-none font-medium cursor-pointer"
            >
              <option value="admin">Admin View Mode</option>
              <option value="employee">Student / Staff View Mode</option>
              <option value="client">Client View Mode</option>
            </select>
          ) : (
            <div className="flex items-center gap-2 text-xs font-bold text-white bg-blue-900/60 px-3 py-1.5 rounded-lg border border-blue-500/40">
              <FaUserTie className="text-amber-300" />
              <span>{role === "client" ? "Client Portal Mode" : "Student / Staff Mode"}</span>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-white text-blue-700 shadow-md font-bold"
                    : "text-blue-100 hover:bg-blue-600/70 hover:text-white"
                }`}
              >
                <Icon className={`text-base ${isActive ? "text-blue-700" : "text-blue-200"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-blue-600/50 p-4 text-center text-[11px] text-blue-200">
          <p>© 2026 Software House System</p>
        </div>
      </aside>
    </>
  );
}