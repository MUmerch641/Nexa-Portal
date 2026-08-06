"use client";

import { useEffect, useState } from "react";
import { logout } from "@/lib/auth";
import { useRouter } from "next/navigation";
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
} from "react-icons/fa";

export default function Navbar({ onMenuClick, isSidebarOpen = true }) {
  const router = useRouter();
  const [role, setRole] = useState("admin");
  const [userEmail, setUserEmail] = useState("admin@gmail.com");
  
  // Admin Lists
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [pendingComplaints, setPendingComplaints] = useState([]);

  // Student & Employee Notifications List
  const [userAlerts, setUserAlerts] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasSeenNotifications, setHasSeenNotifications] = useState(false);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState(null);

  // Read leaves, complaints, announcements, and student/employee alerts
  const loadAllNotifications = () => {
    const currentRole = localStorage.getItem("user_role") || "admin";
    const email = localStorage.getItem("current_user_email") || "admin@gmail.com";

    try {
      const seen = localStorage.getItem(`notifications_seen_${email}_${currentRole}`);
      if (seen === "true") {
        setHasSeenNotifications(true);
      }
    } catch(e) {}

    // 1. Load Admin Action Items
    try {
      const savedLeaves = localStorage.getItem("software_house_leaves");
      if (savedLeaves) {
        const list = JSON.parse(savedLeaves);
        setPendingLeaves(list.filter(l => l.status === "pending"));
      } else {
        setPendingLeaves([
          { id: "1", employee_name: "Muhammad Rahim Bugti", type: "Emergency Leave", reason: "Family emergency medical checkup", start_date: "2026-08-01", end_date: "2026-08-01" }
        ]);
      }
    } catch(e) {}

    try {
      const savedComplaints = localStorage.getItem("software_house_complaints_list");
      if (savedComplaints) {
        const cList = JSON.parse(savedComplaints);
        setPendingComplaints(cList.filter(c => c.status === "Pending"));
      } else {
        setPendingComplaints([
          { id: "comp-101", submitted_by: "Ali Hassan (Student)", category: "Internet Issues", title: "Optix Fiber WiFi latency spike in Lab #3", created_at: "2026-08-01 10:30 AM" },
          { id: "comp-103", submitted_by: "Muhammad Rahim Bugti (Student)", category: "Teacher Complaints", title: "Request for extra lab session on Node.js REST APIs", created_at: "2026-08-01 11:00 AM" }
        ]);
      }
    } catch(e) {}

    // 2. Generate Student / Employee Automatic Notifications
    const alerts = [];

    // Check for Admin Broadcast Announcements in localStorage
    try {
      const savedAnn = localStorage.getItem("software_house_announcements_list");
      if (savedAnn) {
        const annList = JSON.parse(savedAnn);
        const todayStr = new Date().toISOString().split("T")[0];

        annList.forEach((ann) => {
          // Validate expiration
          if (ann.expiry_date && ann.expiry_date < todayStr) return;

          // Audience matching: All Users, Employees Only, Students Only, HR Department
          const target = (ann.target_audience || "All Users").toLowerCase();
          const roleLower = currentRole.toLowerCase();

          const isTargeted =
            target.includes("all") ||
            (target.includes("employee") && (roleLower.includes("employee") || roleLower.includes("staff") || roleLower.includes("admin"))) ||
            (target.includes("student") && (roleLower.includes("student") || roleLower.includes("course") || roleLower.includes("intern"))) ||
            (target.includes("hr") && (roleLower.includes("hr") || roleLower.includes("admin")));

          if (isTargeted) {
            alerts.unshift({
              id: `ann-${ann.id}`,
              type: ann.category || "Announcement",
              priority: ann.priority || "Urgent",
              icon: <FaBullhorn className="text-rose-500" />,
              title: `📢 ${ann.title}`,
              message: `${ann.content} (Target: ${ann.target_audience || "All Users"})`,
              link: "/dashboard/announcements",
              color: ann.priority === "Urgent" ? "bg-rose-50 border-rose-300 text-rose-950 font-extrabold" : "bg-blue-50 border-blue-200 text-blue-900 font-bold"
            });
          }
        });
      }
    } catch(e) {}

    // Read User-Specific Inbox Notifications (e.g. Tasks Assigned by Admin)
    try {
      const userNotifKey = `user_notifications_${email.toLowerCase().trim()}`;
      const savedUserNotifs = localStorage.getItem(userNotifKey);
      if (savedUserNotifs) {
        const userNotifList = JSON.parse(savedUserNotifs);
        userNotifList.forEach(n => {
          alerts.unshift({
            id: n.id,
            type: "Task Assigned",
            icon: <FaTasks className="text-blue-600" />,
            title: n.title,
            message: n.message,
            priority: n.priority,
            dueDate: n.dueDate,
            fullTaskObj: {
              title: n.title,
              description: n.message,
              priority: n.priority || "High",
              dueDate: n.dueDate || "Today",
              assignedBy: "Admin",
              assignedAt: n.timestamp ? new Date(n.timestamp).toLocaleString() : "Just now",
            },
            link: currentRole.includes("student") ? "/dashboard/student" : "/dashboard/projects",
            color: "bg-blue-50 border-blue-200 text-blue-900 font-bold"
          });
        });
      }
    } catch(e) {}

    if (currentRole === "student" || currentRole === "course_student") {
      // Fee Due Alert
      alerts.push({
        id: "alert-fee",
        type: "Fee Due",
        icon: <FaMoneyBillWave className="text-amber-500" />,
        title: "Monthly Course Fee Due Reminder 💳",
        message: "August 2026 tuition fee due Rs. 15,000. Pay before Aug 10 to avoid late fine.",
        link: "/dashboard/student",
        color: "bg-amber-50 border-amber-200 text-amber-900"
      });

      // New Task Assigned Alert
      alerts.push({
        id: "alert-task",
        type: "New Task",
        icon: <FaTasks className="text-blue-500" />,
        title: "New Practical Task Assigned 📋",
        message: "Admin assigned: 'Task 1: Next.js Auth & Dynamic Routing'. Due: Aug 8, 2026.",
        link: "/dashboard/student",
        color: "bg-blue-50 border-blue-200 text-blue-900"
      });

      // Leave Approval Alert
      alerts.push({
        id: "alert-leave",
        type: "Leave Approval",
        icon: <FaCheckCircle className="text-emerald-500" />,
        title: "Leave Application Approved ✅",
        message: "Your sick leave request for Aug 1, 2026 has been approved by HR.",
        link: "/dashboard/leaves",
        color: "bg-emerald-50 border-emerald-200 text-emerald-900"
      });

      // Meeting Reminder Alert
      alerts.push({
        id: "alert-meet",
        type: "Meeting Reminder",
        icon: <FaVideo className="text-purple-500" />,
        title: "Meeting Reminder 📹",
        message: "Sprint Planning & MERN Architecture Sync scheduled today at 10:30 AM.",
        link: "/dashboard/meetings",
        color: "bg-purple-50 border-purple-200 text-purple-900"
      });

      // Birthday Alert
      alerts.push({
        id: "alert-bday",
        type: "Birthdays",
        icon: <FaGift className="text-rose-500" />,
        title: "Happy Birthday Ali Hassan! 🎉",
        message: "The Software House team wishes you a fantastic birthday!",
        link: "/dashboard/student",
        color: "bg-rose-50 border-rose-200 text-rose-900"
      });
    }

    if (currentRole === "employee" || currentRole === "intern" || currentRole === "staff") {
      // Salary Day Alert
      alerts.push({
        id: "alert-salary",
        type: "Salary Day",
        icon: <FaMoneyBillWave className="text-emerald-500" />,
        title: "Salary Day Credit Alert 💰",
        message: "July Monthly Salary Rs. 85,000 processed & transferred to bank account.",
        link: "/dashboard/payroll",
        color: "bg-emerald-50 border-emerald-200 text-emerald-900"
      });

      // Project Deadline Alert
      alerts.push({
        id: "alert-proj",
        type: "Project Deadline",
        icon: <FaProjectDiagram className="text-indigo-500" />,
        title: "Project Milestone Deadline ⏳",
        message: "E-Commerce Mobile App API v2 release deadline approaching in 3 days.",
        link: "/dashboard/projects",
        color: "bg-indigo-50 border-indigo-200 text-indigo-900"
      });

      // Meeting Reminder Alert
      alerts.push({
        id: "alert-meet-emp",
        type: "Meeting Reminder",
        icon: <FaVideo className="text-purple-500" />,
        title: "Client Pitch & Standup Meeting 📹",
        message: "Join Google Meet at 02:00 PM for client demo walkthrough.",
        link: "/dashboard/meetings",
        color: "bg-purple-50 border-purple-200 text-purple-900"
      });

      // Birthday Alert
      alerts.push({
        id: "alert-bday-emp",
        type: "Birthdays",
        icon: <FaGift className="text-rose-500" />,
        title: "Staff Birthday Celebration 🎂",
        message: "Join us at 4:00 PM in cafeteria for cake cutting!",
        link: "/dashboard/employees",
        color: "bg-rose-50 border-rose-200 text-rose-900"
      });
    }

    setUserAlerts(alerts);
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

  const handleApprove = (id) => {
    try {
      const saved = localStorage.getItem("software_house_leaves");
      if (saved) {
        const list = JSON.parse(saved);
        const updated = list.map(l => l.id === id ? { ...l, status: "approved", salary_cut: false } : l);
        localStorage.setItem("software_house_leaves", JSON.stringify(updated));
      }
    } catch(e) {}
    loadAllNotifications();
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
    loadAllNotifications();
    window.dispatchEvent(new Event("storage"));
  };

  const handleToggleNotifications = () => {
    const nextState = !showNotifications;
    setShowNotifications(nextState);
    if (nextState) {
      setHasSeenNotifications(true);
      try {
        localStorage.setItem(`notifications_seen_${userEmail}_${role}`, "true");
      } catch (e) {}
    }
  };

  const handleMarkAllRead = () => {
    setHasSeenNotifications(true);
    setShowNotifications(false);
    try {
      localStorage.setItem(`notifications_seen_${userEmail}_${role}`, "true");
    } catch (e) {}
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const totalAdminCount = pendingLeaves.length + pendingComplaints.length;
  const totalUserCount = userAlerts.length;
  const isAdminRole = role === "admin" || role === "hr" || role === "manager" || role === "accounts";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger Icon is hidden when Sidebar is Open, and appears ONLY when Sidebar is closed/minimized */}
        {(!isSidebarOpen && isAdminRole) && (
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition-all border border-slate-200 cursor-pointer flex items-center gap-1.5 shadow-2xs"
            aria-label="Open Sidebar"
            title="Open Sidebar Menu"
          >
            <FaBars className="text-base text-blue-600" />
          </button>
        )}

        <img
          src="/logo.jpeg"
          alt="Logo"
          className="h-8 w-8 rounded-md object-cover border border-slate-200"
        />
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-tight">
            Nexa Innovation and Technology
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {role === "employee" ? "Employee Portal" : role === "student" ? "Student Portal" : "Admin Panel"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Universal Notification Bell for Admin, Students & Employees */}
        <div className="relative">
          <button
            onClick={handleToggleNotifications}
            className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            title="Live Notifications"
          >
            <FaBell className="text-lg text-amber-500" />
            {!hasSeenNotifications && (
              role === "admin" ? (
                totalAdminCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-extrabold text-white animate-pulse">
                    {totalAdminCount}
                  </span>
                )
              ) : (
                totalUserCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-extrabold text-white animate-pulse">
                    {totalUserCount}
                  </span>
                )
              )
            )}
          </button>

          {/* Notification Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-88 rounded-2xl bg-white p-4 shadow-2xl border border-slate-200 space-y-3 z-50">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <FaBell className="text-amber-500" />
                  <span>{role === "admin" ? "Admin Notifications Hub" : "Automatic Alert Notifications"}</span>
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  >
                    Mark Read
                  </button>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                    {role === "admin" ? `${totalAdminCount} Action Items` : `${totalUserCount} New Alerts`}
                  </span>
                </div>
              </div>

              {/* ADMIN NOTIFICATION DROPDOWN VIEW */}
              {role === "admin" ? (
                <div className="max-h-72 overflow-y-auto space-y-3 pr-1 text-xs">
                  {/* Pending Complaints */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-rose-700 text-[11px] bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                      <span className="flex items-center gap-1">
                        <FaExclamationTriangle className="text-rose-600" />
                        <span>Pending Complaints ({pendingComplaints.length})</span>
                      </span>
                      <Link href="/dashboard/complaints" onClick={() => setShowNotifications(false)} className="underline text-[10px]">View All</Link>
                    </div>

                    {pendingComplaints.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic px-2">No pending complaints!</p>
                    ) : (
                      pendingComplaints.map((c) => (
                        <div key={c.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                          <div className="flex items-center justify-between font-bold text-slate-900 text-[11px]">
                            <span>{c.submitted_by}</span>
                            <span className="text-[9px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-extrabold">{c.category}</span>
                          </div>
                          <p className="text-[11px] text-slate-700 font-semibold line-clamp-1">"{c.title}"</p>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[9px] text-slate-400">{c.created_at}</span>
                            <Link
                              href="/dashboard/complaints"
                              onClick={() => setShowNotifications(false)}
                              className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded hover:bg-rose-700"
                            >
                              Resolve Ticket →
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Pending Leaves */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between font-bold text-blue-700 text-[11px] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                      <span className="flex items-center gap-1">
                        <FaCalendarPlus className="text-blue-600" />
                        <span>Pending Leaves ({pendingLeaves.length})</span>
                      </span>
                      <Link href="/dashboard/leaves" onClick={() => setShowNotifications(false)} className="underline text-[10px]">View All</Link>
                    </div>

                    {pendingLeaves.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic px-2">No pending leave applications!</p>
                    ) : (
                      pendingLeaves.map((l) => (
                        <div key={l.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                          <div className="flex items-center justify-between font-bold text-slate-900 text-[11px]">
                            <span>{l.employee_name}</span>
                            <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-extrabold">{l.type}</span>
                          </div>
                          <p className="text-[10px] text-slate-600 italic">"{l.reason}"</p>
                          
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleApprove(l.id)}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 rounded-lg text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <FaCheck /> Approve
                            </button>
                            <button
                              onClick={() => handleReject(l.id)}
                              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-1 rounded-lg text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <FaTimes /> Reject
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                /* STUDENT / EMPLOYEE AUTOMATIC ALERTS DROPDOWN VIEW */
                <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1 text-xs">
                  {userAlerts.map((alert) => (
                    <div key={alert.id} className={`p-3 rounded-xl border ${alert.color} space-y-1 transition-all`}>
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5 text-[11px]">
                          {alert.icon}
                          <span>{alert.title}</span>
                        </span>
                        <span className="text-[9px] uppercase tracking-wider font-extrabold opacity-75">{alert.type}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-700">{alert.message}</p>
                      <div className="pt-1.5 flex items-center justify-between">
                        {alert.type === "Meeting Reminder" ? (
                          <a
                            href="https://meet.google.com/xyz-abc-mno"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setShowNotifications(false)}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all shadow-xs"
                          >
                            <FaVideo /> <span>📹 Click & Join Meeting</span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-400">Notification Alert</span>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setShowNotifications(false);
                            setSelectedTaskDetail(alert.fullTaskObj || {
                              title: alert.title,
                              description: alert.message,
                              priority: alert.priority || "High",
                              dueDate: alert.dueDate || "Today",
                              assignedBy: "Admin",
                            });
                          }}
                          className="text-[10px] font-extrabold text-blue-600 hover:underline bg-blue-50 px-2 py-0.5 rounded border border-blue-200 cursor-pointer"
                        >
                          View Full Details →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

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
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                {role}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">{userEmail || "user@gmail.com"}</p>
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

      {/* FULL TASK DETAILS INSPECTOR POPUP MODAL */}
      {selectedTaskDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-blue-100 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-blue-600">
                <FaTasks className="text-xl text-blue-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Assigned Task Details</h3>
              </div>
              <button
                onClick={() => setSelectedTaskDetail(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-blue-600 tracking-wider">Task Title</span>
                <h4 className="text-sm font-black text-slate-900">{selectedTaskDetail.title}</h4>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Priority Level</span>
                  <p className="text-xs font-black text-blue-700 mt-0.5">{selectedTaskDetail.priority || "High"}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Due Date</span>
                  <p className="text-xs font-black text-rose-600 mt-0.5">{selectedTaskDetail.dueDate || "Today"}</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-900 text-white rounded-2xl space-y-1.5 shadow-sm">
                <span className="text-[10px] font-mono font-bold uppercase text-blue-400">Task Instructions & Deliverables</span>
                <p className="text-xs leading-relaxed text-slate-200">{selectedTaskDetail.description || "No specific instructions provided."}</p>
              </div>

              <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Assigned By: <strong>{selectedTaskDetail.assignedBy || "Admin"}</strong></span>
                <span>Assigned At: <strong>{selectedTaskDetail.assignedAt || "Recently"}</strong></span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedTaskDetail(null)}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer text-center"
              >
                Close Task Details
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}