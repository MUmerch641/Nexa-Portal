"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { dbFetch } from "@/lib/dbPersistence";
import { showToast } from "@/components/Toast";
import { fetchRecentActivities, formatTimeAgo, clearActivityLogs } from "@/lib/activityUtils";
import FinancialChart from "@/components/FinancialChart";
import {
  FaUsers,
  FaCalendarCheck,
  FaMoneyBillWave,
  FaProjectDiagram,
  FaUserPlus,
  FaCheckCircle,
  FaGraduationCap,
  FaUserTie,
  FaTasks,
  FaLock,
  FaShieldAlt,
  FaLandmark,
  FaPaperPlane,
  FaBell,
  FaExclamationTriangle,
  FaHistory,
  FaClock
} from "react-icons/fa";

export default function DashboardPage() {
  const [role, setRole] = useState("admin");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    employees: 0,
    activeProjects: 0,
    monthlyRevenue: 0,
    pendingLeaves: 0,
  });

  const [liveAttendanceList, setLiveAttendanceList] = useState([]);
  const [projectsProgressList, setProjectsProgressList] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshFeed = async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchRecentActivities();
      setRecentActivities([...(data || [])]);
      await loadDashboardData();
      await loadAllMembers();
      showToast("Feed Synced 🔄", "Recent activity feed & system stats refreshed successfully.", "info");
    } catch(e) {}
    setTimeout(() => setIsRefreshing(false), 400);
  };

  // Selected User Modal Inspection State
  const [selectedUserModal, setSelectedUserModal] = useState(null);
  const [userCategoryFilter, setUserCategoryFilter] = useState("all");
  const [allRegisteredUsersList, setAllRegisteredUsersList] = useState([]);

  // Assign Task Modal State
  const [assignTaskModal, setAssignTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    selectedUserEmail: "",
    title: "",
    description: "",
    priority: "High",
    dueDate: new Date().toISOString().split("T")[0],
  });

  // Read role from localStorage and listen to role changes
  useEffect(() => {
    const storedRole = localStorage.getItem("user_role") || "admin";
    setRole(storedRole);

    const handleRoleChange = () => {
      setRole(localStorage.getItem("user_role") || "admin");
    };

    window.addEventListener("roleChanged", handleRoleChange);
    return () => window.removeEventListener("roleChanged", handleRoleChange);
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      const currentYearMonth = new Date().toISOString().slice(0, 7);

      // Execute all dataset fetches in PARALLEL simultaneously instead of slow sequential calls
      const [allEmps, fullProjList, incList, leaveList, expList, liveTasks] = await Promise.all([
        dbFetch("employees").catch(() => []),
        dbFetch("projects").catch(() => []),
        dbFetch("incomes").catch(() => []),
        dbFetch("leaves").catch(() => []),
        dbFetch("expenses").catch(() => []),
        dbFetch("daily_tasks").catch(() => [])
      ]);

      const employeeCount = (allEmps || []).filter(e => (e.status || "").toLowerCase() !== "inactive" && (e.status || "").toLowerCase() !== "terminated").length;

      // Combine projects from DB fetch and local storage fallback
      let combinedProjects = Array.isArray(fullProjList) && fullProjList.length > 0 ? [...fullProjList] : [];
      try {
        const p1 = localStorage.getItem("software_house_full_projects");
        const p2 = localStorage.getItem("software_house_projects");
        const p3 = localStorage.getItem("software_house_client_projects");
        if (p1) combinedProjects = [...combinedProjects, ...JSON.parse(p1)];
        if (p2) combinedProjects = [...combinedProjects, ...JSON.parse(p2)];
        if (p3) combinedProjects = [...combinedProjects, ...JSON.parse(p3)];
      } catch(e) {}

      // Deduplicate projects by ID or title
      const uniqueProjMap = new Map();
      combinedProjects.forEach(p => {
        const key = p.id || p.title || p.name;
        if (key) uniqueProjMap.set(key, p);
      });
      let finalProjectsList = Array.from(uniqueProjMap.values());

      if (finalProjectsList.length === 0) {
        finalProjectsList = [
          { id: "p-101", title: "E-Commerce Mobile App & Web Store", status: "In Progress" },
          { id: "p-102", title: "AI Learning Portal & Student ERP", status: "Active" },
          { id: "p-103", title: "HRM & Automated Payroll Engine", status: "Active" },
          { id: "p-104", title: "Corporate Software House Web Portal", status: "In Progress" },
        ];
      }

      const activeProjectCount = finalProjectsList.filter(p => {
        const st = (p.status || p.currentStatus || "Active").toLowerCase();
        return !st.includes("completed") && !st.includes("archived") && !st.includes("cancelled");
      }).length || finalProjectsList.length;

      const monthlyRevenue = (incList || [])
        .filter(item => {
          const isCurrentMonth = item.date && item.date.startsWith(currentYearMonth);
          const isPaid = !item.status || item.status.toLowerCase() === "paid";
          return isCurrentMonth && isPaid;
        })
        .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

      const pendingLeavesCount = (leaveList || []).filter(l => (l.status || "").toLowerCase() === "pending").length;

      const totalExpensesAmount = (expList || []).reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
      const catMap = new Map();
      (expList || []).forEach(i => {
        const cat = i.category || "General Expense";
        const amt = Number(i.amount) || 0;
        catMap.set(cat, (catMap.get(cat) || 0) + amt);
      });
      const categoryBreakdown = Array.from(catMap.entries()).map(([category, amount]) => ({ category, amount }));

      const projData = (liveTasks || []).map(t => ({
        id: t.id,
        title: t.task || t.task_name,
        client_name: t.assignedTo || t.assigned_to || "Assigned Task",
        progress: t.status === "Completed" ? 100 : t.status === "In Progress" ? 50 : 20,
        status: t.status || "In Progress"
      }));

      setProjectsProgressList(projData || []);

      const savedEmpAtt = localStorage.getItem("today_attendance_employee");
      const savedStuAtt = localStorage.getItem("today_attendance_student");
      
      let combinedAttendance = [];
      if (savedEmpAtt) {
        try {
          const parsed = JSON.parse(savedEmpAtt);
          combinedAttendance = [...combinedAttendance, ...parsed.map(p => ({ ...p, role: "Employee" }))];
        } catch(e) {}
      }
      if (savedStuAtt) {
        try {
          const parsed = JSON.parse(savedStuAtt);
          combinedAttendance = [...combinedAttendance, ...parsed.map(p => ({ ...p, role: "Student" }))];
        } catch(e) {}
      }

      setLiveAttendanceList(combinedAttendance);

      setStats({
        employees: employeeCount,
        activeProjects: activeProjectCount,
        monthlyRevenue: monthlyRevenue,
        pendingLeaves: pendingLeavesCount,
        monthlyExpenses: totalExpensesAmount,
        categoryBreakdown: categoryBreakdown
      });
    } catch (err) {
      console.warn("Notice fetching stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all registered software house members across categories
  const loadAllMembers = useCallback(() => {
    try {
      const reg = localStorage.getItem("registered_system_users");
      const savedUsers = reg ? JSON.parse(reg) : [];

      const persistentEmps = JSON.parse(localStorage.getItem("persistent_employees") || "[]");
      const persistentStudents = JSON.parse(localStorage.getItem("persistent_courses") || "[]");
      const persistentInterns = JSON.parse(localStorage.getItem("persistent_internships") || "[]");

      const combinedMap = new Map();

      // Append persistent employees
      persistentEmps.forEach(e => {
        if (!e || !e.email) return;
        combinedMap.set(e.email.toLowerCase(), {
          id: e.id || `emp-${Date.now()}`,
          fullName: e.full_name,
          email: e.email,
          category: e.employment_type || "On-Site Staff",
          role: "employee",
          department: `${e.department} (${e.designation || 'Staff'})`,
          attendance: "Present Today 🟢",
          progress: "Assigned Software House Deliverables",
          dailyTask: "Logged daily work progress on assigned task.",
          feeStatus: "N/A (Paid Staff)",
        });
      });

      // Append persistent course students
      persistentStudents.forEach(s => {
        if (!s || !s.email) return;
        combinedMap.set(s.email.toLowerCase(), {
          id: s.id || `stu-${Date.now()}`,
          fullName: s.full_name,
          email: s.email,
          category: "Course Enrolled Student",
          role: "student",
          department: s.course_name || "MERN Stack Course",
          attendance: "Active Student 🟢",
          progress: `${s.progress || 45}% Course Completed`,
          dailyTask: "Submitted daily practical coding lab assignment.",
          feeStatus: s.fee_status || "Paid",
        });
      });

      // Append persistent interns
      persistentInterns.forEach(i => {
        if (!i || !i.email) return;
        combinedMap.set(i.email.toLowerCase(), {
          id: i.id || `int-${Date.now()}`,
          fullName: i.full_name,
          email: i.email,
          category: i.domain?.includes("Remote") ? "Remote 3-Month Intern" : "On-Site 3-Month Intern",
          role: "intern",
          department: i.domain || "Software Engineering Intern",
          attendance: "Present 🟢",
          progress: `${i.progress || 50}% Internship Milestone Completed`,
          dailyTask: i.task_logs?.[0]?.details || "Working on assigned project module.",
          feeStatus: "Free Internship",
        });
      });

      setAllRegisteredUsersList(Array.from(combinedMap.values()));
    } catch(e) {}
  }, []);

  useEffect(() => {
    // Unblock initial screen instantly
    setLoading(false);

    loadDashboardData();
    loadAllMembers();
    fetchRecentActivities().then(data => setRecentActivities(data || []));

    const handleUpdate = () => {
      loadDashboardData();
      loadAllMembers();
    };

    window.addEventListener("storage", handleUpdate);
    window.addEventListener("dataChanged", handleUpdate);
    window.addEventListener("activityLogged", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("dataChanged", handleUpdate);
      window.removeEventListener("activityLogged", handleUpdate);
    };
  }, [loadDashboardData, loadAllMembers]);

  // Strict Admin Guard: Non-admin users cannot see the Overview Dashboard
  if (role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm max-w-lg mx-auto my-12">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-2xl mb-4">
          <FaLock />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Admin Access Only</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-xs">
          The main system Overview Dashboard (Staff counts, Finances & Company Statistics) is strictly reserved for Admin view.
        </p>
        <div className="mt-6 flex flex-col gap-2.5 w-full max-w-xs">
          <Link
            href="/dashboard/projects"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-2xs text-center"
          >
            Go to My Projects Progress →
          </Link>
        </div>
        <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded-lg">
          <FaShieldAlt className="text-slate-500" />
          <span>Admin Access Guard Active</span>
        </div>
      </div>
    );
  }

  const filteredMembers = useMemo(() => {
    return allRegisteredUsersList.filter(u => {
      if (userCategoryFilter === "all") return true;
      if (userCategoryFilter === "employee") return u.role === "employee";
      if (userCategoryFilter === "student") return u.role === "student";
      if (userCategoryFilter === "intern") return u.role === "intern";
      if (userCategoryFilter === "remote") return u.category?.toLowerCase().includes("remote");
      if (userCategoryFilter === "onsite") return u.category?.toLowerCase().includes("site");
      return true;
    });
  }, [allRegisteredUsersList, userCategoryFilter]);

  const formatCurrency = useCallback((val) => {
    const num = Number(val) || 0;
    return `Rs. ${num.toLocaleString("en-PK")}`;
  }, []);

  const cards = useMemo(() => [
    { title: "Total Employees", value: stats.employees, icon: FaUsers, color: "text-blue-600" },
    { title: "Total Active Projects", value: stats.activeProjects, icon: FaProjectDiagram, color: "text-amber-600" },
    { title: "Monthly Revenue", value: formatCurrency(stats.monthlyRevenue), icon: FaMoneyBillWave, color: "text-emerald-600" },
    { title: "Pending Leaves", value: stats.pendingLeaves, icon: FaCalendarCheck, color: "text-rose-600" },
  ], [stats.employees, stats.activeProjects, stats.monthlyRevenue, stats.pendingLeaves, formatCurrency]);

  const quickActions = useMemo(() => [
    { label: "Add Employee", href: "/dashboard/employees", icon: FaUserPlus },
    { label: "Log Attendance", href: "/dashboard/attendance", icon: FaCalendarCheck },
    { label: "Finance & Accounts", href: "/dashboard/finance", icon: FaLandmark },
    { label: "Payroll & Payslips", href: "/dashboard/payroll", icon: FaMoneyBillWave },
    { label: "Projects Progress", href: "/dashboard/projects", icon: FaTasks },
  ], []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Control Overview</h1>
          <p className="text-sm text-slate-500 mt-1">
            Live Attendance Logs & Progress Feed for Software House Staff and Students
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAssignTaskModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-3 rounded-2xl text-xs transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer border border-blue-500"
        >
          <FaPaperPlane className="text-sm" />
          <span>Assign New Task</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {card.title}
                </p>
                <p className={`mt-2 text-2xl font-black ${card.color}`}>
                  {loading ? "..." : card.value}
                </p>
              </div>
              <div className="flex items-center justify-center p-2">
                <Icon className={`text-2xl ${card.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* FINANCIAL REVENUE & EXPENSE VISUAL CHARTS */}
      <FinancialChart
        revenue={stats.monthlyRevenue}
        expenses={stats.monthlyExpenses || 0}
        categoryData={stats.categoryBreakdown || []}
      />


      {/* Quick Actions */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
          Quick Management Portals
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {quickActions.map((action) => {
            const ActionIcon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-2xs"
              >
                <ActionIcon className="text-sm" />
                <span>{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* RECENT SYSTEM ACTIVITY FEED SECTION */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FaHistory className="text-sm" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Recent System Activity Feed</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time audit log of leave approvals, expenses, employee onboarding & project updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                await clearActivityLogs();
                handleRefreshFeed();
                showToast("Audit Logs Cleared 🗑️", "Recent activity history has been cleared.", "info");
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 transition-all cursor-pointer"
            >
              Clear Logs 🗑️
            </button>
            <button
              type="button"
              disabled={isRefreshing}
              onClick={handleRefreshFeed}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-1.5 rounded-xl border border-blue-200 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <span className={isRefreshing ? "animate-spin" : ""}>🔄</span>
              <span>{isRefreshing ? "Refreshing..." : "Refresh Feed"}</span>
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          {recentActivities.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-100">
              <FaHistory className="mx-auto text-2xl text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-600">No recent system activity recorded yet</p>
              <p className="text-[11px] text-slate-400 mt-1">Actions performed across portal modules will appear here automatically.</p>
            </div>
          ) : (
            recentActivities.slice(0, 5).map((act, idx) => (
              <div
                key={act.id || idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50/80 hover:bg-slate-100/70 border border-slate-200/80 transition-all gap-2"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="text-xl shrink-0">
                    {act.icon === "leave" ? <FaCalendarCheck className="text-emerald-600" /> :
                     act.icon === "expense" ? <FaMoneyBillWave className="text-amber-600" /> :
                     act.icon === "employee" ? <FaUsers className="text-blue-600" /> : <FaProjectDiagram className="text-purple-600" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">{act.user_name}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                        act.icon === "leave" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        act.icon === "expense" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        act.icon === "employee" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-purple-50 text-purple-700 border-purple-200"
                      }`}>
                        {act.action_type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{act.description}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center justify-end gap-1">
                    <FaClock className="text-[10px]" />
                    {formatTimeAgo(act.timestamp)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ALL REGISTERED USERS DIRECTORY & INSPECTION SECTION */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FaUsers className="text-blue-600" />
              <span>All Registered Members (Employees, Students & Interns)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any member to inspect full Attendance, Assigned Projects, and Progress Reports
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setUserCategoryFilter("all")}
              className={`px-3 py-1 rounded-lg transition-all ${userCategoryFilter === "all" ? "bg-white text-blue-700 font-bold shadow-2xs" : "hover:text-slate-900"}`}
            >
              All ({allRegisteredUsersList.length})
            </button>
            <button
              onClick={() => setUserCategoryFilter("employee")}
              className={`px-3 py-1 rounded-lg transition-all ${userCategoryFilter === "employee" ? "bg-white text-blue-700 font-bold shadow-2xs" : "hover:text-slate-900"}`}
            >
              Employees
            </button>
            <button
              onClick={() => setUserCategoryFilter("student")}
              className={`px-3 py-1 rounded-lg transition-all ${userCategoryFilter === "student" ? "bg-white text-blue-700 font-bold shadow-2xs" : "hover:text-slate-900"}`}
            >
              Course Students
            </button>
            <button
              onClick={() => setUserCategoryFilter("intern")}
              className={`px-3 py-1 rounded-lg transition-all ${userCategoryFilter === "intern" ? "bg-white text-blue-700 font-bold shadow-2xs" : "hover:text-slate-900"}`}
            >
              Interns
            </button>
            <button
              onClick={() => setUserCategoryFilter("onsite")}
              className={`px-3 py-1 rounded-lg transition-all ${userCategoryFilter === "onsite" ? "bg-white text-blue-700 font-bold shadow-2xs" : "hover:text-slate-900"}`}
            >
              On-Site
            </button>
            <button
              onClick={() => setUserCategoryFilter("remote")}
              className={`px-3 py-1 rounded-lg transition-all ${userCategoryFilter === "remote" ? "bg-white text-blue-700 font-bold shadow-2xs" : "hover:text-slate-900"}`}
            >
              Remote
            </button>
          </div>
        </div>

        {/* Members Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Member Name & Email</th>
                <th className="py-2.5 px-3">Role / Category</th>
                <th className="py-2.5 px-3">Department / Course</th>
                <th className="py-2.5 px-3">Today's Attendance</th>
                <th className="py-2.5 px-3 text-right">Inspect Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-slate-400 italic">
                    No members registered under this category yet.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => (
                  <tr
                    key={m.email}
                    onClick={() => setSelectedUserModal(m)}
                    className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900 text-xs">{m.fullName}</p>
                      <p className="font-mono text-[11px] text-slate-500">{m.email}</p>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${
                        m.role === "employee"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : m.role === "student"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}>
                        {m.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {m.department}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {m.attendance}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUserModal(m);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1 rounded-lg text-[11px] transition-all"
                      >
                        Inspect Details →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
      {/* DUAL SECTION: OVERALL PROGRESS & ACTIVE PROJECTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. Overall Progress Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <FaProjectDiagram className="text-sm" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Overall Company & Project Progress</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Real-time aggregate project milestone completion rate</p>
                </div>
              </div>

              {/* Live Status Indicator in Top-Right Corner */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs shrink-0">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-black tracking-wide">Live</span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Total Milestones Achieved Rate</span>
                <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                  {overallProgressPercentage}% Completed
                </span>
              </div>

              {/* Modern Animated Gradient Progress Bar */}
              <div className="relative w-full bg-slate-100 h-4 rounded-full overflow-hidden p-0.5 border border-slate-200 shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 transition-all duration-1000 ease-out shadow-sm relative overflow-hidden"
                  style={{ width: `${overallProgressPercentage}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer-pass" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <p className="text-[10px] font-bold uppercase text-blue-600">Active Workstreams</p>
                  <p className="text-base font-black text-slate-900 mt-0.5">{stats.activeProjects} Projects</p>
                </div>
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <p className="text-[10px] font-bold uppercase text-emerald-600">Quality Standard</p>
                  <p className="text-base font-black text-slate-900 mt-0.5">99.4% Verified</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <Link href="/dashboard/projects" className="text-xs font-bold text-blue-600 hover:underline">
              Inspect Full Deliverables & Sprint Roadmap →
            </Link>
          </div>
        </div>

        {/* 2. Active Projects Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FaProjectDiagram className="text-amber-600 text-base" />
                <h2 className="text-base font-bold text-slate-900">Active Projects Card</h2>
              </div>

              {/* Live Status Indicator in Top-Right Corner */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs shrink-0">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-black tracking-wide">Live</span>
              </div>
            </div>

            <div className="space-y-3">
              {projectsProgressList.length === 0 ? (
                <div className="py-10 text-center bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2">
                  <FaFolderOpen className="mx-auto text-3xl text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">No active projects.</p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    New projects assigned to staff or students will appear here automatically.
                  </p>
                </div>
              ) : (
                projectsProgressList.slice(0, 3).map((proj, idx) => {
                  const progress = proj.progress || 50;
                  return (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-900">{proj.title || proj.name || `Project #${proj.id}`}</p>
                        <span className="text-[11px] font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                          {progress}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden p-0.5">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Status: <strong>{proj.status || "In Progress"}</strong></span>
                        <span className="font-semibold text-slate-700">{proj.client_name || "Client Deal"}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <Link href="/dashboard/projects" className="text-xs font-bold text-blue-600 hover:underline">
              View All Projects & Milestones ({projectsProgressList.length} Total) →
            </Link>
          </div>
        </div>

      </div>

      {/* USER DETAIL INSPECTOR MODAL FOR ADMIN */}
      {selectedUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                  {selectedUserModal.category}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedUserModal.fullName}</h3>
                <p className="text-xs font-mono text-slate-500">{selectedUserModal.email}</p>
              </div>
              <button
                onClick={() => setSelectedUserModal(null)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-slate-400 font-bold uppercase text-[10px]">Department / Program</p>
                <p className="text-slate-900 font-bold text-sm mt-0.5">{selectedUserModal.department}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                  <p className="text-emerald-600 font-bold uppercase text-[10px]">Today's Attendance</p>
                  <p className="text-slate-900 font-bold text-xs mt-0.5">{selectedUserModal.attendance}</p>
                </div>

                <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
                  <p className="text-purple-600 font-bold uppercase text-[10px]">Fee / Financial Status</p>
                  <p className="text-slate-900 font-bold text-xs mt-0.5">{selectedUserModal.feeStatus}</p>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 space-y-1">
                <p className="text-blue-600 font-bold uppercase text-[10px]">Assigned Project & Completion Progress</p>
                <p className="text-slate-900 font-bold text-xs">{selectedUserModal.progress}</p>
              </div>

              <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl space-y-1">
                <p className="text-amber-400 font-bold uppercase text-[10px]">Recent Daily Work Progress Log</p>
                <p className="text-xs leading-relaxed italic">"{selectedUserModal.dailyTask}"</p>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedUserModal(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2 rounded-xl text-xs transition-all cursor-pointer"
              >
                Close Inspector Modal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN TASK TO INDIVIDUAL STUDENT OR EMPLOYEE MODAL */}
      {assignTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-blue-100 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                  <FaPaperPlane className="text-sm" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Assign New Task</h3>
                  <p className="text-xs text-blue-600 font-bold">Select individual Employee or Student</p>
                </div>
              </div>
              <button
                onClick={() => setAssignTaskModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!taskForm.selectedUserEmail || !taskForm.title) {
                  showToast("Validation Error", "Please select a user and enter task title.", "warning");
                  return;
                }

                const targetUser = allRegisteredUsersList.find(u => u.email.toLowerCase() === taskForm.selectedUserEmail.toLowerCase());
                const assignedObj = {
                  id: `task-${Date.now()}`,
                  title: taskForm.title,
                  description: taskForm.description,
                  priority: taskForm.priority,
                  dueDate: taskForm.dueDate,
                  assignedBy: "Admin",
                  assignedToEmail: taskForm.selectedUserEmail.toLowerCase().trim(),
                  assignedToName: targetUser?.fullName || taskForm.selectedUserEmail.split("@")[0],
                  userRole: targetUser?.role || "employee",
                  status: "Pending",
                  assignedAt: new Date().toISOString(),
                };

                // 1. Save to Global Assigned Tasks
                const existingGlobal = JSON.parse(localStorage.getItem("software_house_assigned_tasks") || "[]");
                localStorage.setItem("software_house_assigned_tasks", JSON.stringify([assignedObj, ...existingGlobal]));

                // 2. Save Notification to user's isolated inbox
                const notifKey = `user_notifications_${taskForm.selectedUserEmail.toLowerCase().trim()}`;
                const userNotifs = JSON.parse(localStorage.getItem(notifKey) || "[]");
                const newNotif = {
                  id: `notif-${Date.now()}`,
                  type: "task_assigned",
                  title: `New Task Assigned: ${taskForm.title}`,
                  message: taskForm.description || "Admin has assigned a new task to your dashboard.",
                  priority: taskForm.priority,
                  dueDate: taskForm.dueDate,
                  taskId: assignedObj.id,
                  read: false,
                  timestamp: new Date().toISOString(),
                };
                localStorage.setItem(notifKey, JSON.stringify([newNotif, ...userNotifs]));

                showToast("Task Assigned Successfully", `Task assigned to ${assignedObj.assignedToName}. Notification sent to their dashboard.`, "success");
                setAssignTaskModal(false);
                setTaskForm({
                  selectedUserEmail: "",
                  title: "",
                  description: "",
                  priority: "High",
                  dueDate: new Date().toISOString().split("T")[0],
                });
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Select Assignee (Employee or Student) *
                </label>
                <select
                  required
                  value={taskForm.selectedUserEmail}
                  onChange={(e) => setTaskForm({ ...taskForm, selectedUserEmail: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 font-bold bg-slate-50 cursor-pointer"
                >
                  <option value="">-- Select Member from List ({allRegisteredUsersList.length} Total) --</option>
                  <optgroup label="🧑‍💻 Employees / Staff">
                    {allRegisteredUsersList.filter(u => u.role === "employee").map(u => (
                      <option key={u.id} value={u.email}>
                        {u.fullName} ({u.email}) - {u.category}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🎓 Students & Interns">
                    {allRegisteredUsersList.filter(u => u.role === "student" || u.role === "intern").map(u => (
                      <option key={u.id} value={u.email}>
                        {u.fullName} ({u.email}) - {u.category}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Build Payment Integration / Complete Practice Lab 4"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Task Description & Deliverable Instructions
                </label>
                <textarea
                  rows="3"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Provide detailed instructions for the employee/student..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 font-medium"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 font-bold cursor-pointer"
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 text-[11px] text-blue-900 font-medium flex items-center gap-2">
                <FaBell className="text-blue-600 text-sm shrink-0" />
                <span>Assigning this task will instantly trigger an in-app notification on the user's personal dashboard.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignTaskModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <FaPaperPlane className="text-white text-xs" />
                  <span>Assign & Notify User</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
