"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
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
  FaShieldAlt
} from "react-icons/fa";

export default function DashboardPage() {
  const [role, setRole] = useState("admin");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    employees: 0,
    students: 0,
    present: 0,
    salary: 0,
    projects: 0,
  });

  const [liveAttendanceList, setLiveAttendanceList] = useState([]);
  const [projectsProgressList, setProjectsProgressList] = useState([]);

  // Selected User Modal Inspection State
  const [selectedUserModal, setSelectedUserModal] = useState(null);
  const [userCategoryFilter, setUserCategoryFilter] = useState("all");
  const [allRegisteredUsersList, setAllRegisteredUsersList] = useState([]);

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

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      let employeeCount = 12;
      let studentCount = 24;
      let projectCount = 8;
      let projData = [];
      let attData = [];
      let totalSalary = 185000;

      try {
        const resEmp = await supabase.from("employees").select("*", { count: "exact", head: true });
        if (resEmp.count) employeeCount = resEmp.count;
      } catch(e) {}

      try {
        const resStu = await supabase.from("students").select("*", { count: "exact", head: true });
        if (resStu.count) studentCount = resStu.count;
      } catch(e) {}

      try {
        const resProj = await supabase.from("projects").select("*").order("id", { ascending: false });
        if (resProj.data && resProj.data.length > 0) {
          projData = resProj.data;
          projectCount = resProj.data.length;
        }
      } catch(e) {}

      try {
        const resAtt = await supabase.from("attendance").select("*");
        if (resAtt.data) attData = resAtt.data;
      } catch(e) {}

      setProjectsProgressList(projData || []);

      // 4. Attendance Today
      const savedEmpAtt = localStorage.getItem("today_attendance_employee");
      const savedStuAtt = localStorage.getItem("today_attendance_student");
      
      let combinedAttendance = attData || [];
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

      if (combinedAttendance.length === 0) {
        combinedAttendance = [
          { name: "Muhammad Rahim (Senior Developer)", role: "Employee / Staff", type: "check_in", timestamp: new Date().toISOString(), status: "On Time (Green)" },
          { name: "Ali Hassan (Web Dev Student)", role: "Student / Intern", type: "check_in", timestamp: new Date().toISOString(), status: "Slightly Late (Green)" },
          { name: "Sara Ahmed (UI/UX Student)", role: "Student / Intern", type: "check_in", timestamp: new Date().toISOString(), status: "Final Warning (Orange)" },
        ];
      }

      setLiveAttendanceList(combinedAttendance);

      // 5. Total Salary
      try {
        const { data: salaryData } = await supabase.from("salary").select("amount");
        if (salaryData && salaryData.length > 0) {
          totalSalary = salaryData.reduce((sum, item) => sum + Number(item.amount || 0), 0);
        }
      } catch(e) {}

      setStats({
        employees: employeeCount || 12,
        students: studentCount || 24,
        present: combinedAttendance.length,
        salary: totalSalary,
        projects: projectCount || 8,
      });
    } catch (err) {
      console.warn("Notice fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

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
          <Link
            href="/dashboard/attendance"
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs transition-all text-center"
          >
            Go to My Attendance →
          </Link>
        </div>
        <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded-lg">
          <FaShieldAlt className="text-slate-500" />
          <span>Admin Access Guard Active</span>
        </div>
      </div>
    );
  }

  // Fetch all registered software house members across categories
  const loadAllMembers = () => {
    try {
      const reg = localStorage.getItem("registered_system_users");
      const savedUsers = reg ? JSON.parse(reg) : [];

      const persistentEmps = JSON.parse(localStorage.getItem("persistent_employees") || "[]");
      const persistentStudents = JSON.parse(localStorage.getItem("persistent_courses") || "[]");
      const persistentInterns = JSON.parse(localStorage.getItem("persistent_internships") || "[]");

      const defaultMembers = [
        {
          id: "m-1",
          fullName: "Muhammad Rahim Bugti",
          email: "rahim.dev@gmail.com",
          category: "On-Site Staff (Full Time)",
          role: "employee",
          department: "Web Development (Senior Lead)",
          attendance: "Checked In (09:55 AM - On Time 🟢)",
          progress: "E-Commerce SaaS Web Portal & Mobile App (70% Complete)",
          dailyTask: "Integrated payment gateway API endpoints and Stripe webhooks.",
          feeStatus: "N/A (Paid Staff)",
        },
        {
          id: "m-2",
          fullName: "Ali Hassan",
          email: "student@gmail.com",
          category: "Course Enrolled Student",
          role: "student",
          department: "Full Stack MERN Development",
          attendance: "Checked In (10:08 AM - Slightly Late 🟢)",
          progress: "MERN Stack E-Commerce App (70% Complete)",
          dailyTask: "Completed responsive product catalog & cart checkout flow.",
          feeStatus: "Paid (Next Due: 30 Days Cycle Active)",
        },
        {
          id: "m-3",
          fullName: "Bilal Ahmed",
          email: "bilal.remote@gmail.com",
          category: "Remote 3-Month Intern",
          role: "intern",
          department: "Python & AI Engineering",
          attendance: "Checked In (10:02 AM - On Time 🟢)",
          progress: "AI Customer Support Chatbot System (90% Complete)",
          dailyTask: "Trained vector embeddings on knowledge base documentation.",
          feeStatus: "N/A (Free 3-Month Internship)",
        },
        {
          id: "m-4",
          fullName: "Sara Khan",
          email: "sara.design@gmail.com",
          category: "On-Site Staff (Part Time)",
          role: "employee",
          department: "UI/UX Design Lead",
          attendance: "Checked In (10:12 AM - On Time 🟢)",
          progress: "Mobile App Wireframes & Figma UI Kit (85% Complete)",
          dailyTask: "Finalized mobile drawer navigation and high-fidelity mockups.",
          feeStatus: "N/A (Paid Staff)",
        },
      ];

      const combinedMap = new Map();
      defaultMembers.forEach(m => combinedMap.set(m.email.toLowerCase(), m));

      // Append persistent employees
      persistentEmps.forEach(e => {
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
  };

  useEffect(() => {
    loadAllMembers();
  }, []);

  const filteredMembers = allRegisteredUsersList.filter(u => {
    if (userCategoryFilter === "all") return true;
    if (userCategoryFilter === "employee") return u.role === "employee";
    if (userCategoryFilter === "student") return u.role === "student";
    if (userCategoryFilter === "intern") return u.role === "intern";
    if (userCategoryFilter === "remote") return u.category?.toLowerCase().includes("remote");
    if (userCategoryFilter === "onsite") return u.category?.toLowerCase().includes("site");
    return true;
  });

  const cards = [
    { title: "Paid Employees Staff", value: stats.employees, icon: FaUsers, color: "text-blue-600" },
    { title: "Courses & Intern Students", value: stats.students, icon: FaGraduationCap, color: "text-purple-600" },
    { title: "Present Today (Live)", value: stats.present, icon: FaCalendarCheck, color: "text-emerald-600" },
    { title: "Active Client Projects", value: stats.projects, icon: FaProjectDiagram, color: "text-amber-600" },
  ];

  const quickActions = [
    { label: "Attendance Control", href: "/dashboard/attendance", icon: FaCheckCircle },
    { label: "Projects Progress", href: "/dashboard/projects", icon: FaTasks },
    { label: "Finance & Accounts", href: "/dashboard/finance", icon: FaMoneyBillWave },
    { label: "Add Employee", href: "/dashboard/employees", icon: FaUserPlus },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Admin Control Overview</h1>
        <p className="text-sm text-slate-500 mt-1">
          Live Attendance Logs & Progress Feed for Software House Staff and Students
        </p>
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
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 border border-slate-200">
                <Icon className={`text-xl ${card.color}`} />
              </div>
            </div>
          );
        })}
      </div>


      {/* Quick Actions */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
          Quick Management Portals
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
        </div>
      </div>

      {/* Dual Section: Live Attendance & Projects Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Live Student & Employee Attendance Feed */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FaCalendarCheck className="text-emerald-600" />
                <span>Student & Staff Live Attendance</span>
              </h2>
              <Link href="/dashboard/attendance" className="text-xs font-bold text-blue-600 hover:underline">
                Live Attendance Portal →
              </Link>
            </div>

            <div className="space-y-3">
              {liveAttendanceList.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No attendance recorded today yet.</p>
              ) : (
                liveAttendanceList.slice(0, 5).map((att, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg text-white font-bold text-xs ${att.role?.includes("Student") ? "bg-purple-600" : "bg-blue-600"}`}>
                        {att.role?.includes("Student") ? <FaGraduationCap /> : <FaUserTie />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{att.name || att.user_id || "Registered Member"}</p>
                        <p className="text-[11px] text-slate-500 capitalize">{att.role || "Employee Staff"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold ${att.type === "check_in" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                        {att.type === "check_in" ? "Checked In ✅" : "Checked Out 🔴"}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {att.timestamp ? new Date(att.timestamp).toLocaleTimeString() : "Today"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <Link href="/dashboard/attendance" className="text-xs font-semibold text-slate-600 hover:text-blue-600">
              View Full Live Attendance Logs ({liveAttendanceList.length} Total Records)
            </Link>
          </div>
        </div>

        {/* 2. Employee Projects Progress Feed */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FaProjectDiagram className="text-amber-600" />
                <span>Employee Projects Progress</span>
              </h2>
              <Link href="/dashboard/projects" className="text-xs font-bold text-blue-600 hover:underline">
                View All Projects →
              </Link>
            </div>

            <div className="space-y-3">
              {projectsProgressList.length === 0 ? (
                [
                  { name: "E-Commerce Mobile App & Admin Portal", progress: 85, developer: "Rahim Bugti (Senior Dev)", status: "In Progress" },
                  { name: "Hospital Management ERP System", progress: 60, developer: "Ali & Team", status: "Testing Phase" },
                  { name: "Real Estate Property Listing Portal", progress: 100, developer: "Muhammad Ali", status: "Completed ✅" },
                ].map((proj, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900">{proj.name}</p>
                      <span className="text-[11px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        {proj.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${proj.progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Dev: <strong>{proj.developer}</strong></span>
                      <span className="font-semibold text-slate-700">{proj.status}</span>
                    </div>
                  </div>
                ))
              ) : (
                projectsProgressList.slice(0, 3).map((proj, idx) => {
                  const progress = proj.progress || 50;
                  return (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-900">{proj.title || proj.name || `Project #${proj.id}`}</p>
                        <span className="text-[11px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          {progress}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-500"
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
            <Link href="/dashboard/projects" className="text-xs font-semibold text-slate-600 hover:text-blue-600">
              Manage Daily Project Milestones & Employee Deliverables
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
                className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1"
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
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2 rounded-xl text-xs transition-all"
              >
                Close Inspector Modal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
