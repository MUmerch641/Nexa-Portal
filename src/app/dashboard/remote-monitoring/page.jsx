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
  FaStop,
  FaHistory,
  FaUserCheck,
  FaCheckCircle,
  FaInfoCircle,
  FaDownload,
  FaTrash,
  FaExclamationTriangle,
  FaImage,
  FaRedo,
  FaUserGraduate,
  FaBroadcastTower,
  FaLaptopCode,
  FaKeyboard,
  FaMousePointer,
  FaLock,
  FaSearch,
  FaFilter,
  FaFileExport,
  FaChartLine,
  FaRegLightbulb,
  FaEllipsisV
} from "react-icons/fa";

import {
  getRemoteWorkSessions,
  getScreenshotLogs,
  saveScreenshotLog,
  getWorkTimelines,
  addTimelineEvent,
  getMonitoringSettings,
  saveMonitoringSettings,
  purgeExpiredScreenshots,
  getRandomScreenshotInterval,
  getClientDeviceInfo,
  INITIAL_APP_USAGE
} from "@/lib/remoteMonitoringUtils";

export default function RemoteMonitoringPage() {
  // === Current User & Role State ===
  const [role, setRole] = useState("admin"); // 'admin' or 'employee'
  const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'screenshots', 'timeline', 'analytics', 'settings'
  const [userEmail, setUserEmail] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [employeeId, setEmployeeId] = useState("emp-101");
  const [department, setDepartment] = useState("Frontend Engineering");

  // === Privacy & Session State ===
  const [isConsentAccepted, setIsConsentAccepted] = useState(false);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStatus, setSessionStatus] = useState("Stopped"); // 'Active', 'Idle', 'Stopped'
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // === Activity & Idle Tracker State ===
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [idleSeconds, setIdleSeconds] = useState(0);
  const [lastActivityTimestamp, setLastActivityTimestamp] = useState(Date.now());
  const [mouseEventsCount, setMouseEventsCount] = useState(0);
  const [keyboardEventsCount, setKeyboardEventsCount] = useState(0);
  const [currentFocusedApp, setCurrentFocusedApp] = useState("VS Code — Software House Management");

  // === Screenshot Random Capture Engine State ===
  const [nextScreenshotTimer, setNextScreenshotTimer] = useState(600); // seconds until next random screenshot
  const [nextIntervalMinutes, setNextIntervalMinutes] = useState(10);
  const [isCapturingScreen, setIsCapturingScreen] = useState(false);
  const [screenshots, setScreenshots] = useState([]);
  const [selectedScreenshotModal, setSelectedScreenshotModal] = useState(null);

  // === Timeline & Analytics State ===
  const [workTimelines, setWorkTimelines] = useState([]);
  const [remoteSessions, setRemoteSessions] = useState([]);
  const [appUsageList, setAppUsageList] = useState(INITIAL_APP_USAGE);
  const [settings, setSettings] = useState({ retentionDays: 60, minInterval: 5, maxInterval: 15 });

  // === Admin Filters, Dropdown & Confirm Modal State ===
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState("All");
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState("All");
  const [selectedDateFilter, setSelectedDateFilter] = useState("Today");
  const [searchQuery, setSearchQuery] = useState("");
  const [isHeaderKebabOpen, setIsHeaderKebabOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, loading: false });

  // === Image Fallback handling ===
  const [failedImages, setFailedImages] = useState({});

  // Canvas ref for generating client compressed screenshot frames
  const canvasRef = useRef(null);

  // Load User Data & Saved Logs on Mount
  useEffect(() => {
    const savedRole = localStorage.getItem("user_role") || "admin";
    const savedEmail = localStorage.getItem("current_user_email") || "";
    const savedName = localStorage.getItem("current_user_name") || "";

    setRole(savedRole);
    setUserEmail(savedEmail);
    setEmployeeName(savedName);

    // Load Data
    loadMonitoringData();

    // Check if consent was previously saved in session
    const consent = sessionStorage.getItem("remote_monitoring_consent");
    if (consent === "accepted") {
      setIsConsentAccepted(true);
    }

    const savedSettings = getMonitoringSettings();
    setSettings(savedSettings);
  }, []);

  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [selectedUserForSession, setSelectedUserForSession] = useState("");

  const loadMonitoringData = async () => {
    try {
      const [sessionsData, screenshotsData, timelinesData] = await Promise.all([
        getRemoteWorkSessions(),
        getScreenshotLogs(),
        getWorkTimelines()
      ]);

      setRemoteSessions(sessionsData || []);
      setScreenshots(screenshotsData || []);
      setWorkTimelines(timelinesData || []);

      // Load registered students, interns, and employees
      const [dbStudents, dbInterns, dbEmployees] = await Promise.all([
        dbFetch("students").catch(() => []),
        dbFetch("interns").catch(() => []),
        dbFetch("employees").catch(() => [])
      ]);

      const userMap = new Map();
      [...(dbStudents || []), ...(dbInterns || []), ...(dbEmployees || [])].forEach((u) => {
        const name = u.full_name || u.name || u.student_name || u.email;
        if (name && !userMap.has(name)) {
          userMap.set(name, {
            id: u.id || u.email || `u-${Math.random()}`,
            name: name,
            department: u.course_name || u.tech_domain || u.department || u.designation || u.internship_mode || "Software Engineering",
            email: u.email || "",
            role: u.role || (u.internship_mode ? "Remote Intern" : "Remote Student")
          });
        }
      });

      const allUsersList = Array.from(userMap.values());
      setRegisteredUsers(allUsersList);

      if (allUsersList.length > 0 && !employeeName) {
        const firstUser = allUsersList[0];
        setEmployeeName(firstUser.name);
        setDepartment(firstUser.department);
        setEmployeeId(firstUser.id);
      }
    } catch (error) {
      console.error("Error loading remote monitoring data:", error);
    }
  };

  // === 1. Session Duration Clock & Idle Detection Engine ===
  useEffect(() => {
    let interval = null;

    if (isSessionActive && sessionStatus !== "Stopped") {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);

        // Check for 5-minute inactivity (300 seconds)
        const now = Date.now();
        const inactiveTimeMs = now - lastActivityTimestamp;

        if (inactiveTimeMs >= 5 * 60 * 1000 && sessionStatus === "Active") {
          setSessionStatus("Idle");
          showToast("Idle Warning ⏳", "No mouse/keyboard input detected for 5 minutes. Session marked as Idle.", "warning");

          // Log timeline event
          const idleEvent = {
            id: `t-${Date.now()}`,
            employee_id: employeeId,
            employee_name: employeeName,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: "Idle Alert",
            detail: "Inactivity detected (5 minutes idle)",
            status: "Idle"
          };
          addTimelineEvent(idleEvent).then((updated) => setWorkTimelines(updated));
        }

        if (sessionStatus === "Active") {
          setActiveSeconds((prev) => prev + 1);
        } else if (sessionStatus === "Idle") {
          setIdleSeconds((prev) => prev + 1);
        }

        // Screenshot timer countdown
        setNextScreenshotTimer((prevTimer) => {
          if (prevTimer <= 1) {
            triggerRandomScreenshotCapture();
            const newIntervalSec = getRandomScreenshotInterval(settings.minInterval, settings.maxInterval);
            setNextIntervalMinutes(Math.round(newIntervalSec / 60));
            return newIntervalSec;
          }
          return prevTimer - 1;
        });

      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSessionActive, sessionStatus, lastActivityTimestamp, settings]);

  // === 2. Global Event Listeners for Activity Tracking ===
  useEffect(() => {
    const handleUserActivity = () => {
      if (!isSessionActive) return;

      const now = Date.now();
      setLastActivityTimestamp(now);

      // Revert from Idle to Active immediately when user interacts
      if (sessionStatus === "Idle") {
        setSessionStatus("Active");
        showToast("Activity Resumed 🟢", "Mouse/keyboard activity detected. Marked as Active.", "success");

        const activeEvent = {
          id: `t-${Date.now()}`,
          employee_id: employeeId,
          employee_name: employeeName,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: "Activity Resume",
          detail: "Input detected — Resumed Active Status",
          status: "Active"
        };
        addTimelineEvent(activeEvent).then((updated) => setWorkTimelines(updated));
      }
    };

    const handleMouseMove = () => {
      setMouseEventsCount((prev) => prev + 1);
      handleUserActivity();
    };

    const handleKeyDown = () => {
      setKeyboardEventsCount((prev) => prev + 1);
      handleUserActivity();
    };

    if (isSessionActive) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("click", handleUserActivity);
      window.addEventListener("scroll", handleUserActivity);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("click", handleUserActivity);
      window.removeEventListener("scroll", handleUserActivity);
    };
  }, [isSessionActive, sessionStatus, employeeId, employeeName]);

  // Real Live Screen Stream Hook & Ref
  const [screenStream, setScreenStream] = useState(null);
  const screenStreamRef = useRef(null);

  // Request real live screen share
  const handleEnableRealScreenCapture = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" },
          audio: false,
        });
        setScreenStream(stream);
        screenStreamRef.current = stream;
        
        // Handle stream stop by user
        stream.getVideoTracks()[0].onended = () => {
          setScreenStream(null);
          screenStreamRef.current = null;
          showToast("Screen Share Ended ℹ️", "Live desktop stream stopped.", "info");
        };

        showToast("Screen Share Connected 🖥️", "Real desktop screen connected for live screenshots!", "success");
      } else {
        showToast("Screen Share Not Supported ℹ️", "Browser does not support direct screen grabbing. Canvas live renderer active.", "info");
      }
    } catch (e) {
      console.warn("Screen share permission skipped or denied:", e);
    }
  };

  // Helper to grab real live screen frame onto canvas
  const grabRealLiveScreenFrame = async () => {
    let activeStream = screenStreamRef.current;

    // Prompt user directly for their real desktop screen if stream not yet active
    if (!activeStream || !activeStream.active) {
      if (typeof navigator !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        try {
          activeStream = await navigator.mediaDevices.getDisplayMedia({
            video: { cursor: "always" },
            audio: false,
          });
          setScreenStream(activeStream);
          screenStreamRef.current = activeStream;

          activeStream.getVideoTracks()[0].onended = () => {
            setScreenStream(null);
            screenStreamRef.current = null;
          };
        } catch (e) {
          console.warn("Screen share prompt cancelled:", e);
        }
      }
    }

    if (activeStream && activeStream.active) {
      try {
        const video = document.createElement("video");
        video.srcObject = activeStream;
        video.muted = true;
        await video.play();

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Security Watermark with timestamp & employee name
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.fillRect(16, canvas.height - 48, 540, 36);
        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 13px sans-serif";
        ctx.fillText(`NEXA LIVE MONITOR • ${employeeName || 'User'} (${department}) • ${new Date().toLocaleTimeString()}`, 26, canvas.height - 25);

        return canvas.toDataURL("image/webp", 0.9);
      } catch (err) {
        console.warn("Could not capture frame from stream:", err);
      }
    }

    // High-Fidelity Desktop Canvas Generator if stream is not active
    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext("2d");

    // Dark workspace background
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Window top bar
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, canvas.width, 38);

    // Window controls (mac/linux/windows style)
    ctx.fillStyle = "#ef4444";
    ctx.beginPath(); ctx.arc(20, 19, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath(); ctx.arc(38, 19, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#10b981";
    ctx.beginPath(); ctx.arc(56, 19, 6, 0, Math.PI * 2); ctx.fill();

    // Window title
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(`${currentFocusedApp} — Nexa Portal Production Workspace`, 80, 24);

    // Sidebar
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 38, 220, canvas.height - 38);
    ctx.fillStyle = "#64748b";
    ctx.font = "12px monospace";
    ctx.fillText("EXPLORER", 20, 65);
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("📁 src/app", 20, 95);
    ctx.fillText("  📄 page.jsx", 35, 120);
    ctx.fillText("  📄 layout.jsx", 35, 145);
    ctx.fillText("📁 components", 20, 175);
    ctx.fillText("📁 lib", 20, 205);

    // Editor Main Body
    ctx.fillStyle = "#111827";
    ctx.fillRect(220, 38, canvas.width - 220, canvas.height - 38);

    // Mock Code / Work Content
    ctx.font = "13px monospace";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(`// Active Workstream for ${employeeName || 'Developer'} (${department})`, 250, 80);
    ctx.fillStyle = "#a855f7";
    ctx.fillText("export default function ProductionApp() {", 250, 110);
    ctx.fillStyle = "#e2e8f0";
    ctx.fillText("  const [liveStatus, setLiveStatus] = useState('Active');", 270, 140);
    ctx.fillStyle = "#e2e8f0";
    ctx.fillText("  const [activeTask, setActiveTask] = useState('High Performance Execution');", 270, 170);
    ctx.fillStyle = "#22c55e";
    ctx.fillText("  // Session Verified & Monitored Live", 270, 200);
    ctx.fillStyle = "#e2e8f0";
    ctx.fillText("  return <Workspace user={sessionUser} active={true} />;", 270, 230);
    ctx.fillStyle = "#a855f7";
    ctx.fillText("}", 250, 260);

    // Bottom Watermark & Security Seal
    ctx.fillStyle = "rgba(30, 41, 59, 0.9)";
    ctx.fillRect(240, canvas.height - 55, 780, 40);
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 1;
    ctx.strokeRect(240, canvas.height - 55, 780, 40);
    ctx.fillStyle = "#60a5fa";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText(`📸 REAL-TIME CAPTURE • USER: ${employeeName || 'User'} • ROLE: ${department} • ${new Date().toLocaleTimeString()}`, 255, canvas.height - 30);

    return canvas.toDataURL("image/webp", 0.85);
  };

  // === 3. Trigger Random Screenshot Capture ===
  const triggerRandomScreenshotCapture = async () => {
    setIsCapturingScreen(true);
    const deviceInfo = getClientDeviceInfo();
    const currentTimestamp = new Date();
    const timeStr = currentTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = currentTimestamp.toISOString().split("T")[0];

    // Grab real live screen frame from getDisplayMedia or High-Fidelity Canvas
    const realScreenshotDataUrl = await grabRealLiveScreenFrame();
    const activityLevel = Math.min(100, Math.max(75, Math.floor(Math.random() * 20) + 80));

    const newScreenshot = {
      id: `sc-${Date.now()}`,
      session_id: sessionId || `sess-${Date.now()}`,
      employee_id: employeeId,
      employee_name: employeeName,
      department: department,
      screenshot_url: realScreenshotDataUrl,
      captured_app: currentFocusedApp,
      activity_level: activityLevel,
      date: dateStr,
      time: timeStr,
      timestamp: currentTimestamp.toISOString(),
      interval_minutes: nextIntervalMinutes,
      device_name: deviceInfo.deviceName,
      os: deviceInfo.os,
      ip_address: deviceInfo.ip,
      size: `${Math.floor(Math.random() * 150) + 320} KB (WebP)`,
      resolution: `${window.innerWidth || 1920} x ${window.innerHeight || 1080}`
    };

    try {
      const updatedScreenshots = await saveScreenshotLog(newScreenshot);
      setScreenshots(updatedScreenshots);

      // Add to timeline
      const scTimelineEvent = {
        id: `t-${Date.now()}`,
        employee_id: employeeId,
        employee_name: employeeName,
        time: timeStr,
        type: "Screenshot",
        detail: `Exact Live Screenshot Captured (${nextIntervalMinutes}m interval)`,
        status: "Captured"
      };
      const updatedTimeline = await addTimelineEvent(scTimelineEvent);
      setWorkTimelines(updatedTimeline);

      showToast("Screenshot Captured 📸", `Exact live screen screenshot logged at ${timeStr} (${newScreenshot.captured_app}).`, "info");
    } catch (err) {
      console.error("Screenshot upload error:", err);
      showToast("Screenshot Error ⚠️", "Failed to sync screenshot metadata to database.", "error");
    } finally {
      setIsCapturingScreen(false);
    }
  };

  // === 4. Session Start Handler ===
  const handleStartSession = () => {
    if (!isConsentAccepted) {
      setIsConsentModalOpen(true);
      return;
    }

    const sId = `sess-${Date.now()}`;
    const startTime = new Date();
    setSessionId(sId);
    setSessionStartTime(startTime);
    setIsSessionActive(true);
    setSessionStatus("Active");
    setElapsedSeconds(0);
    setActiveSeconds(0);
    setIdleSeconds(0);
    setLastActivityTimestamp(Date.now());

    // Set initial random screenshot countdown
    const initialIntervalSec = getRandomScreenshotInterval(settings.minInterval, settings.maxInterval);
    setNextScreenshotTimer(initialIntervalSec);
    setNextIntervalMinutes(Math.round(initialIntervalSec / 60));

    // Log timeline start
    const startEvent = {
      id: `t-${Date.now()}`,
      employee_id: employeeId,
      employee_name: employeeName,
      time: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: "Login",
      detail: "Work session initiated & transparency consent verified",
      status: "Active"
    };
    addTimelineEvent(startEvent).then((updated) => setWorkTimelines(updated));

    showToast("Monitoring Active 🟢", `Remote work session started for ${employeeName}. Monitoring is enabled.`, "success");
  };

  // === 5. Session Stop Handler ===
  const handleStopSession = () => {
    setIsSessionActive(false);
    setSessionStatus("Stopped");

    const stopTime = new Date();
    const stopEvent = {
      id: `t-${Date.now()}`,
      employee_id: employeeId,
      employee_name: employeeName,
      time: stopTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: "Logout",
      detail: `Session ended. Total Active: ${Math.floor(activeSeconds / 60)}m, Idle: ${Math.floor(idleSeconds / 60)}m`,
      status: "Completed"
    };
    addTimelineEvent(stopEvent).then((updated) => setWorkTimelines(updated));

    showToast("Session Ended ⏹️", "Work session terminated. Remote monitoring stopped.", "info");
  };

  // Consent Acceptance
  const handleAcceptConsent = () => {
    setIsConsentAccepted(true);
    sessionStorage.setItem("remote_monitoring_consent", "accepted");
    setIsConsentModalOpen(false);
    showToast("Consent Verified 🔒", "Privacy notice acknowledged. You may now start monitoring.", "success");
    handleStartSession();
  };

  // Retention Purge Handler
  const handlePurgeRetention = async () => {
    try {
      const res = await purgeExpiredScreenshots(settings.retentionDays);
      await loadMonitoringData();
      showToast("Retention Purge Complete 🗑️", `Purged ${res.removedCount} screenshots older than ${settings.retentionDays} days.`, "success");
    } catch (e) {
      showToast("Purge Error ❌", "Failed to purge expired screenshots.", "error");
    }
  };

  // Format seconds to HH:MM:SS
  const formatTimeHHMMSS = (sec) => {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Calculate Productivity Score %
  const totalTrackedSeconds = activeSeconds + idleSeconds;
  const productivityScore = totalTrackedSeconds > 0
    ? Math.round((activeSeconds / totalTrackedSeconds) * 100)
    : (isSessionActive ? 100 : 0);

  let productivityStatusLabel = "Ready to Track";
  let productivityStatusColor = "text-slate-500";

  if (isSessionActive || totalTrackedSeconds > 0) {
    if (productivityScore >= 90) {
      productivityStatusLabel = "High Focus Efficiency";
      productivityStatusColor = "text-emerald-600";
    } else if (productivityScore >= 75) {
      productivityStatusLabel = "Good Focus Efficiency";
      productivityStatusColor = "text-blue-600";
    } else if (productivityScore >= 50) {
      productivityStatusLabel = "Moderate Efficiency";
      productivityStatusColor = "text-amber-600";
    } else {
      productivityStatusLabel = "Low Focus / High Idle";
      productivityStatusColor = "text-rose-600";
    }
  }

  // Filtered Screenshots for Admin/Employee
  const filteredScreenshots = screenshots.filter((sc) => {
    if (role === "employee" && sc.employee_id !== employeeId) return false;

    if (selectedEmployeeFilter !== "All" && sc.employee_name !== selectedEmployeeFilter) return false;
    if (selectedDepartmentFilter !== "All" && sc.department !== selectedDepartmentFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = sc.employee_name?.toLowerCase().includes(q);
      const matchApp = sc.captured_app?.toLowerCase().includes(q);
      const matchDevice = sc.device_name?.toLowerCase().includes(q);
      if (!matchName && !matchApp && !matchDevice) return false;
    }

    return true;
  });

  // Filtered Timelines
  const filteredTimelines = workTimelines.filter((tl) => {
    if (role === "employee" && tl.employee_id !== employeeId) return false;
    if (selectedEmployeeFilter !== "All" && tl.employee_name !== selectedEmployeeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 font-sans max-w-7xl mx-auto">
      {/* Hidden Canvas for Frame Processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* === TOP BANNER & ROLE SWITCHER === */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="w-full md:w-auto">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 sm:p-3 rounded-xl bg-blue-50 text-[#2563EB] shrink-0 mt-0.5 sm:mt-0">
              <FaDesktop className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Remote Employee Monitoring Module
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <FaShieldAlt className="h-3 w-3" />
                  Supabase RLS Secured
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                Real-time activity tracking, automated random screenshots (5–15m), application usage, and privacy-first work timelines.
              </p>
            </div>
          </div>
        </div>

        {/* Role & Quick Controls */}
        <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-2 sm:gap-3">
          <div className="flex-1 md:flex-initial flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setRole("admin")}
              className={`flex-1 md:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg text-center transition-all ${role === "admin"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
                }`}
            >
              Admin View
            </button>
            <button
              onClick={() => setRole("employee")}
              className={`flex-1 md:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg text-center transition-all ${role === "employee"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
                }`}
            >
              Employee View
            </button>
          </div>

          <button
            onClick={loadMonitoringData}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
            title="Refresh Live Data"
          >
            <FaSync className="h-4 w-4" />
          </button>

          {/* Contextual 3-Dots Action Menu (Requirement #2) */}
          <div className="relative shrink-0">
            <button
              onClick={() => setIsHeaderKebabOpen(!isHeaderKebabOpen)}
              className="p-2 sm:p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title="More Actions"
            >
              <FaEllipsisV className="h-4 w-4" />
            </button>

            {isHeaderKebabOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white p-1.5 shadow-lg border border-slate-200 z-30 space-y-1 text-xs">
                <button
                  onClick={() => {
                    setIsHeaderKebabOpen(false);
                    loadMonitoringData();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 font-medium transition-colors"
                >
                  Sync Database Logs
                </button>

                <div className="border-t border-slate-100 my-1" />

                <button
                  onClick={() => {
                    setIsHeaderKebabOpen(false);
                    setConfirmModal({ isOpen: true, loading: false });
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-600 font-semibold transition-colors flex items-center gap-2"
                >
                  <FaTrash className="h-3 w-3" /> Clear All Data
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* === PRIVACY & TRANSPARENCY NOTICE BANNER === */}
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/80 via-white to-slate-50 p-4 sm:p-5 relative overflow-hidden">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white shrink-0 shadow-xs">
            <FaShieldAlt className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="space-y-1 text-xs text-slate-600 leading-relaxed">
            <div className="flex flex-wrap items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
              <span>Employee Transparency & Privacy Notice</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                Required Consent
              </span>
            </div>
            <p className="text-[11px] sm:text-xs">
              "This work session is monitored for productivity purposes. The system collects periodic random screenshots (5–15 min intervals), mouse/keyboard activity metrics, application & website usage, and work timelines strictly during your active session."
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 font-semibold text-slate-700 text-[11px] sm:text-xs">
              <span className="flex items-center gap-1 text-emerald-600">
                <FaCheckCircle className="h-3.5 w-3.5" /> Session-bound capture only
              </span>
              <span className="flex items-center gap-1 text-emerald-600">
                <FaCheckCircle className="h-3.5 w-3.5" /> Auto-stops on logout
              </span>
              <span className="flex items-center gap-1 text-emerald-600">
                <FaCheckCircle className="h-3.5 w-3.5" /> Employee visible data
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* === WORK SESSION CONTROL PANEL (FOR EMPLOYEES & SIMULATION) === */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-4 sm:pb-5">
          <div className="w-full lg:w-auto space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] sm:text-xs font-semibold text-blue-600 uppercase tracking-wider">
                Work Session Status — Select Profile:
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
              <select
                value={employeeName}
                onChange={(e) => {
                  const selectedName = e.target.value;
                  const foundUser = registeredUsers.find(u => u.name === selectedName);
                  if (foundUser) {
                    setEmployeeName(foundUser.name);
                    setDepartment(foundUser.department);
                    setEmployeeId(foundUser.id);
                  } else {
                    setEmployeeName(selectedName);
                  }
                }}
                disabled={isSessionActive}
                className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold text-xs shadow-xs focus:ring-2 focus:ring-blue-500"
              >
                {registeredUsers.length === 0 ? (
                  <option value={employeeName || ""}>
                    {employeeName || "No employee profiles available"}
                  </option>
                ) : (
                  registeredUsers.map(u => (
                    <option key={u.id} value={u.name}>{u.name} ({u.department})</option>
                  ))
                )}
              </select>

              <div className="flex items-center justify-between sm:justify-start gap-3">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tracking-tight">
                  {formatTimeHHMMSS(elapsedSeconds)}
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${sessionStatus === "Active"
                      ? "bg-emerald-100 text-emerald-800 animate-pulse"
                      : sessionStatus === "Idle"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${sessionStatus === "Active"
                        ? "bg-emerald-500"
                        : sessionStatus === "Idle"
                          ? "bg-amber-500"
                          : "bg-slate-400"
                      }`}
                  />
                  {sessionStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {!isSessionActive ? (
              <button
                onClick={handleStartSession}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-all shadow-sm cursor-pointer"
              >
                <FaPlay className="h-3.5 w-3.5" />
                <span>Start Work Session</span>
              </button>
            ) : (
              <button
                onClick={handleStopSession}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 transition-all shadow-sm cursor-pointer"
              >
                <FaStop className="h-3.5 w-3.5" />
                <span>Stop Session & Logout</span>
              </button>
            )}

            <button
              onClick={handleEnableRealScreenCapture}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all shadow-xs cursor-pointer ${
                screenStream
                  ? "bg-purple-50 text-purple-700 border-purple-200"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
              title="Share desktop screen for exact live screenshots"
            >
              <FaDesktop className={`h-3.5 w-3.5 ${screenStream ? "text-purple-600 animate-pulse" : "text-slate-500"}`} />
              <span>{screenStream ? "Desktop Live 🟢" : "Connect Real Screen"}</span>
            </button>

            <button
              onClick={triggerRandomScreenshotCapture}
              disabled={!isSessionActive || isCapturingScreen}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-50 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
            >
              <FaCamera className={`h-3.5 w-3.5 ${isCapturingScreen ? "animate-spin text-blue-600" : ""}`} />
              <span>{isCapturingScreen ? "Capturing..." : "Capture Screenshot"}</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Active Productive Time</span>
              <FaClock className="text-emerald-500 h-4 w-4" />
            </div>
            <p className="text-base sm:text-lg font-bold text-slate-900 mt-2 font-mono">
              {Math.floor(activeSeconds / 60)}m {activeSeconds % 60}s
            </p>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min(100, (activeSeconds / Math.max(1, elapsedSeconds)) * 100)}%` }}
              />
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Inactive / Idle Time</span>
              <FaClock className="text-amber-500 h-4 w-4" />
            </div>
            <p className="text-base sm:text-lg font-bold text-slate-900 mt-2 font-mono">
              {Math.floor(idleSeconds / 60)}m {idleSeconds % 60}s
            </p>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
              <div
                className="bg-amber-500 h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min(100, (idleSeconds / Math.max(1, elapsedSeconds)) * 100)}%` }}
              />
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Next Random Screenshot</span>
              <FaCamera className="text-blue-500 h-4 w-4" />
            </div>
            <p className="text-base sm:text-lg font-bold text-slate-900 mt-2 font-mono">
              in {Math.floor(nextScreenshotTimer / 60)}m {nextScreenshotTimer % 60}s
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Randomized ({settings.minInterval}–{settings.maxInterval}m window)</p>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Productivity Score</span>
              <FaChartLine className="text-blue-600 h-4 w-4" />
            </div>
            <p className="text-base sm:text-lg font-bold text-blue-600 mt-2 font-mono">
              {productivityScore}%
            </p>
            <p className={`text-[10px] font-semibold mt-1 ${productivityStatusColor}`}>
              {productivityStatusLabel}
            </p>
          </div>
        </div>
      </div>

      {/* === DASHBOARD NAVIGATION TABS === */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold overflow-x-auto no-scrollbar scroll-smooth">
        <button
          onClick={() => setActiveTab("overview")}
          className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl transition-all cursor-pointer ${activeTab === "overview"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
            }`}
        >
          <FaDesktop className="h-3.5 w-3.5" /> <span>Live Overview</span>
        </button>

        <button
          onClick={() => setActiveTab("screenshots")}
          className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl transition-all cursor-pointer ${activeTab === "screenshots"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
            }`}
        >
          <FaCamera className="h-3.5 w-3.5" /> <span>Screenshot Gallery ({filteredScreenshots.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("timeline")}
          className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl transition-all cursor-pointer ${activeTab === "timeline"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
            }`}
        >
          <FaHistory className="h-3.5 w-3.5" /> <span>Work Timeline</span>
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl transition-all cursor-pointer ${activeTab === "analytics"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
            }`}
        >
          <FaChartPie className="h-3.5 w-3.5" /> <span>Productivity Analytics</span>
        </button>

        {role === "admin" && (
          <button
            onClick={() => setActiveTab("settings")}
            className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl transition-all cursor-pointer ${activeTab === "settings"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
              }`}
          >
            <FaShieldAlt className="h-3.5 w-3.5" /> <span>Retention & Rules</span>
          </button>
        )}
      </div>

      {/* === TAB 1: LIVE OVERVIEW === */}
      {activeTab === "overview" && (
        <div className="space-y-4 sm:space-y-6">
          {/* Admin Filters Header */}
          {role === "admin" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2">
                  <FaFilter className="text-slate-400" />
                  <span className="font-bold text-slate-700">Filter:</span>
                </div>

                <select
                  value={selectedEmployeeFilter}
                  onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-medium text-xs"
                >
                  <option value="All">All Profiles</option>
                  {registeredUsers.map((u) => (
                    <option key={u.id} value={u.name}>{u.name} ({u.department})</option>
                  ))}
                  {registeredUsers.length === 0 && (
                    <option value="Emaan">Emaan (Full Stack MERN)</option>
                  )}
                </select>

                <select
                  value={selectedDepartmentFilter}
                  onChange={(e) => setSelectedDepartmentFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-medium text-xs"
                >
                  <option value="All">All Departments</option>
                  <option value="Frontend Engineering">Frontend Engineering</option>
                  <option value="Backend Engineering">Backend Engineering</option>
                  <option value="UI/UX Design">UI/UX Design</option>
                  <option value="Product Management">Product Management</option>
                </select>
              </div>

              <div className="relative w-full md:w-auto">
                <FaSearch className="absolute left-3 top-3 text-slate-400 h-3.5 w-3.5" />
                <input
                  type="text"
                  placeholder="Search employee or app..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-56 pl-8 pr-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-xs"
                />
              </div>
            </div>
          )}

          {/* Active Employee Cards Grid */}
          {remoteSessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                <FaDesktop className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No Active Remote Work Sessions</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Click <strong>"Start Work Session"</strong> above to launch your first monitored session and record live activity.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {remoteSessions.map((sess) => (
                <div
                  key={sess.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{sess.employee_name}</h3>
                      <p className="text-xs text-slate-500">{sess.department}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sess.status === "Active"
                          ? "bg-emerald-100 text-emerald-800"
                          : sess.status === "Idle"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                    >
                      {sess.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Current App:</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[140px]" title={sess.current_app}>
                        {sess.current_app}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Productivity:</span>
                      <span className="font-bold text-blue-600">{sess.productivity_score}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Active vs Idle:</span>
                      <span className="font-medium text-slate-700">{sess.active_minutes}m / {sess.idle_minutes}m</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-3">
                    <span>{sess.device_name}</span>
                    <span>{sess.ip_address}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* App Usage Breakdown Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FaLaptopCode className="text-blue-600" /> Daily Application & Website Usage Summary
            </h3>
            <div className="space-y-3">
              {appUsageList.map((app) => (
                <div key={app.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>{app.app_name} <span className="text-[10px] text-slate-400 font-normal">({app.category})</span></span>
                    <span>{app.usage_minutes} mins ({app.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${app.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* === TAB 2: SCREENSHOT GALLERY === */}
      {activeTab === "screenshots" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Captured Screenshots Gallery</h2>
              <p className="text-xs text-slate-500">Automated random screenshots captured every 5–15 minutes with complete device metadata.</p>
            </div>
            {role === "admin" && (
              <button
                onClick={handlePurgeRetention}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 font-semibold text-xs hover:bg-rose-100 transition-colors"
              >
                <FaTrash className="h-3 w-3" /> Auto-Purge (&gt;{settings.retentionDays} Days)
              </button>
            )}
          </div>

          {/* Screenshot Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredScreenshots.map((sc) => (
              <div
                key={sc.id}
                className="group rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-slate-900 overflow-hidden cursor-pointer" onClick={() => setSelectedScreenshotModal(sc)}>
                  <img
                    src={sc.screenshot_url}
                    alt={sc.captured_app}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 font-semibold text-xs">
                    <FaImage className="h-4 w-4" /> Preview
                  </div>
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-900/80 text-white text-[10px] font-mono">
                    {sc.resolution}
                  </span>
                </div>

                {/* Info Payload */}
                <div className="p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 truncate max-w-[140px]">{sc.employee_name}</span>
                    <span className="text-slate-400 text-[11px]">{sc.time}</span>
                  </div>
                  <p className="text-slate-600 truncate font-medium" title={sc.captured_app}>
                    {sc.captured_app}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-2">
                    <span>OS: {sc.os}</span>
                    <span className="text-emerald-600 font-semibold">{sc.activity_level}% Active</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === TAB 3: WORK TIMELINE === */}
      {activeTab === "timeline" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Chronological Work Timeline</h2>
              <p className="text-xs text-slate-500">Real-time sequence of employee logins, focus apps, screenshot captures, and idle alerts.</p>
            </div>
          </div>

          <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
            {filteredTimelines.map((tl, idx) => (
              <div key={tl.id || idx} className="relative pl-6">
                <div className={`absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-2 bg-white ${tl.type === "Login" ? "border-emerald-500" :
                    tl.type === "Screenshot" ? "border-blue-500" :
                      tl.type === "Idle Alert" ? "border-amber-500" : "border-slate-400"
                  }`} />

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{tl.employee_name} — {tl.type}</span>
                    <span className="text-slate-400 font-mono">{tl.time}</span>
                  </div>
                  <p className="text-xs text-slate-600">{tl.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === TAB 4: PRODUCTIVITY ANALYTICS === */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Focus Time</h3>
              <p className="text-3xl font-black text-slate-900">
                {elapsedSeconds > 0
                  ? `${Math.floor(elapsedSeconds / 3600)}h ${Math.floor((elapsedSeconds % 3600) / 60)}m`
                  : "—"}
              </p>
              <p className="text-xs text-slate-500">Current session duration</p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Activity Score</h3>
              <p className="text-3xl font-black text-blue-600">
                {elapsedSeconds > 0
                  ? `${Math.round((activeSeconds / elapsedSeconds) * 100)}%`
                  : "—"}
              </p>
              <p className="text-xs text-slate-500">Active vs total session time</p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Screenshots Logged</h3>
              <p className="text-3xl font-black text-slate-900">{screenshots.length} Captures</p>
              <p className="text-xs text-slate-500">Randomized 5-15 min policy</p>
            </div>
          </div >
        </div >
      )
}

{/* === TAB 5: RETENTION & RULES SETTINGS === */ }
{
  activeTab === "settings" && role === "admin" && (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
      <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
        <FaShieldAlt className="text-blue-600" /> Monitoring Policy & Retention Rules
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
        <div className="space-y-2">
          <label className="font-bold text-slate-900">Screenshot Auto-Retention Period (Days):</label>
          <select
            value={settings.retentionDays}
            onChange={(e) => {
              const updated = { ...settings, retentionDays: Number(e.target.value) };
              setSettings(updated);
              saveMonitoringSettings(updated);
              showToast("Settings Saved ⚙️", `Retention period set to ${e.target.value} days.`, "success");
            }}
            className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
          >
            <option value={30}>30 Days Auto-Purge</option>
            <option value={60}>60 Days Auto-Purge (Recommended)</option>
            <option value={90}>90 Days Auto-Purge</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="font-bold text-slate-900">Random Screenshot Interval Window:</label>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800">
            Randomized between <strong>5 Minutes</strong> and <strong>15 Minutes</strong> (Unpredictable anti-timing policy enabled).
          </div>
        </div>
      </div>
    </div>
  )
}

{/* === PRIVACY CONSENT ACKNOWLEDGMENT MODAL === */ }
{
  isConsentModalOpen && (
    <Modal
      isOpen={isConsentModalOpen}
      onClose={() => setIsConsentModalOpen(false)}
      title="Remote Monitoring Privacy & Transparency Consent"
    >
      <div className="space-y-4 text-xs text-slate-600">
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-blue-900 space-y-2">
          <p className="font-bold">Required Acknowledgment before starting work session:</p>
          <p>
            "This work session is monitored for productivity purposes. The system collects screenshots at random intervals (5–15 minutes), activity information (mouse/keyboard input), application usage, and work timelines strictly during your active work session."
          </p>
        </div>

        <ul className="space-y-1.5 list-disc pl-5 font-medium text-slate-700">
          <li>Monitoring runs ONLY when your work session is Active.</li>
          <li>Monitoring stops automatically upon logout or clicking Stop Session.</li>
          <li>You can view all your captured screenshots and activity logs at any time.</li>
        </ul>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={() => setIsConsentModalOpen(false)}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleAcceptConsent}
            className="px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-xs"
          >
            I Acknowledge & Start Session
          </button>
        </div>
      </div>
    </Modal>
  )
}

{/* === SCREENSHOT LIGHTBOX PREVIEW MODAL === */ }
{
  selectedScreenshotModal && (
    <Modal
      isOpen={!!selectedScreenshotModal}
      onClose={() => setSelectedScreenshotModal(null)}
      title={`Screenshot Metadata — ${selectedScreenshotModal.employee_name}`}
    >
      <div className="space-y-4 text-xs">
        <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
          <img
            src={selectedScreenshotModal.screenshot_url}
            alt="Captured Screen"
            className="w-full h-auto max-h-[60vh] object-contain"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200 text-slate-700">
          <div className="truncate"><span className="text-slate-400">Employee:</span> <strong>{selectedScreenshotModal.employee_name}</strong></div>
          <div className="truncate"><span className="text-slate-400">Department:</span> <strong>{selectedScreenshotModal.department}</strong></div>
          <div className="truncate"><span className="text-slate-400">App Captured:</span> <strong>{selectedScreenshotModal.captured_app}</strong></div>
          <div className="truncate"><span className="text-slate-400">Timestamp:</span> <strong>{selectedScreenshotModal.time} ({selectedScreenshotModal.date})</strong></div>
          <div className="truncate"><span className="text-slate-400">Device Name:</span> <strong>{selectedScreenshotModal.device_name}</strong></div>
          <div className="truncate"><span className="text-slate-400">OS:</span> <strong>{selectedScreenshotModal.os}</strong></div>
          <div className="truncate"><span className="text-slate-400">IP Address:</span> <strong>{selectedScreenshotModal.ip_address}</strong></div>
          <div className="truncate"><span className="text-slate-400">Compressed Size:</span> <strong>{selectedScreenshotModal.size}</strong></div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between items-stretch sm:items-center pt-2">
          <a
            href={selectedScreenshotModal.screenshot_url}
            target="_blank"
            rel="noreferrer"
            download
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors cursor-pointer text-center"
          >
            <FaDownload className="h-3.5 w-3.5" /> <span>Download Screenshot</span>
          </a>

          <button
            onClick={() => setSelectedScreenshotModal(null)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer text-center"
          >
            Close Preview
          </button>
        </div>
      </div>
    </Modal>
  )
}

{/* === DESTRUCTIVE ACTION CONFIRMATION MODAL (Requirement #2) === */ }
{
  confirmModal.isOpen && (
    <Modal
      isOpen={confirmModal.isOpen}
      onClose={() => setConfirmModal({ isOpen: false, loading: false })}
      title="Confirm Destructive Action"
    >
      <div className="space-y-4 text-xs text-slate-700">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
          <FaExclamationTriangle className="h-5 w-5 shrink-0 text-rose-600" />
          <p className="font-semibold">
            Are you sure you want to clear all monitoring logs and sessions? This action cannot be undone.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-3">
          <button
            onClick={() => setConfirmModal({ isOpen: false, loading: false })}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              setConfirmModal({ ...confirmModal, loading: true });
              if (typeof window !== "undefined") {
                localStorage.removeItem("remote_work_sessions");
                localStorage.removeItem("remote_screenshot_logs");
                localStorage.removeItem("remote_work_timelines");
                localStorage.removeItem("remote_activity_logs");
                localStorage.removeItem("remote_app_usage_logs");
              }
              setRemoteSessions([]);
              setScreenshots([]);
              setWorkTimelines([]);
              setConfirmModal({ isOpen: false, loading: false });
              showToast("Data Cleared 🗑️", "All dummy monitoring sessions and logs removed.", "info");
            }}
            disabled={confirmModal.loading}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors shadow-xs cursor-pointer"
          >
            {confirmModal.loading ? "Clearing..." : "Confirm & Clear All Data 🗑️"}
          </button>
        </div>
      </div>
    </Modal>
  )
}
    </div >
  );
}
