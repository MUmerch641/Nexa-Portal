"use client";

import { useEffect, useState, useRef } from "react";
import { logout } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { dbSaveRecord, dbFetch } from "@/lib/dbPersistence";
import Modal from "@/components/Modal";
import { showToast } from "@/components/Toast";
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
  FaFileInvoiceDollar,
  FaCalendarAlt,
  FaClock,
  FaFileAlt,
  FaTimesCircle,
  FaShieldAlt,
  FaInfoCircle,
  FaUserGraduate
} from "react-icons/fa";

export default function Navbar({ onMenuClick, isSidebarOpen = true }) {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState("admin");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  
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

  // Detail Modals for Bell Notifications
  const [selectedLeaveModal, setSelectedLeaveModal] = useState(null);
  const [selectedComplaintModal, setSelectedComplaintModal] = useState(null);

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
      const email = localStorage.getItem("current_user_email") || "";
      const saved = localStorage.getItem(`dismissed_notifs_${email}`);
      if (saved) setDismissedNotifIds(JSON.parse(saved));
    } catch(e) {}
  }, [userEmail]);

  const loadAllNotifications = async () => {
    const DEFAULT_LEAVES = [
      {
        id: "leave-demo-1",
        employee_name: "Muhammad Rahim Bugti (Staff / Student)",
        applicant_name: "Muhammad Rahim Bugti (Staff / Student)",
        role: "student",
        type: "Sick Leave",
        leave_type: "Sick Leave",
        start_date: "2026-08-22",
        end_date: "2026-09-22",
        reason: "sick - doctor advised complete rest and medication",
        status: "pending",
        salary_cut: false,
        applied_at: "2026-08-22"
      }
    ];

    try {
      const savedLeaves = localStorage.getItem("software_house_leaves");
      if (savedLeaves) {
        const list = JSON.parse(savedLeaves);
        if (list.length > 0) {
          setPendingLeaves(list.filter(l => (l.status || "").toLowerCase() === "pending"));
        } else {
          setPendingLeaves(DEFAULT_LEAVES);
          localStorage.setItem("software_house_leaves", JSON.stringify(DEFAULT_LEAVES));
        }
      } else {
        setPendingLeaves(DEFAULT_LEAVES);
        localStorage.setItem("software_house_leaves", JSON.stringify(DEFAULT_LEAVES));
      }
    } catch(e) {}

    try {
      const savedComplaints = localStorage.getItem("software_house_complaints_list");
      if (savedComplaints) {
        const cList = JSON.parse(savedComplaints);
        setPendingComplaints(cList.filter(c => (c.status || "").toLowerCase() === "pending"));
      } else {
        setPendingComplaints([]);
      }
    } catch(e) {}

    // Async DB fetch sync
    try {
      const dbLeaves = await dbFetch("leaves", DEFAULT_LEAVES);
      if (Array.isArray(dbLeaves) && dbLeaves.length > 0) {
        const pending = dbLeaves.filter(l => (l.status || "").toLowerCase() === "pending");
        if (pending.length > 0) {
          setPendingLeaves(pending);
        }
      }
    } catch (e) {}
  };

  const handleApproveLeave = async (leaveId) => {
    try {
      const savedLeaves = JSON.parse(localStorage.getItem("software_house_leaves") || "[]");
      const target = savedLeaves.find(l => l.id === leaveId);
      const updated = savedLeaves.map(l => l.id === leaveId ? { ...l, status: "approved", salary_cut: false } : l);
      localStorage.setItem("software_house_leaves", JSON.stringify(updated));
      
      if (target) {
        await dbSaveRecord("leaves", { ...target, status: "approved", salary_cut: false }).catch(() => {});

        // Auto-mark attendance as On Leave (Approved) instead of Absent
        const applicantName = target.employee_name || target.applicant_name || "Applicant";
        const todayStr = new Date().toISOString().split("T")[0];
        const leaveDate = target.start_date || todayStr;
        const leaveAttRecord = {
          id: `att-leave-${Date.now()}`,
          user_id: applicantName,
          user_name: applicantName,
          user_role: target.role || "student",
          attendance_status: "On Leave (Approved)",
          type: "check_in",
          total_work_hours: "Leave Authorized",
          attendance_date: leaveDate,
          check_in_time: "Leave Approved",
          public_ip: "Leave / Off-Site",
          created_at: new Date().toISOString()
        };

        const savedAttLogs = JSON.parse(localStorage.getItem("software_house_master_attendance_logs") || "[]");
        const filteredLogs = savedAttLogs.filter(a => !(a.user_name === applicantName && a.attendance_date === leaveDate));
        const newAttLogs = [leaveAttRecord, ...filteredLogs];
        localStorage.setItem("software_house_master_attendance_logs", JSON.stringify(newAttLogs));

        const userEmailKey = (target.applicant_email || target.email || "").trim().toLowerCase();
        if (userEmailKey) {
          localStorage.setItem(`today_attendance_${userEmailKey}`, JSON.stringify([leaveAttRecord]));
        }

        await dbSaveRecord("attendance", leaveAttRecord).catch(() => {});
      }
      
      setPendingLeaves(updated.filter(l => (l.status || "").toLowerCase() === "pending"));
      setSelectedLeaveModal(null);
      showToast("Leave Approved 🟢", `Leave approved! Attendance marked as 'On Leave' (Not Absent).`, "success");
      window.dispatchEvent(new Event("storage"));
    } catch (e) {
      showToast("Error ⚠️", "Failed to update leave status.", "error");
    }
  };

  const handleRejectLeave = async (leaveId) => {
    try {
      const savedLeaves = JSON.parse(localStorage.getItem("software_house_leaves") || "[]");
      const target = savedLeaves.find(l => l.id === leaveId);
      const updated = savedLeaves.map(l => l.id === leaveId ? { ...l, status: "rejected", salary_cut: true } : l);
      localStorage.setItem("software_house_leaves", JSON.stringify(updated));
      
      if (target) {
        await dbSaveRecord("leaves", { ...target, status: "rejected", salary_cut: true }).catch(() => {});
      }
      
      setPendingLeaves(updated.filter(l => (l.status || "").toLowerCase() === "pending"));
      setSelectedLeaveModal(null);
      showToast("Leave Rejected 🔴", `Leave application rejected.`, "info");
      window.dispatchEvent(new Event("storage"));
    } catch (e) {
      showToast("Error ⚠️", "Failed to update leave status.", "error");
    }
  };

  useEffect(() => {
    const currentRole = localStorage.getItem("user_role") || "admin";
    const email = localStorage.getItem("current_user_email") || "";
    setRole(currentRole);
    setUserEmail(email);
    loadAllNotifications();

    const handleRoleChange = () => {
      setRole(localStorage.getItem("user_role") || "admin");
      setUserEmail(localStorage.getItem("current_user_email") || "");
      loadAllNotifications();
    };

    window.addEventListener("roleChanged", handleRoleChange);
    window.addEventListener("storage", loadAllNotifications);
    window.addEventListener("leaveSubmitted", loadAllNotifications);
    return () => {
      window.removeEventListener("roleChanged", handleRoleChange);
      window.removeEventListener("storage", loadAllNotifications);
      window.removeEventListener("leaveSubmitted", loadAllNotifications);
    };
  }, []);

  // Resolve the signed-in user's display name from Supabase/API data.
  useEffect(() => {
    let isMounted = true;

    const loadUserProfile = async () => {
      const storedEmail = (localStorage.getItem("current_user_email") || "").trim().toLowerCase();
      let resolvedEmail = storedEmail;
      let resolvedName = "";

      // 1. Pehle localStorage mein stored name check karo (login ke waqt save hota hai)
      resolvedName = (localStorage.getItem("current_user_name") || "").trim();

      // 2. Agar nahi mila to employees/students/interns local data mein dhundho
      if (!resolvedName && resolvedEmail) {
        try {
          const emps = JSON.parse(localStorage.getItem("persistent_employees") || "[]");
          const matched = emps.find(e => (e.email || "").toLowerCase().trim() === resolvedEmail);
          if (matched) resolvedName = matched.full_name || matched.name || "";
        } catch (e) {}
      }

      if (!resolvedName && resolvedEmail) {
        try {
          const stus = JSON.parse(localStorage.getItem("persistent_courses") || "[]");
          const matched = stus.find(s => (s.email || "").toLowerCase().trim() === resolvedEmail);
          if (matched) resolvedName = matched.full_name || matched.name || "";
        } catch (e) {}
      }

      if (!resolvedName && resolvedEmail) {
        try {
          const ints = JSON.parse(localStorage.getItem("persistent_interns") || "[]");
          const matched = ints.find(i => (i.email || "").toLowerCase().trim() === resolvedEmail);
          if (matched) resolvedName = matched.full_name || matched.name || "";
        } catch (e) {}
      }

      // 3. Supabase auth metadata check karo
      if (!resolvedName) {
        try {
          const { data } = await supabase.auth.getUser();
          const authUser = data?.user;
          if (authUser?.email) resolvedEmail = authUser.email.trim().toLowerCase();
          resolvedName = authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || "";
        } catch (e) {}
      }

      // 4. Last resort — email se name banana
      if (!resolvedName && resolvedEmail) {
        resolvedName = resolvedEmail.split("@")[0].replace(/[._-]+/g, " ");
      }

      if (isMounted) {
        setUserEmail(resolvedEmail);
        setUserName(resolvedName);
      }
    };

    loadUserProfile();
    window.addEventListener("roleChanged", loadUserProfile);
    window.addEventListener("storage", loadUserProfile);

    return () => {
      isMounted = false;
      window.removeEventListener("roleChanged", loadUserProfile);
      window.removeEventListener("storage", loadUserProfile);
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

  const getUserInitials = (name, email) => {
    const source = name || email.split("@")[0] || "User";
    const nameParts = source.trim().split(/\s+/);
    if (nameParts.length >= 2) return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    const fallbackName = source;
    const parts = fallbackName.split(/[\._-]/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return fallbackName.slice(0, 2).toUpperCase();
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

        {isAdminRole && pathname !== "/dashboard" && (
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 text-xs font-bold transition-all shadow-xs"
            title="Return to Main Admin Dashboard"
          >
            <span>← Back to Admin</span>
          </Link>
        )}
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
            <div className="absolute right-0 mt-2 w-96 rounded-2xl bg-white p-4 shadow-xl border border-[#E2E8F0] space-y-3 z-50 animate-in fade-in zoom-in-95 duration-150 text-[#0F172A]">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                    <FaBell className="text-xs" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A]">Notification Center</h4>
                    <p className="text-[10px] text-[#64748B]">Pending leaves & complaints</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB] px-2 py-0.5 rounded-full border border-[#2563EB]/20">
                  {totalAdminCount} Pending
                </span>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0] text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveNotifCategory("all")}
                  className={`flex-1 py-1 rounded-lg text-center transition-all cursor-pointer ${
                    activeNotifCategory === "all" ? "bg-white text-[#2563EB] shadow-xs" : "text-[#64748B]"
                  }`}
                >
                  All ({totalAdminCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveNotifCategory("leaves")}
                  className={`flex-1 py-1 rounded-lg text-center transition-all cursor-pointer ${
                    activeNotifCategory === "leaves" ? "bg-white text-[#2563EB] shadow-xs" : "text-[#64748B]"
                  }`}
                >
                  Leaves ({activeLeaves.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveNotifCategory("complaints")}
                  className={`flex-1 py-1 rounded-lg text-center transition-all cursor-pointer ${
                    activeNotifCategory === "complaints" ? "bg-white text-[#2563EB] shadow-xs" : "text-[#64748B]"
                  }`}
                >
                  Complaints ({activeComplaints.length})
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2 pr-1 text-xs">
                {/* 1. Leaves Section */}
                {(activeNotifCategory === "all" || activeNotifCategory === "leaves") && activeLeaves.map((l) => {
                  const applicantName = l.applicant_name || l.employee_name || "Staff / Student";
                  const leaveType = l.leave_type || l.type || "Leave Request";
                  const startDate = l.start_date || "N/A";
                  const endDate = l.end_date || "N/A";
                  const reason = l.reason || "No reason provided";
                  const isStudent = l.role === "student" || (applicantName.toLowerCase().includes("student"));

                  return (
                    <div
                      key={l.id}
                      onClick={() => {
                        setSelectedLeaveModal(l);
                        setShowNotifications(false);
                      }}
                      className="p-3 rounded-xl bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#2563EB]/40 space-y-1.5 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between font-bold text-[#0F172A] text-xs">
                        <div className="flex items-center gap-1.5 truncate">
                          {isStudent ? (
                            <FaUserGraduate className="text-[#2563EB] shrink-0 text-xs" />
                          ) : (
                            <FaUserTie className="text-[#2563EB] shrink-0 text-xs" />
                          )}
                          <span className="truncate group-hover:text-[#2563EB] transition-colors">{applicantName}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-[#E2E8F0] text-[#475569]">
                            {isStudent ? "Student" : "Staff"}
                          </span>
                        </div>
                        <span className="text-[10px] bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/20 px-2 py-0.5 rounded-full font-bold shrink-0">
                          {leaveType}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-[#2563EB] font-medium">
                        <FaCalendarAlt className="text-[10px] text-[#64748B]" />
                        <span>{startDate} to {endDate}</span>
                      </div>

                      <p className="text-[11px] text-[#64748B] leading-snug line-clamp-2 italic">
                        "{reason}"
                      </p>

                      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-[#E2E8F0]/60">
                        <span className="text-amber-700 font-semibold flex items-center gap-1">
                          <FaClock className="text-[9px]" /> Pending HR Review
                        </span>
                        <span className="text-[#2563EB] font-bold group-hover:underline flex items-center gap-0.5">
                          Review Details & Action →
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* 2. Complaints Section */}
                {(activeNotifCategory === "all" || activeNotifCategory === "complaints") && activeComplaints.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedComplaintModal(c);
                      setShowNotifications(false);
                    }}
                    className="p-3 rounded-xl bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#2563EB]/40 space-y-1.5 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between font-bold text-[#0F172A] text-xs">
                      <span className="group-hover:text-[#2563EB] transition-colors">{c.submitted_by || "Anonymous"}</span>
                      <span className="text-[9px] bg-[#EFF6FF] text-[#2563EB] px-2 py-0.5 rounded-full font-bold">{c.category || "Complaint"}</span>
                    </div>
                    <p className="text-[11px] text-[#64748B] leading-snug line-clamp-2">"{c.title || c.description}"</p>
                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-[#E2E8F0]/60">
                      <span className="text-amber-700 font-semibold">{c.status || "Pending"}</span>
                      <span className="text-[#2563EB] font-bold group-hover:underline">View Ticket →</span>
                    </div>
                  </div>
                ))}

                {totalAdminCount === 0 && (
                  <div className="text-center py-8 space-y-1.5">
                    <FaCheckCircle className="mx-auto text-emerald-500 text-2xl" />
                    <p className="text-xs font-bold text-[#0F172A]">All caught up!</p>
                    <p className="text-[#64748B] text-[11px]">No pending leaves or complaints to review.</p>
                  </div>
                )}
              </div>

              {/* Bottom Hub Link */}
              <div className="border-t border-[#E2E8F0] pt-2 flex items-center justify-between text-[11px]">
                <Link
                  href="/dashboard/leaves"
                  onClick={() => setShowNotifications(false)}
                  className="font-bold text-[#2563EB] hover:underline flex items-center gap-1"
                >
                  <FaCalendarAlt className="text-[10px]" /> Go to Leaves Hub →
                </Link>
                <Link
                  href="/dashboard/complaints"
                  onClick={() => setShowNotifications(false)}
                  className="font-bold text-[#64748B] hover:text-[#0F172A] transition-colors"
                >
                  Complaints Hub
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#E2E8F0]">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB] text-xs font-bold border border-[#2563EB]/20">
            {getUserInitials(userName, userEmail)}
          </div>
          <div className="text-left hidden xl:block">
            <p className="text-xs font-bold text-[#0F172A] leading-tight">
              {userName || userEmail.split("@")[0] || "User"}
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

      {/* LEAVE DETAILS & APPROVAL MODAL FROM NOTIFICATION BELL */}
      {selectedLeaveModal && (
        <Modal
          isOpen={!!selectedLeaveModal}
          onClose={() => setSelectedLeaveModal(null)}
          title={`Leave Application — ${selectedLeaveModal.applicant_name || selectedLeaveModal.employee_name || "Applicant"}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[#EFF6FF] border border-[#2563EB]/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[#2563EB] tracking-wider">Leave Application Details</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/20 flex items-center gap-1">
                  <FaClock className="text-[9px]" /> Pending HR Review
                </span>
              </div>
              <h3 className="text-sm font-bold text-[#0F172A]">
                {selectedLeaveModal.applicant_name || selectedLeaveModal.employee_name || "Applicant Name"}
              </h3>
              <p className="text-[11px] text-[#64748B]">
                {selectedLeaveModal.applicant_email || selectedLeaveModal.email || "No email on record"} • {selectedLeaveModal.role === "student" || (selectedLeaveModal.applicant_name || "").toLowerCase().includes("student") ? "Enrolled Student" : "Staff Member"}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
              <div>
                <span className="text-[#64748B] block text-[10px] font-semibold uppercase">Leave Type</span>
                <strong className="text-[#0F172A] text-xs font-bold">{selectedLeaveModal.leave_type || selectedLeaveModal.type || "Casual Leave"}</strong>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px] font-semibold uppercase">Applied Date</span>
                <span className="text-[#0F172A] text-xs font-medium">{selectedLeaveModal.applied_at || selectedLeaveModal.created_at?.split("T")[0] || "Today"}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[#64748B] block text-[10px] font-semibold uppercase">Requested Date Range</span>
                <div className="flex items-center gap-2 mt-0.5 text-xs font-bold text-[#2563EB]">
                  <FaCalendarAlt className="text-xs" />
                  <span>{selectedLeaveModal.start_date || "N/A"}</span>
                  <span className="text-[#64748B] font-normal">to</span>
                  <span>{selectedLeaveModal.end_date || "N/A"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1 bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
              <span className="text-[#64748B] block text-[10px] font-semibold uppercase">Applicant Reason & Details:</span>
              <p className="text-xs text-[#0F172A] font-medium leading-relaxed italic bg-white p-2.5 rounded-lg border border-[#E2E8F0]">
                "{selectedLeaveModal.reason || "No details provided"}"
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleApproveLeave(selectedLeaveModal.id)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
                >
                  <FaCheckCircle className="text-xs" />
                  <span>Approve (No Salary Cut)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRejectLeave(selectedLeaveModal.id)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
                >
                  <FaTimesCircle className="text-xs" />
                  <span>Reject (Salary Cut)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLeaveModal(null)}
                className="px-4 py-2 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] font-semibold text-xs transition-colors cursor-pointer text-center"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* COMPLAINT DETAILS MODAL */}
      {selectedComplaintModal && (
        <Modal
          isOpen={!!selectedComplaintModal}
          onClose={() => setSelectedComplaintModal(null)}
          title={`Complaint / Feedback — ${selectedComplaintModal.submitted_by || "Anonymous"}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[#EFF6FF] border border-[#2563EB]/20 space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#2563EB] tracking-wider">Ticket Category: {selectedComplaintModal.category || "General"}</span>
              <h3 className="text-sm font-bold text-[#0F172A]">{selectedComplaintModal.title || "Complaint Title"}</h3>
              <p className="text-[11px] text-[#64748B]">Submitted By: {selectedComplaintModal.submitted_by || "Anonymous"}</p>
            </div>

            <div className="space-y-1 bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
              <span className="text-[#64748B] block text-[10px] font-semibold uppercase">Description:</span>
              <p className="text-xs text-[#0F172A] font-medium leading-relaxed bg-white p-2.5 rounded-lg border border-[#E2E8F0]">
                {selectedComplaintModal.description || selectedComplaintModal.title || "No description provided"}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <Link
                href="/dashboard/complaints"
                onClick={() => setSelectedComplaintModal(null)}
                className="px-4 py-2 rounded-xl bg-[#2563EB] text-white font-bold text-xs hover:bg-blue-700 transition-colors"
              >
                Open in Complaints Hub →
              </Link>
              <button
                type="button"
                onClick={() => setSelectedComplaintModal(null)}
                className="px-4 py-2 rounded-xl border border-[#E2E8F0] text-[#64748B] font-semibold text-xs hover:bg-[#F8FAFC]"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </header>
  );
}
