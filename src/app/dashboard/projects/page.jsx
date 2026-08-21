"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import Modal from "@/components/Modal";
import { showToast } from "@/components/Toast";
import { dbFetch, dbSaveList, dbSaveRecord } from "@/lib/dbPersistence";
import ScrollableTabs from "@/components/ScrollableTabs";
import {
  FaProjectDiagram,
  FaTasks,
  FaPlay,
  FaPause,
  FaCheckCircle,
  FaClock,
  FaPlusCircle,
  FaFolderOpen,
  FaFileAlt,
  FaStickyNote,
  FaUsers,
  FaTrash,
  FaPaperclip,
  FaCalendarAlt,
  FaChartLine,
  FaEye,
  FaEllipsisV,
  FaSearch,
  FaDownload,
  FaExclamationTriangle,
  FaFilter,
  FaLayerGroup,
  FaCheckDouble,
  FaHourglassHalf,
  FaChartPie
} from "react-icons/fa";

export default function ProjectsPage() {
  const [role, setRole] = useState("admin");
  const [userEmail, setUserEmail] = useState("");
  const [activeTab, setActiveTab] = useState("daily_tasks"); // "daily_tasks" | "projects"

  // 1. Daily Task Management State
  const [dailyTasks, setDailyTasks] = useState([]);
  const [projects, setProjects] = useState([]);

  // Search & Filter State
  const [taskSearch, setTaskSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selected Project Inspection Modal State
  const [selectedProjectModal, setSelectedProjectModal] = useState(null);

  // New Daily Task Modal State
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    task: "",
    category: "Development",
    targetType: "individual_student",
    assignedToName: "Ali Hassan (Student)",
    assignedToEmail: "student@gmail.com",
    priority: "High",
    dueDate: new Date().toISOString().split("T")[0]
  });

  // Kebab Menu & Confirm Modal State
  const [activeKebabId, setActiveKebabId] = useState(null);
  const [isHeaderKebabOpen, setIsHeaderKebabOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: "", taskId: "", title: "", loading: false });

  // Directories
  const [studentDirectory, setStudentDirectory] = useState([
    { name: "Ali Hassan", email: "student@gmail.com", batch: "Batch #14 (MERN Tech)" },
    { name: "Muhammad Rahim Bugti", email: "rahim.student@gmail.com", batch: "Batch #14 (MERN Tech)" },
    { name: "Hamza Ahmed", email: "hamza.student@gmail.com", batch: "Batch #15 (Python Tech)" },
    { name: "Usman Tariq", email: "usman.student@gmail.com", batch: "Batch #15 (Python Tech)" },
  ]);

  const [employeeDirectory, setEmployeeDirectory] = useState([
    { name: "Sara Khan", email: "sara.design@gmail.com", dept: "UI/UX Design" },
    { name: "Muhammad Ali", email: "ali.staff@gmail.com", dept: "Web Development" },
    { name: "Muhammad Rahim Bugti", email: "rahim.staff@gmail.com", dept: "Senior Full-Stack Developer" },
  ]);

  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info" });

  useEffect(() => {
    const savedRole = localStorage.getItem("user_role") || "admin";
    const savedEmail = localStorage.getItem("current_user_email") || "";
    setRole(savedRole);
    setUserEmail(savedEmail);

    dbFetch("daily_tasks", []).then(tasks => setDailyTasks(tasks || []));
    dbFetch("projects").then(projs => setProjects(projs || []));
  }, []);

  const saveTasksState = (newList) => {
    setDailyTasks(newList);
    dbSaveList("daily_tasks", newList);
  };

  // Live Timer Interval
  useEffect(() => {
    const interval = setInterval(() => {
      setDailyTasks((prevTasks) =>
        prevTasks.map((t) => (t.isTimerRunning ? { ...t, timerSeconds: (t.timerSeconds || 0) + 1 } : t))
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Safe Fallback Renderer
  const safeText = (val, fallback) => {
    if (!val || typeof val !== "string") return fallback;
    const clean = val.trim().toLowerCase();
    if (clean === "" || clean === "non" || clean === "none" || clean === "null" || clean === "undefined") {
      return fallback;
    }
    return val;
  };

  // Task Actions
  const handleStartTask = (id) => {
    const updated = dailyTasks.map((t) =>
      t.id === id
        ? {
            ...t,
            status: "In Progress",
            isTimerRunning: true,
            startTime: t.startTime || new Date().toISOString()
          }
        : t
    );
    saveTasksState(updated);
    showToast("Task Started ▶️", "Stopwatch active for task.", "info");
  };

  const handlePauseTask = (id) => {
    const updated = dailyTasks.map((t) =>
      t.id === id
        ? {
            ...t,
            status: "Paused",
            isTimerRunning: false,
            pauseTime: new Date().toISOString()
          }
        : t
    );
    saveTasksState(updated);
    showToast("Task Paused ⏸️", "Stopwatch paused.", "info");
  };

  const handleCompleteTask = (id) => {
    const updated = dailyTasks.map((t) =>
      t.id === id
        ? {
            ...t,
            status: "Completed",
            isTimerRunning: false,
            completionTime: new Date().toISOString()
          }
        : t
    );
    saveTasksState(updated);
    showToast("Task Completed ✔️", "Task marked as completed.", "success");
  };

  const executeConfirmedDelete = async () => {
    setConfirmModal(prev => ({ ...prev, loading: true }));

    if (confirmModal.type === "clear_all") {
      saveTasksState([]);
      try {
        localStorage.setItem("software_house_daily_tasks", JSON.stringify([]));
        localStorage.setItem("software_house_assigned_tasks", JSON.stringify([]));
        localStorage.setItem("student_daily_tasks", JSON.stringify([]));
      } catch(e) {}
      showToast("All Tasks Cleared 🗑️", "All task entries wiped clean permanently.", "info");
    } else if (confirmModal.type === "single_task") {
      const targetId = confirmModal.taskId;
      const updated = dailyTasks.filter(t => String(t.id) !== String(targetId));
      saveTasksState(updated);
      showToast("Task Deleted 🗑️", "Task permanently removed.", "info");
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("dataChanged"));
    }
    setConfirmModal({ isOpen: false, type: "", taskId: "", title: "", loading: false });
  };

  const handleCreateDailyTask = async (e) => {
    e.preventDefault();
    if (!newTaskForm.task.trim()) return;

    let newTasksToInsert = [];

    if (newTaskForm.targetType === "all_students") {
      newTasksToInsert = studentDirectory.map((st) => ({
        id: "dt-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        task: newTaskForm.task,
        assignedTo: `${st.name} (${st.batch})`,
        email: st.email.toLowerCase().trim(),
        targetAudience: "All Enrolled Students",
        status: "Pending",
        timerSeconds: 0,
        isTimerRunning: false,
        category: newTaskForm.category,
        priority: newTaskForm.priority,
        dueDate: newTaskForm.dueDate
      }));
    } else if (newTaskForm.targetType === "all_employees") {
      newTasksToInsert = employeeDirectory.map((emp) => ({
        id: "dt-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        task: newTaskForm.task,
        assignedTo: `${emp.name} (${emp.dept})`,
        email: emp.email.toLowerCase().trim(),
        targetAudience: "All Paid Staff Employees",
        status: "Pending",
        timerSeconds: 0,
        isTimerRunning: false,
        category: newTaskForm.category,
        priority: newTaskForm.priority,
        dueDate: newTaskForm.dueDate
      }));
    } else {
      newTasksToInsert = [
        {
          id: "dt-" + Date.now(),
          task: newTaskForm.task,
          assignedTo: newTaskForm.assignedToName,
          email: newTaskForm.assignedToEmail.toLowerCase().trim(),
          targetAudience: newTaskForm.targetType === "individual_student" ? "Individual Student" : "Individual Staff",
          status: "Pending",
          timerSeconds: 0,
          isTimerRunning: false,
          category: newTaskForm.category,
          priority: newTaskForm.priority,
          dueDate: newTaskForm.dueDate
        },
      ];
    }

    const updated = [...newTasksToInsert, ...dailyTasks];
    saveTasksState(updated);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("dataChanged"));
    }

    setCreateTaskModalOpen(false);
    setNewTaskForm({
      task: "",
      category: "Development",
      targetType: "individual_student",
      assignedToName: "Ali Hassan (Student)",
      assignedToEmail: "student@gmail.com",
      priority: "High",
      dueDate: new Date().toISOString().split("T")[0]
    });
    showToast("Task Assigned 📋", `Assigned '${newTaskForm.task}' to ${newTasksToInsert.length} user(s).`, "success");
  };

  const formatTimer = (totalSec = 0) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs > 0 ? hrs + "h " : ""}${mins}m ${secs}s`;
  };

  // Filtered Tasks for user view
  const userFilteredTasks = useMemo(() => {
    let list = dailyTasks.filter((t) => {
      if (role === "admin" || role === "hr" || role === "manager") return true;
      return t.email && t.email.toLowerCase() === userEmail.toLowerCase();
    });

    if (statusFilter !== "all") {
      list = list.filter(t => (t.status || "Pending").toLowerCase() === statusFilter.toLowerCase());
    }

    if (taskSearch.trim()) {
      const q = taskSearch.toLowerCase().trim();
      list = list.filter(t =>
        safeText(t.task || t.title, "Untitled Task").toLowerCase().includes(q) ||
        safeText(t.assignedTo, "Unassigned").toLowerCase().includes(q) ||
        safeText(t.category, "General").toLowerCase().includes(q)
      );
    }

    return list;
  }, [dailyTasks, role, userEmail, statusFilter, taskSearch]);

  // Analytics Metrics
  const taskAnalytics = useMemo(() => {
    const total = userFilteredTasks.length;
    const pending = userFilteredTasks.filter(t => t.status === "Pending").length;
    const inProgress = userFilteredTasks.filter(t => t.status === "In Progress" || t.status === "Paused").length;
    const completed = userFilteredTasks.filter(t => t.status === "Completed").length;
    const totalSecs = userFilteredTasks.reduce((sum, t) => sum + (t.timerSeconds || 0), 0);

    const completionRatePct = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      pending,
      inProgress,
      completed,
      totalSecs,
      completionRatePct
    };
  }, [userFilteredTasks]);

  // CSV Export for Tasks
  const handleExportTasksCsv = () => {
    let csv = "Task ID,Task Title,Category,Assigned To,Status,Time Tracked\n";
    userFilteredTasks.forEach(t => {
      csv += `"${t.id}","${safeText(t.task || t.title, "Untitled Task")}","${safeText(t.category, "General")}","${safeText(t.assignedTo, "Unassigned")}","${t.status || "Pending"}","${formatTimer(t.timerSeconds)}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tasks_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      
      {/* 1. CONSISTENT BLUE & WHITE HEADER BANNER */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-full border border-[#2563EB]/20">
              Operations & Task Workspace
            </span>
            <span className="text-[10px] font-semibold text-[#64748B] bg-[#F8FAFC] px-2.5 py-1 rounded-full border border-[#E2E8F0]">
              Live Stopwatch Active
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#0F172A] mt-1.5 flex items-center gap-2.5">
            <FaTasks className="text-[#2563EB]" />
            <span>Task Management & Project Control</span>
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Real-time daily task logger, live work stopwatch, and manager progress monitoring.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="shrink-0">
          <div className="flex items-center bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0] text-xs font-semibold">
            <button
              onClick={() => setActiveTab("daily_tasks")}
              className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === "daily_tasks"
                  ? "bg-white text-[#2563EB] font-bold shadow-xs border border-[#E2E8F0]"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              📋 Daily Tasks Logger
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === "projects"
                  ? "bg-white text-[#2563EB] font-bold shadow-xs border border-[#E2E8F0]"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              📁 Projects Directory ({projects.length})
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: DAILY TASK MANAGEMENT */}
      {activeTab === "daily_tasks" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN (70% - 8 COLS): TASK LIST & CONTROLS */}
          <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm space-y-4">
            
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                  <FaTasks className="text-[#2563EB]" />
                  <span>Today's Assigned Tasks</span>
                </h2>
                <p className="text-xs text-[#64748B]">Real-time work stopwatch and task completion desk.</p>
              </div>

              <div className="flex items-center gap-2">
                {(role === "admin" || role === "hr" || role === "manager") && (
                  <button
                    onClick={() => setCreateTaskModalOpen(true)}
                    className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <FaPlusCircle />
                    <span>+ Assign New Task</span>
                  </button>
                )}

                {/* Section More Actions (⋮) Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsHeaderKebabOpen(!isHeaderKebabOpen)}
                    className="p-2 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] border border-[#E2E8F0] transition-colors cursor-pointer"
                  >
                    <FaEllipsisV className="text-xs" />
                  </button>

                  {isHeaderKebabOpen && (
                    <div className="absolute right-0 mt-1 w-48 rounded-xl bg-white p-1.5 shadow-lg border border-[#E2E8F0] z-30 space-y-0.5 text-xs animate-in fade-in zoom-in-95 duration-100">
                      <button
                        onClick={() => {
                          handleExportTasksCsv();
                          setIsHeaderKebabOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[#EFF6FF] text-[#0F172A] hover:text-[#2563EB] font-semibold transition-colors flex items-center gap-2"
                      >
                        <FaDownload className="text-xs text-[#2563EB]" /> Export Tasks CSV
                      </button>

                      {(role === "admin" || role === "hr" || role === "manager") && (
                        <>
                          <div className="border-t border-[#E2E8F0] my-1" />
                          <button
                            onClick={() => {
                              setIsHeaderKebabOpen(false);
                              setConfirmModal({
                                isOpen: true,
                                type: "clear_all",
                                taskId: "",
                                title: "Clear All Workstream Tasks",
                                loading: false
                              });
                            }}
                            className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 font-semibold transition-colors flex items-center gap-2"
                          >
                            <FaTrash className="text-xs text-rose-600" /> Clear All Tasks
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0] text-xs font-semibold">
                {[
                  { id: "all", label: "All Tasks" },
                  { id: "pending", label: "Pending" },
                  { id: "in progress", label: "In Progress" },
                  { id: "completed", label: "Completed" }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStatusFilter(f.id)}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      statusFilter === f.id
                        ? "bg-white text-[#2563EB] font-bold shadow-xs border border-[#E2E8F0]"
                        : "text-[#64748B] hover:text-[#0F172A]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-60">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] text-xs" />
                <input
                  type="text"
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  placeholder="Search tasks or assignee..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs text-[#0F172A] border border-[#E2E8F0] rounded-xl outline-none focus:border-[#2563EB] bg-white font-medium"
                />
              </div>
            </div>

            {/* Task Cards List (With Null Safety & Context Aware Actions) */}
            <div className="space-y-3 pt-1">
              {userFilteredTasks.length === 0 ? (
                <div className="p-10 text-center bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto text-xl border border-[#2563EB]/20">
                    <FaCheckCircle />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A]">No tasks assigned for today! 🎉</h3>
                    <p className="text-xs text-[#64748B] max-w-sm mx-auto mt-0.5">
                      You're all caught up. New tasks will appear here when assigned to your account.
                    </p>
                  </div>
                  {(role === "admin" || role === "hr" || role === "manager") && (
                    <button
                      onClick={() => setCreateTaskModalOpen(true)}
                      className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      + Assign New Task
                    </button>
                  )}
                </div>
              ) : (
                userFilteredTasks.map((t, idx) => {
                  const safeTitle = safeText(t.task || t.title, "Untitled Task");
                  const safeAssignee = safeText(t.assignedTo, "Unassigned Member");
                  const safeCategory = safeText(t.category, "General");
                  const safeDueDate = safeText(t.dueDate, "No Due Date");
                  const safePriority = safeText(t.priority, "Normal");

                  const isCompleted = t.status === "Completed";
                  const isInProgress = t.status === "In Progress";
                  const isPaused = t.status === "Paused";

                  return (
                    <div
                      key={`task-item-${t.id || 'tsk'}-${idx}`}
                      className="p-4 rounded-2xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                    >
                      {/* Left Informational Section */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-md bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/20">
                            {safeCategory}
                          </span>
                          <span className="text-xs font-medium text-[#64748B]">
                            Assignee: <strong className="text-[#0F172A] font-semibold">{safeAssignee}</strong>
                          </span>
                          <span className="text-[10px] font-semibold text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-md">
                            Priority: {safePriority}
                          </span>
                        </div>

                        <h3 className={`text-sm font-bold text-[#0F172A] ${isCompleted ? "line-through text-[#94A3B8]" : ""}`}>
                          {safeTitle}
                        </h3>

                        <div className="flex items-center gap-4 text-[11px] text-[#64748B] pt-0.5">
                          <span>Due: {safeDueDate}</span>
                        </div>
                      </div>

                      {/* Right Context Aware Actions & Stopwatch */}
                      <div className="flex items-center gap-3 shrink-0">
                        {/* Live Stopwatch Display */}
                        <div className="px-3 py-1.5 bg-[#F8FAFC] text-[#0F172A] rounded-xl font-mono text-xs font-bold border border-[#E2E8F0] flex items-center gap-1.5">
                          <FaClock className={`text-xs ${t.isTimerRunning ? "text-[#2563EB] animate-spin" : "text-[#64748B]"}`} />
                          <span>{formatTimer(t.timerSeconds)}</span>
                        </div>

                        {/* Status Badge (Soft Blue / Soft Gray) */}
                        <span className={`text-[10px] font-semibold uppercase px-2.5 py-1 rounded-md border ${
                          isCompleted
                            ? "bg-[#EFF6FF] text-[#2563EB] border-[#2563EB]/20"
                            : isInProgress
                            ? "bg-[#EFF6FF] text-[#2563EB] border-[#2563EB]/20"
                            : "bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]"
                        }`}>
                          {t.status || "Pending"}
                        </span>

                        {/* Context-Aware Buttons */}
                        <div className="flex items-center gap-1.5">
                          {!isCompleted && (
                            !t.isTimerRunning ? (
                              <button
                                onClick={() => handleStartTask(t.id)}
                                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <FaPlay className="text-[10px]" /> {isPaused ? "Resume" : "Start"}
                              </button>
                            ) : (
                              <button
                                onClick={() => handlePauseTask(t.id)}
                                className="bg-white hover:bg-[#F8FAFC] text-[#2563EB] border border-[#E2E8F0] font-semibold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <FaPause className="text-[10px]" /> Pause
                              </button>
                            )
                          )}

                          {!isCompleted && (
                            <button
                              onClick={() => handleCompleteTask(t.id)}
                              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <FaCheckCircle className="text-[10px]" /> Complete
                            </button>
                          )}

                          {isCompleted && (
                            <span className="text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1.5 rounded-xl border border-[#2563EB]/20">
                              ✓ Completed
                            </span>
                          )}

                          {/* Kebab Action for Task Delete */}
                          <div className="relative">
                            <button
                              onClick={() => setActiveKebabId(activeKebabId === t.id ? null : t.id)}
                              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                            >
                              <FaEllipsisV className="text-xs" />
                            </button>

                            {activeKebabId === t.id && (
                              <div className="absolute right-0 mt-1 w-36 rounded-xl bg-white p-1.5 shadow-lg border border-[#E2E8F0] z-30 space-y-0.5 text-xs animate-in fade-in zoom-in-95 duration-100">
                                <button
                                  onClick={() => {
                                    setActiveKebabId(null);
                                    setConfirmModal({
                                      isOpen: true,
                                      type: "single_task",
                                      taskId: t.id,
                                      title: safeTitle,
                                      loading: false
                                    });
                                  }}
                                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 font-semibold transition-colors flex items-center gap-2"
                                >
                                  <FaTrash className="text-xs" /> Delete Task
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* RIGHT COLUMN (30% - 4 COLS): TASK ANALYTICS & SUMMARY WIDGET */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Widget 1: Task Summary Stats */}
            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm space-y-4">
              <div className="border-b border-[#E2E8F0] pb-3">
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  <FaChartPie className="text-[#2563EB]" />
                  <span>Task Productivity Summary</span>
                </h3>
                <p className="text-xs text-[#64748B]">Real-time workstream metrics.</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-0.5">
                  <span className="text-[10px] font-semibold text-[#64748B] uppercase">Total Assigned</span>
                  <p className="text-lg font-bold text-[#0F172A]">{taskAnalytics.total}</p>
                </div>

                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-0.5">
                  <span className="text-[10px] font-semibold text-[#64748B] uppercase">Pending</span>
                  <p className="text-lg font-bold text-[#0F172A]">{taskAnalytics.pending}</p>
                </div>

                <div className="p-3 rounded-xl bg-[#EFF6FF] border border-[#2563EB]/20 space-y-0.5">
                  <span className="text-[10px] font-semibold text-[#2563EB] uppercase">In Progress</span>
                  <p className="text-lg font-bold text-[#2563EB]">{taskAnalytics.inProgress}</p>
                </div>

                <div className="p-3 rounded-xl bg-[#EFF6FF] border border-[#2563EB]/20 space-y-0.5">
                  <span className="text-[10px] font-semibold text-[#2563EB] uppercase">Completed Today</span>
                  <p className="text-lg font-bold text-[#2563EB]">{taskAnalytics.completed}</p>
                </div>
              </div>
            </div>

            {/* Widget 2: Completion Rate Progress Ring & Time Tracked */}
            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm space-y-4">
              <div className="border-b border-[#E2E8F0] pb-3">
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  <FaChartLine className="text-[#2563EB]" />
                  <span>Completion Rate & Hours</span>
                </h3>
                <p className="text-xs text-[#64748B]">Workstream efficiency score.</p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Completion Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-semibold text-[#0F172A]">
                    <span>Task Completion Score</span>
                    <span className="text-[#2563EB] font-bold">{taskAnalytics.completionRatePct}%</span>
                  </div>
                  <div className="w-full h-3 bg-[#F8FAFC] rounded-full overflow-hidden border border-[#E2E8F0]">
                    <div
                      className="h-full bg-[#2563EB] rounded-full transition-all duration-500"
                      style={{ width: `${taskAnalytics.completionRatePct}%` }}
                    />
                  </div>
                </div>

                {/* Total Working Duration Display */}
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                  <span className="font-semibold text-[#64748B]">Total Time Logged:</span>
                  <span className="font-mono font-bold text-[#0F172A] text-sm">
                    {formatTimer(taskAnalytics.totalSecs)}
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: PROJECTS DIRECTORY */}
      {activeTab === "projects" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {projects.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/20">
                      Client: {p.client || "Client Deal"}
                    </span>
                    <h3 className="font-bold text-[#0F172A] text-base mt-1">{p.title || "Untitled Project"}</h3>
                  </div>
                  <span className="text-[10px] font-semibold text-[#64748B] bg-[#F8FAFC] px-2.5 py-1 rounded border border-[#E2E8F0]">
                    Deadline: {p.deadline || "Ongoing"}
                  </span>
                </div>

                <p className="text-[#64748B] text-xs leading-relaxed">{p.description || "Active Software House project deliverable."}</p>
              </div>

              <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
                <span className="font-semibold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-md border border-[#2563EB]/20">
                  {p.status || "Active Workstream"}
                </span>

                <button
                  onClick={() => setSelectedProjectModal(p)}
                  className="text-[#2563EB] hover:underline font-semibold text-xs cursor-pointer"
                >
                  Inspect Project Details →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {createTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E2E8F0] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                <FaPlusCircle className="text-[#2563EB]" />
                <span>Assign New Workstream Task</span>
              </h3>
              <button onClick={() => setCreateTaskModalOpen(false)} className="text-[#64748B] hover:text-[#0F172A] font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateDailyTask} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#64748B]">Task Description *</label>
                <input
                  type="text"
                  required
                  value={newTaskForm.task}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, task: e.target.value })}
                  placeholder="e.g. Build Payment Gateway Webhook Endpoint"
                  className="w-full p-2.5 rounded-xl border border-[#E2E8F0] font-semibold text-[#0F172A] outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#64748B]">Task Category</label>
                  <select
                    value={newTaskForm.category}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E2E8F0] font-semibold text-[#0F172A] outline-none focus:border-[#2563EB] bg-white"
                  >
                    <option value="Development">Development</option>
                    <option value="UI/UX Design">UI/UX Design</option>
                    <option value="QA Testing">QA Testing</option>
                    <option value="Bug Fix">Bug Fix</option>
                    <option value="Research">Research</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#64748B]">Priority Level</label>
                  <select
                    value={newTaskForm.priority}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, priority: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E2E8F0] font-semibold text-[#0F172A] outline-none focus:border-[#2563EB] bg-white"
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setCreateTaskModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] font-semibold text-[#2563EB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DESTRUCTIVE MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E2E8F0] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-[#E2E8F0] pb-3 text-[#0F172A]">
              <FaExclamationTriangle className="text-xl text-[#2563EB]" />
              <h3 className="font-bold text-[#0F172A] text-base">Confirm Destructive Action</h3>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Are you sure you want to proceed with <strong className="text-[#0F172A]">"{confirmModal.title}"</strong>? This action cannot be undone.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, type: "", taskId: "", title: "", loading: false })}
                className="flex-1 py-2.5 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#2563EB] border border-[#E2E8F0] font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmedDelete}
                disabled={confirmModal.loading}
                className="flex-1 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs cursor-pointer flex items-center justify-center"
              >
                {confirmModal.loading ? "Processing..." : "Confirm & Execute 🗑️"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT PROJECT DETAILS MODAL */}
      {selectedProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#E2E8F0] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-md border border-[#2563EB]/20">
                  Client: {selectedProjectModal.client || "Client Deal"}
                </span>
                <h3 className="text-base font-bold text-[#0F172A] mt-1">{selectedProjectModal.title}</h3>
              </div>
              <button onClick={() => setSelectedProjectModal(null)} className="text-[#64748B] hover:text-[#0F172A] font-bold">✕</button>
            </div>

            <p className="text-xs text-[#64748B]">{selectedProjectModal.description}</p>

            <div className="pt-2 text-right">
              <button onClick={() => setSelectedProjectModal(null)} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold px-4 py-2 rounded-xl text-xs">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
