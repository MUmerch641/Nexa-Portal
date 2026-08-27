"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import {
  FaTrophy,
  FaStar,
  FaMedal,
  FaUserCheck,
  FaTasks,
  FaClock,
  FaComments,
  FaShareAlt,
  FaUserShield,
  FaCalendarMinus,
  FaChartLine,
  FaFilter,
  FaSlidersH,
  FaUserTie,
  FaUserGraduate,
  FaEdit
} from "react-icons/fa";

import { dbFetch, dbSaveList } from "@/lib/dbPersistence";

export default function PerformancePage() {
  const [role, setRole] = useState("admin");
  const [userEmail, setUserEmail] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("August 2026");

  // Employee Performance Scores List (Live Cloud Database)
  const [performances, setPerformances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info" });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  useEffect(() => {
    const savedRole = localStorage.getItem("user_role") || "admin";
    const savedEmail = (localStorage.getItem("current_user_email") || "").toLowerCase().trim();
    setRole(savedRole);
    setUserEmail(savedEmail);

    const loadPerformances = async () => {
      try {
        const [cloudEmployees, cloudStudents, cloudPerformances] = await Promise.all([
          dbFetch("employees", [], true).catch(() => []),
          dbFetch("students", [], true).catch(() => []),
          dbFetch("performances", [], true).catch(() => [])
        ]);

        const perfMap = new Map();
        (cloudPerformances || []).forEach(p => {
          if (p && p.email) {
            perfMap.set(p.email.toLowerCase().trim(), p);
          }
        });

        // 1. Map registered employees
        const list = [];
        (cloudEmployees || []).forEach((emp, idx) => {
          const email = (emp.email || "").toLowerCase().trim();
          if (!email) return;
          const existing = perfMap.get(email);
          const metrics = existing?.metrics || {
            attendance: existing?.attendance || 94,
            taskCompletion: existing?.task_completion || existing?.taskCompletion || 92,
            deadlines: existing?.deadlines || 95,
            clientFeedback: existing?.client_feedback || existing?.clientFeedback || 93,
            socialMedia: existing?.social_media || existing?.socialMedia || 88,
            behavior: existing?.behavior || 96,
            leaveRecord: existing?.leave_record || existing?.leaveRecord || 94,
            productivity: existing?.productivity || 92,
          };

          list.push({
            id: existing?.id || `perf-emp-${emp.id || idx + 1}`,
            name: emp.full_name || emp.name || email.split("@")[0],
            role: emp.designation || "Software Engineer",
            email: email,
            avatarType: "employee",
            metrics: metrics
          });
        });

        // 2. Map registered students
        (cloudStudents || []).forEach((std, idx) => {
          const email = (std.email || "").toLowerCase().trim();
          if (!email || list.some(l => l.email === email)) return;
          const existing = perfMap.get(email);
          const metrics = existing?.metrics || {
            attendance: existing?.attendance || 90,
            taskCompletion: existing?.task_completion || existing?.taskCompletion || 88,
            deadlines: existing?.deadlines || 90,
            clientFeedback: existing?.client_feedback || existing?.clientFeedback || 89,
            socialMedia: existing?.social_media || existing?.socialMedia || 85,
            behavior: existing?.behavior || 94,
            leaveRecord: existing?.leave_record || existing?.leaveRecord || 91,
            productivity: existing?.productivity || 88,
          };

          list.push({
            id: existing?.id || `perf-std-${std.id || idx + 1}`,
            name: std.full_name || std.student_name || email.split("@")[0],
            role: `${std.course_name || "MERN Stack"} Student`,
            email: email,
            avatarType: "student",
            metrics: metrics
          });
        });

        // 3. Fallback to existing standalone performances if any
        (cloudPerformances || []).forEach(p => {
          if (p && p.email && !list.some(l => l.email === p.email.toLowerCase().trim())) {
            list.push(p);
          }
        });

        setPerformances(list);
        if (list.length > 0 && typeof window !== "undefined") {
          localStorage.setItem("software_house_performances", JSON.stringify(list));
        }
      } catch (e) {}
      setLoading(false);
    };

    loadPerformances();
  }, []);

  const savePerformanceState = (updatedList) => {
    setPerformances(updatedList);
    dbSaveList("performances", updatedList);
  };

  const showAlert = (title, message, type = "info") => {
    setModal({ isOpen: true, title, message, type });
  };

  const closeModal = () => {
    setModal({ isOpen: false, title: "", message: "", type: "info" });
  };

  const calculateOverallScore = (metrics) => {
    const total =
      metrics.attendance +
      metrics.taskCompletion +
      metrics.deadlines +
      metrics.clientFeedback +
      metrics.socialMedia +
      metrics.behavior +
      metrics.leaveRecord +
      metrics.productivity;
    return Math.round(total / 8);
  };

  const rankedPerformances = [...performances].sort((a, b) => {
    return calculateOverallScore(b.metrics) - calculateOverallScore(a.metrics);
  });

  const handleEditClick = (employee) => {
    if (role !== "admin") {
      showAlert("Access Restricted", "Only Admins are allowed to update employee evaluation scores.", "warning");
      return;
    }
    setEditingEmployee({ ...employee });
    setEditModalOpen(true);
  };

  const handleMetricChange = (field, value) => {
    const numValue = Math.min(100, Math.max(0, Number(value) || 0));
    setEditingEmployee((prev) => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        [field]: numValue,
      },
    }));
  };

  const handleSaveMetrics = (e) => {
    e.preventDefault();
    if (!editingEmployee) return;

    const updated = performances.map((p) =>
      p.id === editingEmployee.id ? editingEmployee : p
    );
    savePerformanceState(updated);
    setEditModalOpen(false);
    setEditingEmployee(null);
    showAlert("Performance Score Updated", `Updated evaluation scores for ${editingEmployee.name}.`, "success");
  };

  const getRankBadge = (rank) => {
    switch (rank) {
      case 1:
        return (
          <span className="bg-blue-600 text-white font-extrabold px-3 py-1 rounded-xl text-xs flex items-center gap-1.5 shadow-md border border-blue-500">
            <FaTrophy className="text-white text-xs" /> Rank #1 (Top Performer)
          </span>
        );
      case 2:
        return (
          <span className="bg-blue-100 text-blue-900 font-bold px-3 py-1 rounded-xl text-xs flex items-center gap-1.5 border border-blue-300">
            <FaMedal className="text-blue-700 text-xs" /> Rank #2
          </span>
        );
      case 3:
        return (
          <span className="bg-blue-50 text-blue-800 font-bold px-3 py-1 rounded-xl text-xs flex items-center gap-1.5 border border-blue-200">
            <FaMedal className="text-blue-600 text-xs" /> Rank #3
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-xl text-xs">
            Rank #{rank}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Modal isOpen={modal.isOpen} title={modal.title} message={modal.message} type={modal.type} onClose={closeModal} />

      {/* Top Banner - Blue & White Theme */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-full border border-[#2563EB]/20">
              Employee Performance Engine
            </span>
            <span className="text-[10px] font-semibold text-[#64748B] bg-[#F8FAFC] px-2.5 py-1 rounded-full border border-[#E2E8F0]">
              8-Factor Evaluation & Monthly Leaderboard
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold mt-1.5 text-[#0F172A] flex items-center gap-2.5 whitespace-nowrap">
            <FaTrophy className="text-[#2563EB] shrink-0" />
            <span className="whitespace-nowrap">Employee Performance & Monthly Ranking</span>
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Scores based on: Attendance • Task Completion • Deadlines • Client Feedback • Social Media Activity • Behavior • Leave Record • Productivity
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] font-bold px-3 py-2 rounded-xl text-xs outline-none cursor-pointer"
          >
            <option value="August 2026">August 2026 Leaderboard</option>
            <option value="July 2026">July 2026 Leaderboard</option>
            <option value="June 2026">June 2026 Leaderboard</option>
          </select>
        </div>
      </div>

      {/* Monthly Ranking Leaderboard Grid */}
      <div className="space-y-6">
        <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2 max-w-full overflow-hidden">
          <FaStar className="text-[#2563EB] text-[#2563EB] text-base shrink-0" />
          <span className="whitespace-nowrap truncate font-bold text-[#0F172A]">Monthly Employee Performance Leaderboard ({selectedMonth})</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rankedPerformances.map((p, index) => {
            const overallScore = calculateOverallScore(p.metrics);
            const rank = index + 1;

            return (
              <div
                key={p.id}
                className={`bg-white rounded-2xl border ${
                  rank === 1 ? "border-blue-600 shadow-md ring-2 ring-blue-500/30" : "border-slate-200 shadow-xs"
                } p-5 space-y-4 text-xs flex flex-col justify-between`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 text-lg font-black">
                        {p.avatarType === "student" ? <FaUserGraduate /> : <FaUserTie />}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                          <span>{p.name}</span>
                        </h3>
                        <p className="text-[11px] text-blue-600 font-semibold">{p.role}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      {getRankBadge(rank)}
                    </div>
                  </div>

                  {/* Overall Score Meter */}
                  <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-blue-800 tracking-wider">Overall Performance Rating</span>
                      <p className="text-xs text-slate-600">Calculated across 8 core performance metrics</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-blue-700">{overallScore}%</span>
                    </div>
                  </div>

                  {/* 8 Detailed Evaluation Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <FaUserCheck className="text-blue-600" /> Attendance
                      </span>
                      <span className="font-mono font-extrabold text-slate-900">{p.metrics.attendance}%</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <FaTasks className="text-blue-600" /> Task Done
                      </span>
                      <span className="font-mono font-extrabold text-slate-900">{p.metrics.taskCompletion}%</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <FaClock className="text-blue-600" /> Deadlines
                      </span>
                      <span className="font-mono font-extrabold text-slate-900">{p.metrics.deadlines}%</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <FaComments className="text-blue-600" /> Client Rating
                      </span>
                      <span className="font-mono font-extrabold text-slate-900">{p.metrics.clientFeedback}%</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <FaShareAlt className="text-blue-600" /> Social Activity
                      </span>
                      <span className="font-mono font-extrabold text-slate-900">{p.metrics.socialMedia}%</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <FaUserShield className="text-blue-600" /> Behavior
                      </span>
                      <span className="font-mono font-extrabold text-slate-900">{p.metrics.behavior}%</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <FaCalendarMinus className="text-blue-600" /> Leave Record
                      </span>
                      <span className="font-mono font-extrabold text-slate-900">{p.metrics.leaveRecord}%</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <FaChartLine className="text-blue-600" /> Productivity
                      </span>
                      <span className="font-mono font-extrabold text-slate-900">{p.metrics.productivity}%</span>
                    </div>
                  </div>
                </div>

                {role === "admin" && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                    <button
                      onClick={() => handleEditClick(p)}
                      className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs transition-all border border-blue-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <FaEdit className="text-blue-600" />
                      <span>Update Performance Scores</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Admin Edit Performance Modal - Pure Blue & White Theme */}
      {editModalOpen && editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-blue-100 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <FaSlidersH className="text-blue-600" />
                  <span>Update Performance Scores</span>
                </h3>
                <p className="text-xs text-blue-600 font-bold">{editingEmployee.name} ({editingEmployee.role})</p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMetrics} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Attendance Score (%)</label>
                  <input
                    type="number"
                    max="100"
                    min="0"
                    value={editingEmployee.metrics.attendance}
                    onChange={(e) => handleMetricChange("attendance", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-blue-600 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Task Completion (%)</label>
                  <input
                    type="number"
                    max="100"
                    min="0"
                    value={editingEmployee.metrics.taskCompletion}
                    onChange={(e) => handleMetricChange("taskCompletion", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-blue-600 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">On-Time Deadlines (%)</label>
                  <input
                    type="number"
                    max="100"
                    min="0"
                    value={editingEmployee.metrics.deadlines}
                    onChange={(e) => handleMetricChange("deadlines", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-blue-600 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Client Feedback (%)</label>
                  <input
                    type="number"
                    max="100"
                    min="0"
                    value={editingEmployee.metrics.clientFeedback}
                    onChange={(e) => handleMetricChange("clientFeedback", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-blue-600 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Social Media Activity (%)</label>
                  <input
                    type="number"
                    max="100"
                    min="0"
                    value={editingEmployee.metrics.socialMedia}
                    onChange={(e) => handleMetricChange("socialMedia", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-blue-600 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Behavior & Teamwork (%)</label>
                  <input
                    type="number"
                    max="100"
                    min="0"
                    value={editingEmployee.metrics.behavior}
                    onChange={(e) => handleMetricChange("behavior", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-blue-600 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Leave Record Score (%)</label>
                  <input
                    type="number"
                    max="100"
                    min="0"
                    value={editingEmployee.metrics.leaveRecord}
                    onChange={(e) => handleMetricChange("leaveRecord", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-blue-600 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Code Productivity (%)</label>
                  <input
                    type="number"
                    max="100"
                    min="0"
                    value={editingEmployee.metrics.productivity}
                    onChange={(e) => handleMetricChange("productivity", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-blue-600 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
                >
                  Save & Update Ranking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
