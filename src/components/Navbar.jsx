"use client";

import { useEffect, useState, useRef } from "react";
import { logout } from "@/lib/auth";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  FaBars,
  FaSignOutAlt,
  FaUserTie,
  FaUser,
  FaBell,
  FaCheck,
  FaTimes,
  FaCalendarPlus,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaGift,
  FaTasks,
  FaVideo,
  FaProjectDiagram,
  FaCheckCircle,
  FaBullhorn,
  FaSearch,
  FaGraduationCap,
  FaUsers,
  FaLandmark,
  FaFilter,
  FaFileInvoiceDollar
} from "react-icons/fa";

export default function Navbar({ onMenuClick, isSidebarOpen = true }) {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState("admin");
  const [userEmail, setUserEmail] = useState("admin@gmail.com");
  
  // Header Date
  const [currentDateStr, setCurrentDateStr] = useState("");

  // Global Search Modal State (Ctrl + K)
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const searchInputRef = useRef(null);

  // Admin Notifications Lists
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [pendingComplaints, setPendingComplaints] = useState([]);

  // Student & Employee Notifications List
  const [userAlerts, setUserAlerts] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasSeenNotifications, setHasSeenNotifications] = useState(false);
  const [dismissedNotifIds, setDismissedNotifIds] = useState([]);
  const [activeNotifCategory, setActiveNotifCategory] = useState("all");

  useEffect(() => {
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    setCurrentDateStr(new Date().toLocaleDateString('en-US', options));
  }, []);

  // Keyboard shortcut (Ctrl + K or Cmd + K) for Global Search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  // Global Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const q = searchQuery.toLowerCase().trim();
    const results = [];

    try {
      const emps = JSON.parse(localStorage.getItem("persistent_employees") || "[]");
      emps.forEach(e => {
        if (!e) return;
        const name = (e.full_name || e.name || "").toLowerCase();
        const email = (e.email || "").toLowerCase();
        const dept = (e.department || "").toLowerCase();
        if (name.includes(q) || email.includes(q) || dept.includes(q)) {
          results.push({
            id: `emp-${e.id || e.email}`,
            title: e.full_name || "Employee",
            subtitle: `${e.department || "Staff"} • ${e.email}`,
            category: "Employees",
            icon: FaUsers,
            link: "/dashboard/employees"
          });
        }
      });

      const stus = JSON.parse(localStorage.getItem("persistent_courses") || "[]");
      stus.forEach(s => {
        if (!s) return;
        const name = (s.full_name || s.name || "").toLowerCase();
        const email = (s.email || "").toLowerCase();
        const course = (s.course_name || "").toLowerCase();
        if (name.includes(q) || email.includes(q) || course.includes(q)) {
          results.push({
            id: `stu-${s.id || s.email}`,
            title: s.full_name || "Student",
            subtitle: `${s.course_name || "Course Student"} • ${s.email}`,
            category: "Students",
            icon: FaGraduationCap,
            link: "/dashboard/student"
          });
        }
      });

      const projs = JSON.parse(localStorage.getItem("software_house_assigned_tasks") || "[]");
      projs.forEach(p => {
        if (!p) return;
        const title = (p.title || p.task || "").toLowerCase();
        const assignee = (p.assignedToName || p.assignedToEmail || "").toLowerCase();
        if (title.includes(q) || assignee.includes(q)) {
          results.push({
            id: `proj-${p.id}`,
            title: p.title || p.task || "Project Task",
            subtitle: `Assigned to: ${p.assignedToName || p.assignedToEmail || "Team"}`,
            category: "Projects & Tasks",
            icon: FaProjectDiagram,
            link: "/dashboard/projects"
          });
        }
      });
    } catch(e) {}

    setSearchResults(results.slice(0, 8));
  }, [searchQuery]);

  useEffect(() => {
    try {
      const email = localStorage.getItem("current_user_email") || "admin@gmail.com";
      const saved = localStorage.getItem(`dismissed_notifs_${email}`);
      if (saved) setDismissedNotifIds(JSON.parse(saved));
    } catch(e) {}
  }, [userEmail]);

  const loadAllNotifications = () => {
    const currentRole = localStorage.getItem("user_role") || "admin";
    const email = localStorage.getItem("current_user_email") || "admin@gmail.com";

    try {
      const savedLeaves = localStorage.getItem("software_house_leaves");
      if (savedLeaves) {
        const list = JSON.parse(savedLeaves);
        setPendingLeaves(list.filter(l => l.status === "pending"));
      }
    } catch(e) {}

    try {
      const savedComplaints = localStorage.getItem("software_house_complaints_list");
      if (savedComplaints) {
        const cList = JSON.parse(savedComplaints);
        setPendingComplaints(cList.filter(c => c.status === "Pending"));
      }
    } catch(e) {}
  };

  useEffect(() => {
    const currentRole = localStorage.getItem("user_role") || "admin";
    const email = localStorage.getItem("current_user_email") || "admin@gmail.com";
    setRole(currentRole);
    setUserEmail(email);
    loadAllNotifications();

    const handleRoleChange = () => {
      setRole(localStorage.getItem("user_role") || "admin");
      setUserEmail(localStorage.getItem("current_user_email") || "admin@gmail.com");
      loadAllNotifications();
    };

    window.addEventListener("roleChanged", handleRoleChange);
    window.addEventListener("storage", loadAllNotifications);
    return () => {
      window.removeEventListener("roleChanged", handleRoleChange);
      window.removeEventListener("storage", loadAllNotifications);
    };
  }, []);

  const handleToggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const activeComplaints = pendingComplaints.filter(c => !dismissedNotifIds.includes(c.id));
  const activeLeaves = pendingLeaves.filter(l => !dismissedNotifIds.includes(l.id));
  const totalAdminCount = activeComplaints.length + activeLeaves.length;
  const isAdminRole = role === "admin" || role === "hr" || role === "manager" || role === "accounts";

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const getBreadcrumbTitle = () => {
    if (pathname === "/dashboard") return "Overview Dashboard";
    const segment = pathname.split("/").pop();
    if (!segment) return "Dashboard";
    return segment.charAt(0).toUpperCase() + segment.slice(1).replace("-", " ");
  };

  const getUserInitials = (email) => {
    if (!email) return "RB";
    const name = email.split("@")[0];
    const parts = name.split(/[\._-]/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E2E8F0] bg-white/95 backdrop-blur-md px-6">
      {/* Left: Hamburger & Breadcrumb */}
      <div className="flex items-center gap-4">
        {isAdminRole && (
          <button
            onClick={onMenuClick}
            className="rounded-xl p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors border border-[#E2E8F0] cursor-pointer flex items-center justify-center"
            aria-label="Toggle Sidebar"
          >
            <FaBars className="text-sm text-[#2563EB]" />
          </button>
        )}

        <div className="hidden sm:block">
          <div className="flex items-center gap-2 text-xs font-medium text-[#64748B]">
            <span>Nexa Portal</span>
            <span>/</span>
            <span className="text-[#2563EB] font-semibold">{getBreadcrumbTitle()}</span>
          </div>
          <h1 className="text-sm font-bold text-[#0F172A] leading-tight">
            Software House Management
          </h1>
        </div>
      </div>

      {/* Center: Global Search Bar (Ctrl + K) */}
      <div className="flex-1 max-w-md mx-6 hidden md:block">
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="w-full flex items-center justify-between bg-[#F8FAFC] hover:bg-white text-[#64748B] border border-[#E2E8F0] px-3.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <FaSearch className="text-[#64748B] group-hover:text-[#2563EB] transition-colors" />
            <span className="font-normal text-[#64748B]">Search employees, students, projects...</span>
          </div>
          <kbd className="hidden lg:inline-block bg-white text-[#64748B] font-mono text-[10px] font-semibold px-2 py-0.5 rounded border border-[#E2E8F0]">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Right: Date, Notifications, User Badge & Logout */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:block text-right pr-3 border-r border-[#E2E8F0]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">Today</p>
          <p className="text-xs font-bold text-[#0F172A]">{currentDateStr || "Aug 7, 2026"}</p>
        </div>

        {/* Global Search Mobile Button */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="md:hidden p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] cursor-pointer"
        >
          <FaSearch className="text-sm text-[#2563EB]" />
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={handleToggleNotifications}
            className="relative p-2 text-[#64748B] hover:bg-[#F8FAFC] rounded-xl transition-colors border border-[#E2E8F0] cursor-pointer"
            title="Notification Center"
          >
            <FaBell className="text-base text-[#2563EB]" />
            {totalAdminCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#2563EB] text-[10px] font-bold text-white">
                {totalAdminCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-88 rounded-2xl bg-white p-4 shadow-lg border border-[#E2E8F0] space-y-3 z-50 animate-in fade-in zoom-in-95 duration-150 text-[#0F172A]">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                <h4 className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                  <FaBell className="text-[#2563EB]" />
                  <span>Notifications</span>
                </h4>
                <span className="text-[10px] font-semibold bg-[#EFF6FF] text-[#2563EB] px-2 py-0.5 rounded-full">
                  {totalAdminCount} Items
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1 text-xs">
                {activeComplaints.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                    <div className="flex items-center justify-between font-semibold text-[#0F172A] text-[11px]">
                      <span>{c.submitted_by}</span>
                      <span className="text-[9px] bg-[#EFF6FF] text-[#2563EB] px-1.5 py-0.5 rounded font-bold">{c.category}</span>
                    </div>
                    <p className="text-[11px] text-[#64748B] leading-snug">"{c.title}"</p>
                  </div>
                ))}

                {activeComplaints.length === 0 && (
                  <p className="text-center py-6 text-[#64748B] italic text-[11px]">No new notifications.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#E2E8F0]">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB] text-xs font-bold border border-[#2563EB]/20">
            {getUserInitials(userEmail)}
          </div>
          <div className="text-left hidden xl:block">
            <p className="text-xs font-bold text-[#0F172A] leading-tight">
              {role === "admin" ? "Muhammad Rahim" : userEmail.split("@")[0]}
            </p>
            <p className="text-[10px] text-[#64748B] uppercase font-medium tracking-wider">{role}</p>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0] px-3 py-2 text-xs font-semibold transition-colors cursor-pointer"
          title="Sign Out"
        >
          <FaSignOutAlt className="text-xs text-[#64748B]" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>

      {/* GLOBAL SEARCH MODAL (Ctrl + K) */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 backdrop-blur-xs pt-20 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-4 shadow-xl border border-[#E2E8F0] space-y-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-[#E2E8F0] pb-3 px-2">
              <FaSearch className="text-[#2563EB] text-base" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employees, students, projects, tasks..."
                className="w-full text-sm font-semibold text-[#0F172A] outline-none placeholder:text-[#94A3B8] bg-transparent"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="text-[#64748B] text-xs font-mono font-semibold px-2 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg cursor-pointer"
              >
                ESC
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-1 text-xs">
              {!searchQuery.trim() ? (
                <div className="py-8 text-center text-[#64748B] font-medium space-y-1">
                  <p className="text-xs">Type any keyword to search across the system.</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-8 text-center text-[#64748B] italic">
                  No matching records found for "{searchQuery}".
                </div>
              ) : (
                searchResults.map((res) => {
                  const Icon = res.icon || FaSearch;
                  return (
                    <Link
                      key={res.id}
                      href={res.link}
                      onClick={() => setIsSearchOpen(false)}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-[#EFF6FF] border border-transparent hover:border-[#2563EB]/20 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                          <Icon className="text-sm" />
                        </div>
                        <div>
                          <p className="font-bold text-[#0F172A] group-hover:text-[#2563EB] text-xs">{res.title}</p>
                          <p className="text-[11px] text-[#64748B]">{res.subtitle}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider bg-[#EFF6FF] px-2 py-0.5 rounded-md">
                        {res.category}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}