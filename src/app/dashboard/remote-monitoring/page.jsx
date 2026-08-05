"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import {
  FaDesktop,
  FaCamera,
  FaClock,
  FaChartPie,
  FaShieldAlt,
  FaSync,
  FaPlay,
  FaPause,
  FaHistory,
  FaUserCheck,
  FaCheckCircle,
  FaInfoCircle
} from "react-icons/fa";

export default function RemoteMonitoringPage() {
  const [role, setRole] = useState("admin");
  const [userEmail, setUserEmail] = useState("");
  const [isMonitoringActive, setIsMonitoringActive] = useState(true);

  // Activity Log & Timeline State
  const [timeline, setTimeline] = useState([
    { id: "t-1", time: "10:15 AM", app: "VS Code (Next.js)", activityScore: 98, status: "Active Coding" },
    { id: "t-2", time: "10:27 AM", app: "Chrome (Supabase Docs)", activityScore: 92, status: "Research" },
    { id: "t-3", time: "10:42 AM", app: "Terminal (npm run dev)", activityScore: 95, status: "Building" },
    { id: "t-4", time: "10:55 AM", app: "Slack / Google Meet", activityScore: 89, status: "Team Discussion" },
  ]);

  // Screenshots Captured Log
  const [screenshots, setScreenshots] = useState([
    {
      id: "sc-1",
      timestamp: "10:45 AM (15m interval)",
      capturedApp: "VS Code — student/page.jsx",
      activityLevel: "96% Active (Keyboard/Mouse)",
      previewUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "sc-2",
      timestamp: "10:30 AM (15m interval)",
      capturedApp: "Google Meet — Sprint Sync",
      activityLevel: "91% Active (Audio/Video)",
      previewUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "sc-3",
      timestamp: "10:15 AM (15m interval)",
      capturedApp: "GitHub / Next.js Repo",
      activityLevel: "94% Active",
      previewUrl: "https://images.unsplash.com/photo-1618401471353-b98aedd04e11?w=600&auto=format&fit=crop&q=80",
    },
  ]);

  // App Usage Breakdown
  const appUsage = [
    { name: "VS Code / IDE", percentage: 55, color: "bg-blue-600" },
    { name: "Chrome / Research", percentage: 25, color: "bg-emerald-600" },
    { name: "Terminal / CLI", percentage: 12, color: "bg-purple-600" },
    { name: "Slack / Communication", percentage: 8, color: "bg-amber-600" },
  ];

  // Selected Screenshot Modal
  const [selectedImageModal, setSelectedImageModal] = useState(null);

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
  }, []);

  // Simulator for triggering a manual random screenshot (5-15 mins interval simulation)
  const handleTriggerManualScreenshot = () => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const appsList = ["VS Code (MERN Stack)", "Postman API Tester", "Supabase Console", "Next.js Dev Server"];
    const randomApp = appsList[Math.floor(Math.random() * appsList.length)];

    const newSc = {
      id: "sc-" + Date.now(),
      timestamp: `${nowStr} (Simulated 5-15m random snapshot)`,
      capturedApp: randomApp,
      activityLevel: "97% Active (Keyboard & Mouse)",
      previewUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80",
    };

    setScreenshots([newSc, ...screenshots]);
    showAlert("Transparent Snapshot Captured 📸", `Captured random screenshot of ${randomApp}. Privacy transparency badge active.`, "success");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Alert Modal */}
      <Modal isOpen={modal.isOpen} title={modal.title} message={modal.message} type={modal.type} onClose={closeModal} />

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400 bg-blue-950/90 px-3 py-1 rounded-full border border-blue-800">
              Remote Work Monitor
            </span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800 flex items-center gap-1">
              <FaShieldAlt /> 100% Transparent Privacy Banner Active
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black mt-2 text-white flex items-center gap-2.5">
            <FaDesktop className="text-blue-400" />
            <span>Remote Staff & Student Monitoring Engine</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Random Screenshots (Every 5–15 mins) • Activity Logs • App Usage Analytics • Work Timeline
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsMonitoringActive(!isMonitoringActive)}
            className={`font-black px-4 py-2.5 rounded-xl text-xs transition-all shadow-lg flex items-center gap-2 border cursor-pointer ${
              isMonitoringActive
                ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500/40"
                : "bg-amber-600 hover:bg-amber-700 text-white border-amber-500/40"
            }`}
          >
            {isMonitoringActive ? <FaPlay /> : <FaPause />}
            <span>{isMonitoringActive ? "Monitoring Active ✅" : "Monitoring Paused ⏸️"}</span>
          </button>

          {(role === "admin" || role === "hr" || role === "manager") && (
            <button
              onClick={handleTriggerManualScreenshot}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-lg flex items-center gap-1.5 border border-blue-500/40 cursor-pointer"
            >
              <FaCamera />
              <span>Capture Snapshot Now</span>
            </button>
          )}
        </div>
      </div>

      {/* Transparency Disclaimer Notice */}
      <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 text-xs">
        <FaInfoCircle className="text-blue-600 text-lg shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-blue-950 text-sm">Transparent Monitoring Disclosure Notice</h3>
          <p className="text-blue-900 text-xs mt-0.5 leading-relaxed">
            <strong>Employees & Remote Students Notice:</strong> Transparent monitoring is enabled for remote work sessions.
            The system periodically captures <strong>random desktop screenshots every 5–15 minutes</strong>, logs application usage percentages, and measures active work time. Sensitive personal passwords and private bank tabs are automatically masked.
          </p>
        </div>
      </div>

      {/* Top 3 Summary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        {/* Widget 1: Screenshots Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 font-semibold">
            <span>Random Screenshots Captured Today</span>
            <FaCamera className="text-blue-600 text-lg" />
          </div>
          <p className="text-2xl font-black text-slate-900">{screenshots.length} Snapshots</p>
          <p className="text-[11px] text-emerald-700 font-bold">Random Interval: 5–15 Minutes</p>
        </div>

        {/* Widget 2: Active Work Time */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 font-semibold">
            <span>Total Active Remote Work Time</span>
            <FaClock className="text-purple-600 text-lg" />
          </div>
          <p className="text-2xl font-black text-slate-900">5h 42m</p>
          <p className="text-[11px] text-purple-700 font-bold">Activity Rate: 94.2% Active</p>
        </div>

        {/* Widget 3: Primary Work App */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 font-semibold">
            <span>Top Productive Application</span>
            <FaChartPie className="text-emerald-600 text-lg" />
          </div>
          <p className="text-2xl font-black text-slate-900">VS Code (55%)</p>
          <p className="text-[11px] text-slate-500">MERN Stack Coding & Next.js</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Columns: Screenshots Gallery (Random 5-15m Intervals) */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FaCamera className="text-blue-600" />
                <span>Random Desktop Screenshots (5–15 Mins Interval)</span>
              </h2>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                Transparent Capture Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {screenshots.map((sc) => (
                <div
                  key={sc.id}
                  onClick={() => setSelectedImageModal(sc)}
                  className="group relative rounded-xl border border-slate-200 overflow-hidden bg-slate-900 cursor-pointer shadow-xs hover:shadow-md transition-all"
                >
                  <img
                    src={sc.previewUrl}
                    alt="Screenshot Preview"
                    className="w-full h-40 object-cover group-hover:scale-105 transition-all duration-300 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent p-3 flex flex-col justify-end text-white">
                    <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-wide">
                      {sc.timestamp}
                    </span>
                    <p className="font-bold text-xs line-clamp-1">{sc.capturedApp}</p>
                    <span className="text-[10px] text-emerald-400 font-semibold mt-0.5">{sc.activityLevel}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* App Usage Analytics Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <FaChartPie className="text-purple-600" />
              <span>Application Usage Breakdown Analytics</span>
            </h2>

            <div className="space-y-3 text-xs">
              {appUsage.map((app) => (
                <div key={app.name} className="space-y-1">
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>{app.name}</span>
                    <span className="font-bold text-slate-900">{app.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className={`${app.color} h-full rounded-full`} style={{ width: `${app.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Work Activity Timeline */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FaHistory className="text-emerald-600" />
                <span>Work Timeline & Logs</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time activity score tracking</p>
            </div>

            <div className="space-y-3 text-xs">
              {timeline.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{item.time}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold">
                      {item.activityScore}% Active
                    </span>
                  </div>
                  <p className="font-semibold text-slate-800 text-[11px]">{item.app}</p>
                  <span className="text-[10px] text-slate-500 block">Status: {item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FULL SCREENSHOT INSPECTION MODAL */}
      {selectedImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded border border-blue-300">
                  {selectedImageModal.timestamp}
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-1">{selectedImageModal.capturedApp}</h3>
              </div>
              <button onClick={() => setSelectedImageModal(null)} className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1">✕</button>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950">
              <img src={selectedImageModal.previewUrl} alt="Enlarged Desktop Screenshot" className="w-full h-96 object-contain" />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
              <span><strong>Activity Level:</strong> {selectedImageModal.activityLevel}</span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                ✅ Privacy Compliant & Transparent Log
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
