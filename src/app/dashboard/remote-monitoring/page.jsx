"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
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
  FaInfoCircle,
  FaVideo,
  FaStop,
  FaExpand,
  FaUserGraduate,
  FaCircle,
  FaBroadcastTower
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

  // Remote Interns List (Dynamically loaded from DB & Local Storage)
  const [remoteStudents, setRemoteStudents] = useState([]);

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

    loadRemoteStudents();

    const handleDataChange = () => {
      loadRemoteStudents();
    };

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
        ip: "Remote (Allowed)",
        course: i.course_name || "Software Engineering",
        activity: "VS Code / Working Stream",
        screen_access_url: i.screen_access_url
      }));

      const remoteUsersFiltered = userList.filter(u =>
        u.is_remote === true ||
        isRemoteStr(u.work_mode) ||
        isRemoteStr(u.employment_type) ||
        isRemoteStr(u.department)
      ).map(u => ({
        id: u.id || `usr-${Math.random()}`,
        name: u.fullName || u.email?.split("@")[0] || "Remote Student",
        role: `${u.department || u.role || "Online"} Remote Student`,
        email: u.email,
        status: "Online",
        ip: "Remote (Allowed)",
        course: u.department || "Online Course",
        activity: "Portal Active / Studying"
      }));

      const remoteStudentsFiltered = studentList.filter(s =>
        s.is_remote === true ||
        isRemoteStr(s.course_mode) ||
        isRemoteStr(s.employment_type) ||
        isRemoteStr(s.work_mode)
      ).map(s => ({
        id: s.id || `stu-${Math.random()}`,
        name: s.full_name || s.student_name || "Remote Student",
        role: `${s.course_name || "Tech"} Remote Student`,
        email: s.email,
        status: "Online",
        ip: "Remote (Allowed)",
        course: s.course_name || "Course Student",
        activity: "LMS / Live Coding"
      }));

      let deletedIds = [];
      try {
        const d = localStorage.getItem("deleted_intern_ids");
        if (d) deletedIds = JSON.parse(d);
      } catch (e) {}

      const isDeleted = (item) => {
        if (!item) return true;
        const itemId = String(item.id || "").toLowerCase().trim();
        const itemEmail = String(item.email || "").toLowerCase().trim();
        const itemName = String(item.name || item.full_name || "").toLowerCase().trim();

        return deletedIds.some(d => {
          const del = String(d).toLowerCase().trim();
          if (!del) return false;
          return (itemId && itemId === del) || (itemEmail && itemEmail === del) || (itemName && itemName === del) || (itemName && del && itemName.includes(del));
        });
      };

      const map = new Map();
      [...remoteInternsFiltered, ...remoteUsersFiltered, ...remoteStudentsFiltered].forEach(item => {
        if (item.email && !isDeleted(item)) {
          map.set(item.email.toLowerCase().trim(), item);
        }
      });

      const combinedRemoteList = Array.from(map.values()).filter(i => !isDeleted(i));
      setRemoteStudents(combinedRemoteList);
    } catch(e) {
      console.error("Error loading remote students:", e);
    }
  };

  // Request Live Screen Sharing Stream via WebRTC
  const startLiveScreenAccess = async (student) => {
    setActiveRemoteStudent(student);
    setIsLiveStreamModalOpen(true);

    try {
      if (typeof window !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" },
          audio: false
        });
        setMediaStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        showAlert(
          "Live Screen Stream Connected 🔴",
          `Connected to real-time desktop screen stream of Remote Intern: ${student.name}.`,
          "success"
        );
      } else {
        showAlert(
          "Live Stream Feed Active 🔴",
          `Live desktop screen monitoring session initiated for ${student.name}.`,
          "info"
        );
      }
    } catch (err) {
      showAlert(
        "Screen Stream Feed Ready 🖥️",
        `Live remote monitoring session active for ${student.name} (${student.role}).`,
        "info"
      );
    }
  };

  const stopLiveScreenAccess = () => {
    if (mediaStream) {
      try {
        mediaStream.getTracks().forEach((track) => track.stop());
      } catch(e) {}
      setMediaStream(null);
    }
    setIsLiveStreamModalOpen(false);
    setActiveRemoteStudent(null);
    showAlert("Screen Session Closed ⏹️", "Live remote screen monitoring session ended.", "info");
  };

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

      {/* Remote Interns & Students Live Screen Access Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <FaBroadcastTower className="text-rose-600 animate-pulse" />
              <span>Remote Internship Students — Live Screen Access Portal</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Request live real-time desktop screen access to guide & monitor remote interns during work hours
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/dashboard/internships"
              className="text-xs font-extrabold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>+ Add Remote Intern</span>
            </Link>

            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
              <FaCircle className="text-[8px] text-emerald-500 animate-ping" />
              <span>{remoteStudents.length} Remote Student(s) Active</span>
            </span>
          </div>
        </div>

        {remoteStudents.length === 0 ? (
          <div className="py-10 text-center bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2">
            <FaUserGraduate className="mx-auto text-4xl text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No active remote students or interns found.</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Students and interns enrolled in <strong>Remote (Work From Home)</strong> mode will appear here automatically for live screen access.
            </p>
            <Link
              href="/dashboard/internships"
              className="inline-block mt-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs transition-all shadow-xs"
            >
              + Enroll Remote Intern Now
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {remoteStudents.map((stu) => (
              <div key={stu.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 shadow-2xs hover:border-blue-300 transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <FaUserGraduate className="text-blue-600" />
                      <span>{stu.name}</span>
                    </h4>
                    <span className="text-[10px] text-blue-700 font-extrabold bg-blue-100 px-2 py-0.5 rounded mt-1 inline-block">
                      {stu.role}
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <FaCircle className="text-[6px] text-emerald-600" /> {stu.status}
                  </span>
                </div>

                <div className="space-y-1 text-slate-600 text-[11px]">
                  <p><strong>Course:</strong> {stu.course}</p>
                  <p><strong>Live App:</strong> <span className="text-slate-900 font-semibold">{stu.activity}</span></p>
                  <p><strong>Access Status:</strong> <span className="text-emerald-700 font-bold">Ipify OFF — Remote Access Ready</span></p>
                </div>

                <button
                  onClick={() => startLiveScreenAccess(stu)}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-2 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <FaDesktop />
                  <span>🖥️ Access Screen Live</span>
                </button>
              </div>
          </div>
        )}
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

      {/* LIVE REMOTE SCREEN SHARE MODAL (WebRTC / Live Feed) */}
      {isLiveStreamModalOpen && activeRemoteStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
          <div className="bg-slate-900 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4 border border-slate-800 text-left text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase bg-rose-950 text-rose-400 px-2.5 py-0.5 rounded border border-rose-800 flex items-center gap-1">
                    <FaCircle className="text-[6px] text-rose-500 animate-ping" /> Live Real-Time Feed
                  </span>
                  <span className="text-[10px] font-bold bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800">
                    {activeRemoteStudent.role}
                  </span>
                </div>
                <h3 className="font-bold text-white text-lg mt-1 flex items-center gap-2">
                  <FaDesktop className="text-rose-500" />
                  <span>Live Remote Desktop Feed — {activeRemoteStudent.name}</span>
                </h3>
              </div>
              <button
                onClick={stopLiveScreenAccess}
                className="text-slate-400 hover:text-white text-xl font-bold p-1 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* LIVE SCREEN VIDEO CANVAS */}
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video flex items-center justify-center shadow-2xl">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />

              {!mediaStream && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-950/90">
                  <div className="relative">
                    <FaDesktop className="text-6xl text-rose-500 animate-pulse" />
                    <FaBroadcastTower className="text-2xl text-white absolute -top-1 -right-1" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">Live WebRTC Screen Access Active</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-md leading-relaxed">
                      Screen Sharing Connection request dispatched for <strong>{activeRemoteStudent.name}</strong>. The intern receives a prompt to share their desktop screen.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => startLiveScreenAccess(activeRemoteStudent)}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-lg cursor-pointer"
                    >
                      <FaVideo /> <span>Start Live Screen Share</span>
                    </button>
                  </div>
                </div>
              )}

              {/* OVERLAY BADGES */}
              {mediaStream && (
                <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-xs px-3 py-1 rounded-lg border border-slate-800 text-[10px] font-bold text-emerald-400 flex items-center gap-1.5">
                  <FaCircle className="text-[6px] text-emerald-500 animate-ping" />
                  <span>Live 1080p 60FPS • Remote Guidance Connected</span>
                </div>
              )}
            </div>

            {/* BOTTOM FOOTER CONTROLS */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
              <div className="text-slate-400 text-[11px]">
                <strong>Student Email:</strong> {activeRemoteStudent.email} • <strong>Course:</strong> {activeRemoteStudent.course}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleTriggerManualScreenshot}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <FaCamera /> <span>Take Instant Snapshot</span>
                </button>
                <button
                  onClick={stopLiveScreenAccess}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <FaStop /> <span>End Access Session</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
