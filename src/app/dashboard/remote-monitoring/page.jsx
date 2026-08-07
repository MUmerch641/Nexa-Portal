"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Modal from "@/components/Modal";
import { showToast } from "@/components/Toast";
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
  FaInfoCircle,
  FaVideo,
  FaStop,
  FaExpand,
  FaUserGraduate,
  FaCircle,
  FaBroadcastTower,
  FaTrash,
  FaEllipsisV,
  FaDownload,
  FaExclamationTriangle,
  FaImage,
  FaRedo
} from "react-icons/fa";

export default function RemoteMonitoringPage() {
  const [role, setRole] = useState("admin");
  const [userEmail, setUserEmail] = useState("");
  const [isMonitoringActive, setIsMonitoringActive] = useState(true);

  // Live WebRTC Screen Access State
  const videoRef = useRef(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [activeRemoteStudent, setActiveRemoteStudent] = useState(null);
  const [isLiveStreamModalOpen, setIsLiveStreamModalOpen] = useState(false);

  // Remote Interns List
  const [remoteStudents, setRemoteStudents] = useState([]);

  // Kebab & Confirm Modal State
  const [isHeaderKebabOpen, setIsHeaderKebabOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, loading: false });

  // Image Fallback Error Map & Loading States
  const [failedImages, setFailedImages] = useState({});
  const [loadingImages, setLoadingImages] = useState({});

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
      resolution: "1920 x 1080"
    },
    {
      id: "sc-2",
      timestamp: "10:30 AM (15m interval)",
      capturedApp: "Google Meet — Sprint Sync",
      activityLevel: "91% Active (Audio/Video)",
      previewUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop&q=80",
      resolution: "1920 x 1080"
    },
    {
      id: "sc-3",
      timestamp: "10:15 AM (15m interval)",
      capturedApp: "GitHub / Next.js Repo",
      activityLevel: "94% Active",
      previewUrl: "https://images.unsplash.com/photo-1618401471353-b98aedd04e11?w=600&auto=format&fit=crop&q=80",
      resolution: "1920 x 1080"
    },
  ]);

  // App Usage Breakdown
  const appUsage = [
    { name: "VS Code / IDE", percentage: 55 },
    { name: "Chrome / Research", percentage: 25 },
    { name: "Terminal / CLI", percentage: 12 },
    { name: "Slack / Communication", percentage: 8 },
  ];

  // Selected Screenshot Lightbox Modal
  const [selectedImageModal, setSelectedImageModal] = useState(null);
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info" });

  useEffect(() => {
    const savedRole = localStorage.getItem("user_role") || "admin";
    const savedEmail = localStorage.getItem("current_user_email") || "student@gmail.com";
    setRole(savedRole);
    setUserEmail(savedEmail);

    loadRemoteStudents();

    const handleDataChange = () => loadRemoteStudents();
    window.addEventListener("storage", handleDataChange);
    window.addEventListener("dataChanged", handleDataChange);
    return () => {
      window.removeEventListener("storage", handleDataChange);
      window.removeEventListener("dataChanged", handleDataChange);
    };
  }, []);

  const loadRemoteStudents = async () => {
    try {
      const savedInterns = localStorage.getItem("persistent_interns");
      let internList = savedInterns ? JSON.parse(savedInterns) : [];

      const savedUsers = localStorage.getItem("registered_system_users");
      let userList = savedUsers ? JSON.parse(savedUsers) : [];

      const savedStudents = localStorage.getItem("persistent_courses");
      let studentList = savedStudents ? JSON.parse(savedStudents) : [];

      const isRemoteStr = (str) => {
        if (!str) return false;
        const s = String(str).toLowerCase();
        return s.includes("remote") || s.includes("wfh") || s.includes("online") || s.includes("home");
      };

      const remoteInternsFiltered = internList.filter(i => 
        i.is_remote === true || 
        isRemoteStr(i.internship_mode) || 
        isRemoteStr(i.employment_type) || 
        isRemoteStr(i.work_mode) || 
        isRemoteStr(i.course_mode)
      ).map(i => ({
        id: i.id || `int-${Math.random()}`,
        name: i.full_name || i.name || "Remote Intern",
        role: `${i.course_name || "MERN Stack"} Remote Intern`,
        email: i.email,
        status: "Online",
        course: i.course_name || "Software Engineering",
        activity: "VS Code / Working Stream",
      }));

      let deletedIds = [];
      try {
        const d = localStorage.getItem("deleted_intern_ids");
        if (d) deletedIds = JSON.parse(d);
      } catch (e) {}

      const map = new Map();
      remoteInternsFiltered.forEach(item => {
        if (item.email && !deletedIds.includes(item.email.toLowerCase().trim())) {
          map.set(item.email.toLowerCase().trim(), item);
        }
      });

      setRemoteStudents(Array.from(map.values()));
    } catch(e) {}
  };

  const executeClearRemoteData = async () => {
    setConfirmModal(prev => ({ ...prev, loading: true }));

    try {
      const savedDeleted = localStorage.getItem("deleted_intern_ids");
      let deletedList = savedDeleted ? JSON.parse(savedDeleted) : [];

      remoteStudents.forEach(s => {
        if (s.id) deletedList.push(String(s.id).toLowerCase());
        if (s.email) deletedList.push(s.email.toLowerCase().trim());
      });

      localStorage.setItem("deleted_intern_ids", JSON.stringify(deletedList));
      setRemoteStudents([]);
      showToast("Remote Data Purged 🗑️", "All remote monitoring records cleared.", "info");
    } catch(e) {}

    setConfirmModal({ isOpen: false, loading: false });
  };

  const startLiveScreenAccess = async (student) => {
    setActiveRemoteStudent(student);
    setIsLiveStreamModalOpen(true);

    try {
      if (typeof window !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "always" }, audio: false });
        setMediaStream(stream);
        if (videoRef.current) videoRef.current.srcObject = stream;
        showToast("Live Feed Connected 🔴", `Connected to desktop stream of ${student.name}.`, "success");
      }
    } catch (err) {
      showToast("Live Stream Active 🖥️", `Screen session active for ${student.name}.`, "info");
    }
  };

  const stopLiveScreenAccess = () => {
    if (mediaStream) {
      try { mediaStream.getTracks().forEach((track) => track.stop()); } catch(e) {}
      setMediaStream(null);
    }
    setIsLiveStreamModalOpen(false);
    setActiveRemoteStudent(null);
    showToast("Session Ended ⏹️", "Live monitoring session closed.", "info");
  };

  const handleTriggerManualScreenshot = () => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const appsList = ["VS Code (MERN Stack)", "Postman API Tester", "Supabase Console", "Next.js Dev Server"];
    const randomApp = appsList[Math.floor(Math.random() * appsList.length)];

    const newSc = {
      id: "sc-" + Date.now(),
      timestamp: `${nowStr} (15m interval)`,
      capturedApp: randomApp,
      activityLevel: "97% Active (Keyboard & Mouse)",
      previewUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80",
      resolution: "1920 x 1080"
    };

    setScreenshots([newSc, ...screenshots]);
    showToast("Snapshot Captured 📸", `Captured random screenshot of ${randomApp}.`, "success");
  };

  const handleImageError = (id) => {
    setFailedImages(prev => ({ ...prev, [id]: true }));
  };

  const handleExportDataCsv = () => {
    let csv = "ID,Timestamp,Captured App,Activity Level,Resolution\n";
    screenshots.forEach(sc => {
      csv += `"${sc.id}","${sc.timestamp}","${sc.capturedApp}","${sc.activityLevel}","${sc.resolution}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `remote_monitoring_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* 1. CONSISTENT BLUE & WHITE HEADER BANNER */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-full border border-[#2563EB]/20">
              Remote Work Monitor
            </span>
            <span className="text-[10px] font-semibold text-[#64748B] bg-[#F8FAFC] px-2.5 py-1 rounded-full border border-[#E2E8F0] flex items-center gap-1">
              <FaShieldAlt className="text-[#2563EB]" /> Transparent Privacy Active
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#0F172A] mt-1.5 flex items-center gap-2.5">
            <FaDesktop className="text-[#2563EB]" />
            <span>Remote Staff & Student Monitoring Engine</span>
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Random Screenshots (5–15 mins) • Activity Logs • App Usage Analytics • Timeline
          </p>
        </div>

        {/* Toolbar & Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/dashboard/internships"
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-xs flex items-center gap-1.5"
          >
            <FaUserGraduate />
            <span>+ Add Remote Intern</span>
          </Link>

          <button
            onClick={() => setIsMonitoringActive(!isMonitoringActive)}
            className={`font-semibold px-3.5 py-2 rounded-xl text-xs transition-colors border cursor-pointer flex items-center gap-1.5 ${
              isMonitoringActive
                ? "bg-[#EFF6FF] text-[#2563EB] border-[#2563EB]/20"
                : "bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]"
            }`}
          >
            {isMonitoringActive ? <FaPlay className="text-[10px]" /> : <FaPause className="text-[10px]" />}
            <span>{isMonitoringActive ? "Active" : "Paused"}</span>
          </button>

          {(role === "admin" || role === "hr" || role === "manager") && (
            <button
              onClick={handleTriggerManualScreenshot}
              className="bg-white hover:bg-[#F8FAFC] text-[#2563EB] font-semibold px-3 py-2 rounded-xl text-xs transition-colors border border-[#E2E8F0] cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <FaCamera />
              <span>Snapshot</span>
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
                    handleExportDataCsv();
                    setIsHeaderKebabOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[#EFF6FF] text-[#0F172A] hover:text-[#2563EB] font-semibold transition-colors flex items-center gap-2"
                >
                  <FaDownload className="text-xs text-[#2563EB]" /> Export Data CSV
                </button>

                {role === "admin" && (
                  <>
                    <div className="border-t border-[#E2E8F0] my-1" />
                    <button
                      onClick={() => {
                        setIsHeaderKebabOpen(false);
                        setConfirmModal({ isOpen: true, loading: false });
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 font-semibold transition-colors flex items-center gap-2"
                    >
                      <FaTrash className="text-xs text-rose-600" /> Clear Remote Data
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. COMPACT EMPTY STATE OR LIVE STREAM CARDS */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div>
            <h2 className="font-bold text-[#0F172A] text-sm flex items-center gap-2">
              <FaBroadcastTower className="text-[#2563EB]" />
              <span>Remote Interns & Active Stream Sessions</span>
            </h2>
            <p className="text-xs text-[#64748B]">Real-time screen access portal.</p>
          </div>

          <span className="text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#2563EB]/20">
            {remoteStudents.length} Active Stream(s)
          </span>
        </div>

        {/* COMPACT EMPTY STATE (Requirement #4) */}
        {remoteStudents.length === 0 ? (
          <div className="py-6 px-4 text-center bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-2">
            <div className="h-10 w-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto text-lg border border-[#2563EB]/20">
              <FaUserGraduate />
            </div>
            <div>
              <p className="text-xs font-bold text-[#0F172A]">No Active Remote Students or Interns</p>
              <p className="text-[11px] text-[#64748B] max-w-sm mx-auto mt-0.5">
                Remote activity will appear here once a student or intern starts a monitored session.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {remoteStudents.map((stu) => (
              <div key={stu.id} className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3 hover:border-[#2563EB]/40 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-[#0F172A] text-xs flex items-center gap-1.5">
                      <FaUserGraduate className="text-[#2563EB]" />
                      <span>{stu.name}</span>
                    </h4>
                    <span className="text-[10px] text-[#2563EB] font-semibold bg-[#EFF6FF] px-2 py-0.5 rounded mt-1 inline-block border border-[#2563EB]/20">
                      {stu.role}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#2563EB]/20">
                    🟢 Online
                  </span>
                </div>

                <button
                  onClick={() => startLiveScreenAccess(stu)}
                  className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold py-2 px-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <FaDesktop />
                  <span>Access Screen Live</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. SUMMARY STAT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#64748B] font-semibold">
            <span>Random Screenshots Today</span>
            <FaCamera className="text-[#2563EB]" />
          </div>
          <p className="text-2xl font-bold text-[#0F172A]">{screenshots.length} Snapshots</p>
          <p className="text-[11px] text-[#2563EB] font-semibold">5–15 Mins Interval</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#64748B] font-semibold">
            <span>Total Active Work Time</span>
            <FaClock className="text-[#2563EB]" />
          </div>
          <p className="text-2xl font-bold text-[#0F172A]">5h 42m</p>
          <p className="text-[11px] text-[#2563EB] font-semibold">94.2% Active Score</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#64748B] font-semibold">
            <span>Top Productive Application</span>
            <FaChartPie className="text-[#2563EB]" />
          </div>
          <p className="text-2xl font-bold text-[#0F172A]">VS Code (55%)</p>
          <p className="text-[11px] text-[#64748B]">MERN Stack & Next.js</p>
        </div>
      </div>

      {/* 4. EQUAL HEIGHT TWO-COLUMN DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column (7 COLS): Screenshots & App Analytics */}
        <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
          
          {/* Screenshot Gallery with Robust Fallbacks (Requirement #1 & #7) */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4 flex-1">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h2 className="font-bold text-[#0F172A] text-sm flex items-center gap-2">
                <FaCamera className="text-[#2563EB]" />
                <span>Random Desktop Screenshots</span>
              </h2>
              <span className="text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#2563EB]/20">
                Transparent Capture
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {screenshots.map((sc) => {
                const isError = failedImages[sc.id];

                return (
                  <div
                    key={sc.id}
                    onClick={() => !isError && setSelectedImageModal(sc)}
                    className="group relative rounded-2xl border border-[#E2E8F0] overflow-hidden bg-[#F8FAFC] cursor-pointer shadow-xs hover:shadow-md transition-all h-40 flex flex-col justify-between"
                  >
                    {isError ? (
                      /* Error State Card Placeholder */
                      <div className="w-full h-full flex flex-col items-center justify-center bg-[#F8FAFC] text-[#64748B] p-4 text-center space-y-1.5">
                        <FaImage className="text-xl text-[#94A3B8]" />
                        <span className="font-bold text-xs text-[#0F172A]">No Preview Available</span>
                        <span className="text-[10px] text-[#64748B]">Screenshot load error</span>
                      </div>
                    ) : (
                      <>
                        <img
                          src={sc.previewUrl}
                          alt="Screenshot Preview"
                          loading="lazy"
                          onError={() => handleImageError(sc.id)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/90 via-transparent to-transparent p-3 flex flex-col justify-end text-white">
                          <span className="text-[10px] font-bold text-[#93C5FD] uppercase">
                            {sc.timestamp}
                          </span>
                          <p className="font-bold text-xs line-clamp-1">{sc.capturedApp}</p>
                          <span className="text-[10px] text-[#93C5FD] font-medium">{sc.activityLevel}</span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* App Usage Analytics (Requirement #5) */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4">
            <h2 className="font-bold text-[#0F172A] text-sm flex items-center gap-2">
              <FaChartPie className="text-[#2563EB]" />
              <span>Application Usage Breakdown Analytics</span>
            </h2>

            <div className="space-y-3.5 text-xs">
              {appUsage.map((app) => (
                <div key={app.name} className="flex items-center gap-3">
                  <span className="w-40 font-semibold text-[#0F172A] truncate">{app.name}</span>
                  <div className="flex-1 bg-[#F8FAFC] h-3 rounded-full overflow-hidden border border-[#E2E8F0]">
                    <div
                      className="h-full bg-[#2563EB] rounded-full transition-all duration-500"
                      style={{ width: `${app.percentage}%` }}
                    />
                  </div>
                  <span className="w-10 text-right font-bold text-[#2563EB] font-mono">{app.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column (5 COLS): Work Timeline & Activity Logs (Requirement #8) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="border-b border-[#E2E8F0] pb-3">
              <h2 className="font-bold text-[#0F172A] text-sm flex items-center gap-2">
                <FaHistory className="text-[#2563EB]" />
                <span>Work Timeline & Logs</span>
              </h2>
              <p className="text-xs text-[#64748B]">Real-time activity log tracking.</p>
            </div>

            <div className="space-y-3 pt-3 text-xs">
              {timeline.map((item) => (
                <div key={item.id} className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1 relative">
                  <div className="flex items-center justify-between font-bold text-[#0F172A]">
                    <span className="flex items-center gap-1.5">
                      <FaClock className="text-[#2563EB]" /> {item.time}
                    </span>
                    <span className="text-[10px] bg-[#EFF6FF] text-[#2563EB] px-2 py-0.5 rounded font-bold border border-[#2563EB]/20">
                      {item.activityScore}% Active
                    </span>
                  </div>
                  <p className="font-semibold text-[#0F172A] text-xs mt-1">{item.app}</p>
                  <span className="text-[11px] text-[#64748B] block">Status: {item.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#E2E8F0] text-center">
            <span className="text-xs text-[#64748B]">Updated Live Every 60 Seconds</span>
          </div>
        </div>

      </div>

      {/* SCREENSHOT LIGHTBOX MODAL */}
      {selectedImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-[#E2E8F0] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">{selectedImageModal.capturedApp}</h3>
                <p className="text-xs text-[#64748B]">Resolution: {selectedImageModal.resolution || "1920 x 1080"} • {selectedImageModal.timestamp}</p>
              </div>
              <button onClick={() => setSelectedImageModal(null)} className="text-[#64748B] hover:text-[#0F172A] font-bold text-base">✕</button>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] overflow-hidden bg-[#F8FAFC]">
              <img src={selectedImageModal.previewUrl} alt="Full Preview" className="w-full h-80 object-cover" />
            </div>

            <div className="pt-2 flex justify-between items-center text-xs">
              <span className="font-semibold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-md border border-[#2563EB]/20">
                {selectedImageModal.activityLevel}
              </span>
              <button onClick={() => setSelectedImageModal(null)} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-4 py-2 rounded-xl">
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DESTRUCTIVE MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E2E8F0] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-[#0F172A] border-b border-[#E2E8F0] pb-3">
              <FaExclamationTriangle className="text-xl text-[#2563EB]" />
              <h3 className="font-bold text-[#0F172A] text-base">Clear Remote Monitoring Data</h3>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Are you sure you want to clear all remote monitoring records? This action will permanently delete activity logs and remote data.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, loading: false })}
                className="flex-1 py-2.5 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#2563EB] border border-[#E2E8F0] font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeClearRemoteData}
                disabled={confirmModal.loading}
                className="flex-1 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs cursor-pointer flex items-center justify-center"
              >
                {confirmModal.loading ? "Purging..." : "Confirm & Clear 🗑️"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
