"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Modal from "@/components/Modal";
import { showToast } from "@/components/Toast";
import { dbFetch, dbSaveList } from "@/lib/dbPersistence";
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
  FaEye
} from "react-icons/fa";

export default function ProjectsPage() {
  const [role, setRole] = useState("admin");
  const [userEmail, setUserEmail] = useState("");
  const [activeTab, setActiveTab] = useState("daily_tasks"); // "daily_tasks" | "projects"

  // 1. Daily Task Management State (Start, Pause, Complete, Manager Monitor)
  const [dailyTasks, setDailyTasks] = useState([]);

  // 2. Comprehensive Project Management State
  const [projects, setProjects] = useState([]);

  // Selected Project Details Inspection Modal State
  const [selectedProjectModal, setSelectedProjectModal] = useState(null);

  // New Daily Task Modal State
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    task: "",
    category: "Development",
    targetType: "individual_student", // "all_students" | "individual_student" | "all_employees" | "individual_employee"
    assignedToName: "Ali Hassan (Student)",
    assignedToEmail: "student@gmail.com",
  });

  // Dynamic Enrolled Student & Employee Directory State
  const [studentDirectory, setStudentDirectory] = useState([
    { name: "Ali Hassan", email: "student@gmail.com", batch: "Batch #14 (MERN Tech)" },
    { name: "Muhammad Rahim Bugti", email: "rahim.student@gmail.com", batch: "Batch #14 (MERN Tech)" },
    { name: "Hamza Ahmed", email: "hamza.student@gmail.com", batch: "Batch #15 (Python Tech)" },
    { name: "Usman Tariq", email: "usman.student@gmail.com", batch: "Batch #15 (Python Tech)" },
    { name: "Sara Ahmed", email: "sara.student@gmail.com", batch: "Batch #14 (MERN Tech)" },
  ]);

  const [employeeDirectory, setEmployeeDirectory] = useState([
    { name: "Sara Khan", email: "sara.design@gmail.com", dept: "UI/UX Design" },
    { name: "Muhammad Ali", email: "ali.staff@gmail.com", dept: "Web Development" },
    { name: "Muhammad Rahim Bugti", email: "rahim.staff@gmail.com", dept: "Senior Full-Stack Developer" },
    { name: "Usman Tariq", email: "usman.qa@gmail.com", dept: "QA Testing" },
  ]);

  // Alert Modal
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info" });

  const showAlert = (title, message, type = "info") => {
    setModal({ isOpen: true, title, message, type });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  useEffect(() => {
    const savedRole = localStorage.getItem("user_role") || "admin";
    const savedEmail = localStorage.getItem("current_user_email") || "student@gmail.com";
    setRole(savedRole);
    setUserEmail(savedEmail);

    // Load registered users & payroll employees to populate live Employee list
    try {
      const savedPayrolls = localStorage.getItem("software_house_payrolls");
      if (savedPayrolls) {
        const pList = JSON.parse(savedPayrolls);
        const payrollEmps = pList.map(p => ({
          name: p.employee_name,
          email: p.email,
          dept: p.designation || p.department || "Paid Employee Staff"
        }));
        setEmployeeDirectory(prev => {
          const combined = [...prev];
          payrollEmps.forEach(emp => {
            if (emp.email && !combined.some(c => c.email.toLowerCase() === emp.email.toLowerCase())) {
              combined.push(emp);
            }
          });
          return combined;
        });
      }

      const savedUsers = localStorage.getItem("registered_system_users");
      if (savedUsers) {
        const users = JSON.parse(savedUsers);
        const students = users.filter(u => u.role === "student" || u.role === "course_student" || u.role === "intern").map(u => ({
          name: u.fullName || u.email.split("@")[0],
          email: u.email,
          batch: u.department || "Enrolled Student Batch"
        }));
        const employees = users.filter(u => u.role === "employee" || u.role === "staff").map(u => ({
          name: u.fullName || u.email.split("@")[0],
          email: u.email,
          dept: u.department || "Paid Staff Department"
        }));

        if (students.length > 0) {
          setStudentDirectory(prev => {
            const combined = [...prev];
            students.forEach(st => {
              if (st.email && !combined.some(c => c.email.toLowerCase() === st.email.toLowerCase())) {
                combined.push(st);
              }
            });
            return combined;
          });
        }

        if (employees.length > 0) {
          setEmployeeDirectory(prev => {
            const combined = [...prev];
            employees.forEach(emp => {
              if (emp.email && !combined.some(c => c.email.toLowerCase() === emp.email.toLowerCase())) {
                combined.push(emp);
              }
            });
            return combined;
          });
        }
      }
    } catch(e) {}

    dbFetch("daily_tasks").then(tasks => setDailyTasks(tasks));
    dbFetch("projects").then(projs => setProjects(projs));
  }, []);

  const saveTasksState = (newList) => {
    setDailyTasks(newList);
    dbSaveList("daily_tasks", newList);
  };

  const saveProjectsState = (newList) => {
    setProjects(newList);
    dbSaveList("projects", newList);
  };

  // Timer interval for active tasks
  useEffect(() => {
    const interval = setInterval(() => {
      setDailyTasks((prevTasks) =>
        prevTasks.map((t) => (t.isTimerRunning ? { ...t, timerSeconds: t.timerSeconds + 1 } : t))
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Daily Task Action Handlers (Start, Pause, Complete)
  const handleStartTask = (id) => {
    const updated = dailyTasks.map((t) =>
      t.id === id ? { ...t, status: "In Progress", isTimerRunning: true } : t
    );
    saveTasksState(updated);
  };

  const handlePauseTask = (id) => {
    const updated = dailyTasks.map((t) =>
      t.id === id ? { ...t, status: "Paused", isTimerRunning: false } : t
    );
    saveTasksState(updated);
  };

  const handleCompleteTask = (id) => {
    const updated = dailyTasks.map((t) =>
      t.id === id ? { ...t, status: "Completed", isTimerRunning: false } : t
    );
    saveTasksState(updated);
  };

  const handleDeleteTask = (id) => {
    if (!confirm("Are you sure you want to delete this completed task?")) return;
    const updated = dailyTasks.filter((t) => t.id !== id);
    saveTasksState(updated);
    showToast("Task Deleted 🗑️", "Completed task has been deleted.", "info");
  };

  const handleCreateDailyTask = async (e) => {
    e.preventDefault();
    if (!newTaskForm.task.trim()) return;

    let newTasksToInsert = [];

    if (newTaskForm.targetType === "all_students") {
      // Broadcast task to ALL enrolled students in class!
      newTasksToInsert = studentDirectory.map((st) => ({
        id: "dt-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        task: newTaskForm.task,
        assignedTo: `${st.name} (${st.batch})`,
        email: st.email.toLowerCase().trim(),
        targetAudience: "All Enrolled Students (Batch #14 & #15)",
        status: "Pending",
        timerSeconds: 0,
        isTimerRunning: false,
        category: newTaskForm.category,
      }));
    } else if (newTaskForm.targetType === "all_employees") {
      // Broadcast task to ALL paid employees!
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
      }));
    } else {
      // Individual Student or Employee Task Assignment
      newTasksToInsert = [
        {
          id: "dt-" + Date.now(),
          task: newTaskForm.task,
          assignedTo: newTaskForm.assignedToName,
          email: newTaskForm.assignedToEmail.toLowerCase().trim(),
          targetAudience: newTaskForm.targetType === "individual_student" ? "Individual Student Assignment" : "Individual Staff Assignment",
          status: "Pending",
          timerSeconds: 0,
          isTimerRunning: false,
          category: newTaskForm.category,
        },
      ];
    }

    const updated = [...newTasksToInsert, ...dailyTasks];
    saveTasksState(updated);

    // Save tasks to Supabase Database
    try {
      const payload = newTasksToInsert.map(t => ({
        task_name: t.task,
        assigned_to: t.assignedTo,
        email: t.email,
        status: t.status,
        category: t.category,
        created_at: new Date().toISOString()
      }));
      await supabase.from("daily_tasks").insert(payload);
    } catch(e) {}

    setCreateTaskModalOpen(false);
    setNewTaskForm({
      task: "",
      category: "Development",
      targetType: "individual_student",
      assignedToName: "Ali Hassan (Student)",
      assignedToEmail: "student@gmail.com",
    });
    showToast("Task Assigned Successfully! 📋", `Assigned '${newTaskForm.task}' to ${newTasksToInsert.length} user(s).`, "success");
  };

  const formatTimer = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs > 0 ? hrs + "h " : ""}${mins}m ${secs}s`;
  };

  if (role === "client") {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm max-w-lg mx-auto my-12 space-y-4">
        <h2 className="text-xl font-extrabold text-slate-900">Redirecting to Client Portal...</h2>
        <p className="text-xs text-slate-500">Clients are securely directed to their dedicated Client Portal.</p>
        <a href="/dashboard/client-portal" className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs">Open Client Portal</a>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Alert Modal */}
      <Modal isOpen={modal.isOpen} title={modal.title} message={modal.message} type={modal.type} onClose={closeModal} />

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-950/90 px-3 py-1 rounded-full border border-indigo-800">
              Operations & Task Hub
            </span>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
              Live Timer & Project Control
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black mt-2 text-white flex items-center gap-2.5">
            <FaTasks className="text-indigo-400" />
            <span>Daily Tasks & Project Management</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Employee Daily Tasks (Start, Pause, Complete) • Manager Progress Monitoring • Assigned Teams • Deadlines • Files & Notes
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab("daily_tasks")}
            className={`font-extrabold px-4 py-2.5 rounded-xl text-xs transition-all border cursor-pointer ${
              activeTab === "daily_tasks"
                ? "bg-indigo-600 text-white border-indigo-500 shadow-md"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
            }`}
          >
            📋 Daily Tasks Logger
          </button>
          <button
            onClick={() => setActiveTab("projects")}
            className={`font-extrabold px-4 py-2.5 rounded-xl text-xs transition-all border cursor-pointer ${
              activeTab === "projects"
                ? "bg-indigo-600 text-white border-indigo-500 shadow-md"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
            }`}
          >
            📁 Projects Directory ({projects.length})
          </button>
        </div>
      </div>

      {/* TAB 1: DAILY TASK MANAGEMENT & LIVE TIMER (START, PAUSE, COMPLETE, MANAGER MONITORING) */}
      {activeTab === "daily_tasks" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FaTasks className="text-indigo-600" />
                  <span>Today's Assigned Daily Tasks & Live Timer</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Employees log in, start live work timer, pause, and mark completed. Manager monitors progress in real-time.
                </p>
              </div>

              {(role === "admin" || role === "hr" || role === "manager") && (
                <button
                  onClick={() => setCreateTaskModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <FaPlusCircle />
                  <span>+ Assign New Task</span>
                </button>
              )}
            </div>

            {/* Daily Tasks List */}
            <div className="space-y-3 text-xs">
              {dailyTasks.filter((t) => {
                if (role === "admin" || role === "hr" || role === "manager") return true;
                return t.email && t.email.toLowerCase() === userEmail.toLowerCase();
              }).length === 0 ? (
                <div className="p-8 text-center text-slate-400 italic bg-slate-50 rounded-xl border border-slate-200">
                  No assigned tasks found for your logged-in account ({userEmail}).
                </div>
              ) : (
                dailyTasks.filter((t) => {
                  if (role === "admin" || role === "hr" || role === "manager") return true;
                  return t.email && t.email.toLowerCase() === userEmail.toLowerCase();
                }).map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-300">
                        {t.category}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">Assigned To: {t.assignedTo}</span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span className={t.status === "Completed" ? "line-through text-slate-400" : ""}>{t.task}</span>
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    {/* Live Time Tracked Display */}
                    <div className="p-2 bg-slate-900 text-emerald-400 rounded-lg font-mono text-xs font-bold border border-slate-800 flex items-center gap-1.5">
                      <FaClock className={t.isTimerRunning ? "animate-spin text-emerald-400" : "text-slate-500"} />
                      <span>{formatTimer(t.timerSeconds)}</span>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg border ${
                        t.status === "Completed"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : t.status === "In Progress"
                          ? "bg-blue-100 text-blue-800 border-blue-300"
                          : t.status === "Paused"
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : "bg-slate-100 text-slate-700 border-slate-300"
                      }`}
                    >
                      {t.status}
                    </span>

                    {/* Action Controls: Start, Pause, Complete, Delete */}
                    {t.status !== "Completed" ? (
                      <div className="flex items-center gap-1.5">
                        {!t.isTimerRunning ? (
                          <button
                            onClick={() => handleStartTask(t.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                          >
                            <FaPlay className="text-[10px]" /> Start
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePauseTask(t.id)}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                          >
                            <FaPause className="text-[10px]" /> Pause
                          </button>
                        )}

                        <button
                          onClick={() => handleCompleteTask(t.id)}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                        >
                          <FaCheckCircle className="text-[10px]" /> Complete
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDeleteTask(t.id)}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                        title="Delete Completed Task"
                      >
                        <FaTrash className="text-[10px]" /> Delete Task
                      </button>
                    )}
                  </div>
                </div>
              )))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMPREHENSIVE PROJECT MANAGEMENT (TEAM, DEADLINE, PROGRESS, PENDING/COMPLETED TASKS, FILES, NOTES) */}
      {activeTab === "projects" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {projects.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-300">
                      Client: {p.client}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-1">{p.title}</h3>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded border border-rose-200 block">
                      Deadline: {p.deadline}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>Project Progress</span>
                    <span className="text-indigo-600">{p.progress}% Completed</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${p.progress}%` }}></div>
                  </div>
                </div>

                {/* Assigned Team */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px]">
                    <FaUsers className="text-indigo-600" />
                    <span>Assigned Team Members ({p.assignedTeam.length}):</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {p.assignedTeam.map((member) => (
                      <span key={member.email} className="bg-white border border-slate-300 px-2 py-0.5 rounded-md font-semibold text-[10px] text-slate-800">
                        {member.name} ({member.role})
                      </span>
                    ))}
                  </div>
                </div>

                {/* Pending Tasks & Completed Tasks Counter */}
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                    <span className="font-bold text-amber-900 block">⏳ Pending ({p.pendingTasks.length})</span>
                    <p className="text-amber-800 text-[10px] line-clamp-1">{p.pendingTasks[0] || "None"}</p>
                  </div>

                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                    <span className="font-bold text-emerald-900 block">✅ Completed ({p.completedTasks.length})</span>
                    <p className="text-emerald-800 text-[10px] line-clamp-1">{p.completedTasks[0] || "None"}</p>
                  </div>
                </div>

                {/* Attached Project Files */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px]">
                    <FaPaperclip className="text-purple-600" />
                    <span>Attached Project Deliverables ({p.files.length}):</span>
                  </span>
                  <div className="space-y-1 text-[10px]">
                    {p.files.map((f) => (
                      <div key={f.name} className="flex justify-between text-slate-600 bg-white p-1.5 rounded border border-slate-200">
                        <span className="font-semibold text-blue-600">{f.name}</span>
                        <span>{f.size}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1">
                  <span className="font-bold text-indigo-950 flex items-center gap-1.5 text-[11px]">
                    <FaStickyNote className="text-indigo-600" />
                    <span>Project Notes:</span>
                  </span>
                  <p className="text-slate-700 text-[11px]">{p.notes}</p>
                </div>
              </div>

              {/* View Full Project Workspace Details Button */}
              <button
                onClick={() => setSelectedProjectModal(p)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <FaEye />
                <span>Open Project Hub (Tasks, Files & Notes)</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* CREATE DAILY TASK MODAL */}
      {createTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FaTasks className="text-indigo-600" />
                <span>Assign Task to Enrolled Student or Staff</span>
              </h3>
              <button onClick={() => setCreateTaskModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateDailyTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Target Audience / Condition *
                </label>
                <select
                  value={newTaskForm.targetType}
                  onChange={(e) => {
                    const t = e.target.value;
                    let name = "";
                    let email = "";
                    if (t === "individual_student") {
                      name = `${studentDirectory[0].name} (${studentDirectory[0].batch})`;
                      email = studentDirectory[0].email;
                    } else if (t === "individual_employee") {
                      name = `${employeeDirectory[0].name} (${employeeDirectory[0].dept})`;
                      email = employeeDirectory[0].email;
                    }
                    setNewTaskForm({ ...newTaskForm, targetType: t, assignedToName: name, assignedToEmail: email });
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-indigo-600"
                >
                  <option value="individual_student">🎓 Individual Enrolled Student (Select One)</option>
                  <option value="all_students">🎓 All Enrolled Students in Class (Broadcast Task)</option>
                  <option value="individual_employee">💼 Individual Employee Staff (Select One)</option>
                  <option value="all_employees">💼 All Paid Staff Employees (Broadcast Task)</option>
                </select>
              </div>

              {/* Conditional Selection Dropdown */}
              {newTaskForm.targetType === "individual_student" && (
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Select Enrolled Student *
                  </label>
                  <select
                    value={newTaskForm.assignedToEmail}
                    onChange={(e) => {
                      const selected = studentDirectory.find(s => s.email === e.target.value);
                      if (selected) {
                        setNewTaskForm({
                          ...newTaskForm,
                          assignedToEmail: selected.email,
                          assignedToName: `${selected.name} (${selected.batch})`,
                        });
                      }
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600 font-semibold"
                  >
                    {studentDirectory.map((st) => (
                      <option key={st.email} value={st.email}>
                        {st.name} • {st.batch} ({st.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {newTaskForm.targetType === "individual_employee" && (
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Select Employee Staff *
                  </label>
                  <select
                    value={newTaskForm.assignedToEmail}
                    onChange={(e) => {
                      const selected = employeeDirectory.find(emp => emp.email === e.target.value);
                      if (selected) {
                        setNewTaskForm({
                          ...newTaskForm,
                          assignedToEmail: selected.email,
                          assignedToName: `${selected.name} (${selected.dept})`,
                        });
                      }
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600 font-semibold"
                  >
                    {employeeDirectory.map((emp) => (
                      <option key={emp.email} value={emp.email}>
                        {emp.name} • {emp.dept} ({emp.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {newTaskForm.targetType === "all_students" && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] font-semibold">
                  📢 Task will be broadcasted to <strong>ALL enrolled class students</strong> in Batch #14 & #15 simultaneously!
                </div>
              )}

              {newTaskForm.targetType === "all_employees" && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-[11px] font-semibold">
                  📢 Task will be broadcasted to <strong>ALL paid staff employees</strong> simultaneously!
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTaskForm.task}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, task: e.target.value })}
                  placeholder="e.g. Complete Next.js REST API Assignment"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Category
                </label>
                <select
                  value={newTaskForm.category}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, category: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600"
                >
                  <option value="Development">💻 Development</option>
                  <option value="Design">🎨 Design</option>
                  <option value="Video">🎬 Video Editing</option>
                  <option value="Marketing">📲 Social Marketing</option>
                  <option value="Support">💬 Client Support</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
              >
                Assign Task & Enable Timer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FULL PROJECT DETAILS WORKSPACE MODAL */}
      {selectedProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-300">
                  Client: {selectedProjectModal.client}
                </span>
                <h3 className="font-bold text-slate-900 text-lg mt-1">{selectedProjectModal.title}</h3>
              </div>
              <button onClick={() => setSelectedProjectModal(null)} className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1">✕</button>
            </div>

            {/* Team Members */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <FaUsers className="text-indigo-600" />
                <span>Assigned Team Members:</span>
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {selectedProjectModal.assignedTeam.map((m) => (
                  <div key={m.email} className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="font-bold text-slate-900">{m.name}</p>
                    <p className="text-[10px] text-slate-500">{m.role} • {m.email}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Tasks */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
                <FaClock className="text-amber-600" />
                <span>Pending Tasks ({selectedProjectModal.pendingTasks.length}):</span>
              </h4>
              <ul className="space-y-1 bg-amber-50/60 p-3 rounded-xl border border-amber-200 text-amber-950">
                {selectedProjectModal.pendingTasks.map((t, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Completed Tasks */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
                <FaCheckCircle className="text-emerald-600" />
                <span>Completed Tasks ({selectedProjectModal.completedTasks.length}):</span>
              </h4>
              <ul className="space-y-1 bg-emerald-50/60 p-3 rounded-xl border border-emerald-200 text-emerald-950">
                {selectedProjectModal.completedTasks.map((t, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    <span className="line-through">{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Attached Files */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <FaPaperclip className="text-purple-600" />
                <span>Project Deliverables & Files:</span>
              </h4>
              <div className="space-y-1.5">
                {selectedProjectModal.files.map((f) => (
                  <div key={f.name} className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                    <span className="font-bold text-blue-600">{f.name}</span>
                    <span className="text-slate-400 text-[10px]">{f.size} • {f.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Project Notes */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-indigo-950 flex items-center gap-1.5">
                <FaStickyNote className="text-indigo-600" />
                <span>Project Strategy Notes:</span>
              </h4>
              <p className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-slate-800 leading-relaxed">
                {selectedProjectModal.notes}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
