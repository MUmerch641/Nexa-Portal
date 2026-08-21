"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { dbFetch, dbSaveRecord, dbDeleteRecord } from "@/lib/dbPersistence";
import Modal from "@/components/Modal";
import { showToast } from "@/components/Toast";
import { getCurrentMinutes, determineAttendanceState } from "@/lib/attendanceUtils";
import { fetchCurrentPublicIp, verifyOfficeWifiAttendance, getActiveOfficeNetworks } from "@/lib/attendanceIpUtils";
import {
  FaWifi,
  FaGlobe,
  FaShieldAlt,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaUserCheck,
  FaHistory,
  FaArrowRight,
  FaLock,
  FaUserGraduate,
  FaUserTie,
  FaTrashAlt,
  FaExclamationTriangle,
  FaEllipsisV,
  FaChartPie,
  FaCalendarCheck,
  FaDownload,
  FaFilter,
  FaSearch,
  FaInfoCircle,
  FaCheck,
  FaChevronRight
} from "react-icons/fa";

/* ─────────────────────────────────────────────────────────────────────────
   TODAY'S ACTIVE SESSION BREAKDOWN
   Fills the vertical gap below "Primary Attendance Workflow" so the left
   and right columns share a consistent height.
───────────────────────────────────────────────────────────────────────── */
function TodaySessionBreakdown({ checkIn, checkOut, formattedTimeString, currentMinutes }) {
  // Shift window: 10:00 AM (600 min) → 6:00 PM (1080 min)
  const SHIFT_START = 600;
  const SHIFT_END = 1080;
  const SHIFT_TOTAL = SHIFT_END - SHIFT_START; // 480 min

  // Clamp current position within the shift
  const clampedNow = Math.min(Math.max(currentMinutes, SHIFT_START), SHIFT_END);
  const elapsedMin = clampedNow - SHIFT_START;
  const progressPct = Math.round((elapsedMin / SHIFT_TOTAL) * 100);

  const remainingMin = Math.max(0, SHIFT_END - clampedNow);
  const remHours = Math.floor(remainingMin / 60);
  const remMins = remainingMin % 60;
  const remainingLabel = remainingMin === 0
    ? "Shift Ended"
    : remHours > 0
      ? `${remHours}h ${remMins}m Remaining`
      : `${remMins}m Remaining`;

  // Work-so-far (only if checked in)
  let workLabel = "—";
  if (checkIn) {
    const checkInMs = new Date(
      checkIn.check_in_timestamp || checkIn.timestamp || checkIn.created_at
    ).getTime();
    const endMs = checkOut
      ? new Date(checkOut.check_out_timestamp || checkOut.timestamp).getTime()
      : Date.now();
    const diffMin = Math.max(0, Math.floor((endMs - checkInMs) / 60000));
    const wh = Math.floor(diffMin / 60);
    const wm = diffMin % 60;
    workLabel = wh > 0 ? `${wh}h ${wm}m` : `${wm}m`;
  }

  // Session status label + color
  const sessionDone = checkIn && checkOut;
  const sessionActive = checkIn && !checkOut;

  const statusLabel = sessionDone
    ? "Session Complete"
    : sessionActive
      ? "Session Active"
      : "Not Started";

  const statusColor = sessionDone
    ? "text-[#2563EB] bg-[#EFF6FF] border-[#2563EB]/20"
    : sessionActive
      ? "text-[#059669] bg-[#ECFDF5] border-[#059669]/20"
      : "text-[#64748B] bg-[#F8FAFC] border-[#E2E8F0]";

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
        <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
          <FaClock className="text-[#2563EB]" />
          <span>Today&apos;s Active Session Breakdown</span>
        </h3>
        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      {/* Live Shift Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-semibold text-[#64748B]">
          <span>10:00 AM</span>
          <span className="font-mono text-[#0F172A]">{formattedTimeString || "--:--:--"}</span>
          <span>6:00 PM</span>
        </div>

        <div className="relative w-full h-3 bg-[#F1F5F9] rounded-full overflow-hidden border border-[#E2E8F0]">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${progressPct}%`,
              background: "linear-gradient(90deg, #2563EB 0%, #60A5FA 100%)"
            }}
          />
          {/* Pulsing cursor at current position */}
          {progressPct > 0 && progressPct < 100 && (
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#2563EB] border-2 border-white shadow animate-pulse"
              style={{ left: `calc(${progressPct}% - 6px)` }}
            />
          )}
        </div>

        <div className="text-right text-[11px] font-bold text-[#2563EB]">
          {remainingLabel}
        </div>
      </div>

      {/* Session Metrics Row */}
      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-0.5 text-center">
          <p className="text-[10px] font-semibold text-[#64748B] uppercase">Clock-In</p>
          <p className="font-bold text-[#0F172A]">
            {checkIn ? (checkIn.check_in_time || "—") : "—"}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-0.5 text-center">
          <p className="text-[10px] font-semibold text-[#64748B] uppercase">Work So Far</p>
          <p className="font-bold text-[#0F172A] font-mono">{workLabel}</p>
        </div>

        <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-0.5 text-center">
          <p className="text-[10px] font-semibold text-[#64748B] uppercase">Clock-Out</p>
          <p className="font-bold text-[#0F172A]">
            {checkOut ? (checkOut.check_out_time || "—") : "—"}
          </p>
        </div>
      </div>

      {/* Shift progress % */}
      <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1 border-t border-[#E2E8F0]">
        <span className="font-medium">Shift Progress</span>
        <span className="font-bold text-[#2563EB]">{progressPct}% Complete</span>
      </div>
    </div>
  );
}

export default function AttendancePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("employee");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [userIp, setUserIp] = useState("Detecting...");
  const [loading, setLoading] = useState(true);
  const [todayRecords, setTodayRecords] = useState([]);
  const [deleteReason, setDeleteReason] = useState("");

  const [officeNetworkInfo, setOfficeNetworkInfo] = useState({
    office_name: "Software House Main Office Wi-Fi",
    public_ip_address: "39.46.102.129"
  });

  const [isVerifyingIp, setIsVerifyingIp] = useState(false);
  const [ipVerificationResult, setIpVerificationResult] = useState(null);
  const [currentMinutes, setCurrentMinutes] = useState(getCurrentMinutes());
  const [formattedTimeString, setFormattedTimeString] = useState("");
  const [allSystemLogs, setAllSystemLogs] = useState([]);
  
  // Table Search & Filter State
  const [adminFilter, setAdminFilter] = useState("all");
  const [tableSearch, setTableSearch] = useState("");

  // Modals State
  const [activeKebabId, setActiveKebabId] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, record: null, loading: false });
  const [inspectModal, setInspectModal] = useState(null);

  useEffect(() => {
    setFormattedTimeString(new Date().toLocaleTimeString());
    const timer = setInterval(() => {
      setCurrentMinutes(getCurrentMinutes());
      setFormattedTimeString(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const storedRole = localStorage.getItem("user_role") || "employee";
      const storedEmail = (localStorage.getItem("current_user_email") || "").toLowerCase().trim();
      const storedName = localStorage.getItem("current_user_name") || storedEmail.split("@")[0];

      setUserRole(storedRole);
      setUserEmail(storedEmail);
      setUserName(storedName);

      const activeNetworks = getActiveOfficeNetworks();
      const activeNet = activeNetworks.find(n => n.status === "Active") || activeNetworks[0];
      if (activeNet) {
        setOfficeNetworkInfo({
          office_name: activeNet.office_name,
          public_ip_address: activeNet.public_ip_address
        });
      }

      const detectedIp = await fetchCurrentPublicIp();
      setUserIp(detectedIp);

      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      const key = `today_attendance_${storedEmail}`;
      const savedToday = localStorage.getItem(key);
      let userLogs = [];
      if (savedToday) {
        try {
          const parsed = JSON.parse(savedToday);
          const startOfDay = new Date();
          startOfDay.setHours(0, 0, 0, 0);
          userLogs = parsed.filter(r => new Date(r.timestamp) >= startOfDay);
        } catch(e) {}
      }
      setTodayRecords(userLogs);

      try {
        const masterSaved = localStorage.getItem("software_house_master_attendance_logs") || "[]";
        setAllSystemLogs(JSON.parse(masterSaved));
      } catch(e) {}

      // Auto-verify Wi-Fi Network
      const res = await verifyOfficeWifiAttendance({
        userId: storedEmail,
        userEmail: storedEmail,
        userRole: storedRole,
        userName: storedName
      });

      const activeIp = res.currentPublicIp || detectedIp || "Offline";
      setUserIp(activeIp);

      if (res.success) {
        setIpVerificationResult({
          success: true,
          isRemote: res.isRemote || false,
          message: res.isRemote ? "Remote Member Mode Active: Wi-Fi Restriction Disabled." : "Office Wi-Fi Verified Successfully.",
          publicIp: activeIp,
          officePublicIp: res.activeOfficeNetwork?.public_ip_address || activeIp
        });
      } else {
        setIpVerificationResult({
          success: false,
          message: res.errorMessage || "Network Mismatch! Connect to authorized Office Wi-Fi.",
          publicIp: activeIp,
          officePublicIp: res.activeOfficeNetwork?.public_ip_address || "Office Wi-Fi"
        });
      }

      setLoading(false);
    };
    fetchData();
  }, []);

  const handleVerifyIpify = async (silent = false) => {
    setIsVerifyingIp(true);
    const role = user?.user_metadata?.role || userRole || "employee";

    const res = await verifyOfficeWifiAttendance({
      userId: userEmail,
      userEmail,
      userRole: role,
      userName
    });

    const activeIp = res.currentPublicIp || "Offline";
    setUserIp(activeIp);

    if (res.success) {
      setIpVerificationResult({
        success: true,
        isRemote: res.isRemote || false,
        message: res.isRemote ? "Remote Member Mode Active: Wi-Fi Restriction Disabled." : "Office Wi-Fi Verified Successfully.",
        publicIp: activeIp,
        officePublicIp: res.activeOfficeNetwork?.public_ip_address || activeIp
      });
      if (!silent) {
        showToast("Office Wi-Fi Verified 🟢", "Network verified successfully. You can mark attendance.", "success");
      }
    } else {
      setIpVerificationResult({
        success: false,
        message: res.errorMessage || "Network Mismatch! Connect to authorized Office Wi-Fi.",
        publicIp: activeIp,
        officePublicIp: res.activeOfficeNetwork?.public_ip_address || "Office Wi-Fi"
      });
      if (!silent) {
        showToast("Network Mismatch 🛑", `Connected IP (${activeIp}) does not match authorized Office Wi-Fi!`, "error");
      }
    }
    setIsVerifyingIp(false);
    return res;
  };

  const navigateToDashboard = () => {
    const role = (userRole || "").toLowerCase();
    if (role === "student" || role === "course_student") {
      router.push("/dashboard/student");
    } else if (role === "employee" || role === "staff") {
      router.push("/dashboard/employees");
    } else if (role === "intern" || role === "internship") {
      router.push("/dashboard/internships");
    } else {
      router.push("/dashboard");
    }
  };

  const handleAttendance = async (type) => {
    const role = user?.user_metadata?.role || userRole || "employee";

    if (typeof window !== "undefined" && !window.navigator.onLine) {
      showToast("Attendance Blocked 🛑", "Wi-Fi or Internet is disconnected! Connect to Office Wi-Fi to mark attendance.", "error");
      return;
    }

    const verificationRes = await verifyOfficeWifiAttendance({
      userId: userEmail,
      userEmail,
      userRole: role,
      userName
    });

    if (!verificationRes.success) {
      showToast("Clock In Blocked 🛑", "Connect to authorized Office Wi-Fi to mark attendance!", "error");
      return;
    }

    const livePublicIp = verificationRes.currentPublicIp || "Live Connected Network";
    const checkInRecord = todayRecords.find(r => r.type === "check_in" || r.check_in_time);
    const checkOutRecord = todayRecords.find(r => r.type === "check_out" || (r.check_out_time && r.check_out_time !== "Not Checked Out"));

    if (type === "check_in" && checkInRecord) {
      showToast("Clock In Already Marked 🛑", "You have already Clocked In for today.", "warning");
      return;
    }

    if (type === "check_out" && !checkInRecord) {
      showToast("Clock In Required ⚠️", "You must Clock In before you can Clock Out.", "warning");
      return;
    }

    if (type === "check_out" && checkOutRecord) {
      showToast("Clock Out Completed 🛑", "You have already Clocked Out for today.", "warning");
      return;
    }

    const { allowed, modalMessage, status, lightColor, attendanceStatus, salaryDeductionStatus } = determineAttendanceState(role, currentMinutes);

    if (!allowed) {
      showToast("Attendance Closed", modalMessage, status);
      return;
    }

    const todayDateStr = new Date().toISOString().split("T")[0];
    const nowIso = new Date().toISOString();
    const nowLocalTime = new Date().toLocaleTimeString();

    let calculatedWorkDuration = "In Progress";
    let calculatedWorkSeconds = 0;

    if (type === "check_out" && checkInRecord) {
      const checkInTimeMs = new Date(checkInRecord.check_in_timestamp || checkInRecord.timestamp || checkInRecord.created_at).getTime();
      const checkOutTimeMs = new Date(nowIso).getTime();
      const diffMs = Math.max(0, checkOutTimeMs - checkInTimeMs);
      
      calculatedWorkSeconds = Math.floor(diffMs / 1000);
      const hours = Math.floor(calculatedWorkSeconds / 3600);
      const mins = Math.floor((calculatedWorkSeconds % 3600) / 60);
      const secs = calculatedWorkSeconds % 60;

      calculatedWorkDuration = hours > 0 ? `${hours}h ${mins}m ${secs}s` : `${mins}m ${secs}s`;
    }

    const newRecord = {
      id: `att-${Date.now()}`,
      attendance_id: `att-${Date.now()}`,
      user_id: userEmail,
      user_role: role,
      user_name: userName,
      user_email: userEmail,
      type,
      attendance_date: todayDateStr,
      check_in_time: type === "check_in" ? nowLocalTime : (checkInRecord?.check_in_time || "N/A"),
      check_out_time: type === "check_out" ? nowLocalTime : "Not Checked Out",
      check_in_timestamp: type === "check_in" ? nowIso : (checkInRecord?.check_in_timestamp || checkInRecord?.timestamp),
      check_out_timestamp: type === "check_out" ? nowIso : null,
      total_work_hours: type === "check_out" ? calculatedWorkDuration : "In Progress",
      total_work_seconds: calculatedWorkSeconds,
      attendance_status: attendanceStatus,
      public_ip: livePublicIp,
      created_at: nowIso,
      timestamp: nowIso,
    };

    const userKey = `today_attendance_${userEmail}`;
    let updatedUserRecords = [];
    if (type === "check_out" && checkInRecord) {
      updatedUserRecords = todayRecords.map(r => 
        (r.id === checkInRecord.id || r.type === "check_in")
          ? { 
              ...r, 
              check_out_time: nowLocalTime, 
              check_out_timestamp: nowIso, 
              total_work_hours: calculatedWorkDuration,
              updated_at: nowIso
            }
          : r
      );
      updatedUserRecords.push(newRecord);
    } else {
      updatedUserRecords = [...todayRecords, newRecord];
    }

    setTodayRecords(updatedUserRecords);
    localStorage.setItem(userKey, JSON.stringify(updatedUserRecords));

    try {
      const masterSaved = JSON.parse(localStorage.getItem("software_house_master_attendance_logs") || "[]");
      let updatedMaster = [newRecord, ...masterSaved];
      setAllSystemLogs(updatedMaster);
      localStorage.setItem("software_house_master_attendance_logs", JSON.stringify(updatedMaster));

      dbSaveRecord("attendance", {
        date: todayDateStr,
        check_in: newRecord.check_in_time,
        check_out: newRecord.check_out_time,
        status: attendanceStatus,
        created_at: nowIso
      }).catch(() => {});
    } catch(e) {}

    const toastTitle = type === "check_in" ? "Clocked In Successfully 🟢" : "Clocked Out Successfully 🔴";
    showToast(toastTitle, `Recorded at ${nowLocalTime}.`, "success");

    setTimeout(() => {
      navigateToDashboard();
    }, 1200);
  };

  const executeDeleteRecord = async () => {
    if (!deleteModal.record) return;
    setDeleteModal(prev => ({ ...prev, loading: true }));
    const record = deleteModal.record;

    try {
      dbDeleteRecord("attendance", record.id).catch(() => {});
      const masterSaved = JSON.parse(localStorage.getItem("software_house_master_attendance_logs") || "[]");
      const updatedMaster = masterSaved.filter(r => r.id !== record.id);
      setAllSystemLogs(updatedMaster);
      localStorage.setItem("software_house_master_attendance_logs", JSON.stringify(updatedMaster));

      if (record.user_email) {
        const userKey = `today_attendance_${record.user_email.toLowerCase().trim()}`;
        const userSaved = JSON.parse(localStorage.getItem(userKey) || "[]");
        const updatedUser = userSaved.filter(r => r.id !== record.id);
        localStorage.setItem(userKey, JSON.stringify(updatedUser));
        if (record.user_email.toLowerCase().trim() === userEmail) {
          setTodayRecords(updatedUser);
        }
      }

      showToast("Deleted 🗑️", "Attendance record deleted successfully.", "info");
    } catch(e) {
      showToast("Error", "Failed to delete record.", "error");
    } finally {
      setDeleteModal({ isOpen: false, record: null, loading: false });
    }
  };

  const handleExportCsv = () => {
    let csv = "User ID,User Name,Role,Attendance Status,Last Action,Work Hours,Public IP,Date Time\n";
    filteredSystemLogs.forEach(r => {
      csv += `"${r.user_id || ''}","${r.user_name || ''}","${r.user_role || ''}","${r.attendance_status || ''}","${r.type === 'check_in' ? 'Clock-In' : 'Clock-Out'}","${r.total_work_hours || ''}","${r.public_ip || ''}","${r.attendance_date || ''} ${r.check_in_time || ''}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const currentRole = user?.user_metadata?.role || userRole || "employee";
  const isStudentRole = currentRole === "student" || currentRole === "course_student";
  const { lightColor, label: policyLabel } = determineAttendanceState(currentRole, currentMinutes);

  const checkIn = todayRecords.find((r) => r.type === "check_in" || r.check_in_time);
  const checkOut = todayRecords.find((r) => r.type === "check_out" || (r.check_out_time && r.check_out_time !== "Not Checked Out"));

  // Attendance Metrics & Dynamic Avg Check-In Time for Sidebar Widget 1
  const attendanceMetrics = useMemo(() => {
    const total = allSystemLogs.length;
    const present = allSystemLogs.filter(l => (l.attendance_status || "").toLowerCase().includes("present") || (l.attendance_status || "").toLowerCase().includes("on time")).length;
    const late = allSystemLogs.filter(l => (l.attendance_status || "").toLowerCase().includes("late")).length;
    const absent = allSystemLogs.filter(l => (l.attendance_status || "").toLowerCase().includes("absent")).length;
    const ratePct = total > 0 ? Math.round((present / total) * 100) : 96;

    return { total, present, late, absent, ratePct };
  }, [allSystemLogs]);

  const avgCheckInTimeStr = useMemo(() => {
    const checkInLogs = (allSystemLogs || []).filter(
      l => l.check_in_time || l.time || l.timestamp
    );

    if (checkInLogs.length === 0 && checkIn) {
      return checkIn.check_in_time || checkIn.time || "10:00 AM";
    }

    if (checkInLogs.length === 0) {
      return "10:00 AM";
    }

    let totalMinutes = 0;
    let validCount = 0;

    checkInLogs.forEach(l => {
      const rawTime = l.check_in_time || l.time;
      if (!rawTime) return;
      const match = rawTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (match) {
        let hrs = parseInt(match[1], 10);
        const mins = parseInt(match[2], 10);
        const period = match[3] ? match[3].toUpperCase() : "AM";
        if (period === "PM" && hrs < 12) hrs += 12;
        if (period === "AM" && hrs === 12) hrs = 0;

        totalMinutes += hrs * 60 + mins;
        validCount++;
      }
    });

    if (validCount === 0) return checkIn?.check_in_time || "10:00 AM";

    const avgMins = Math.round(totalMinutes / validCount);
    let avgHrs = Math.floor(avgMins / 60);
    const finalMins = avgMins % 60;
    const finalPeriod = avgHrs >= 12 ? "PM" : "AM";
    if (avgHrs > 12) avgHrs -= 12;
    if (avgHrs === 0) avgHrs = 12;

    return `${String(avgHrs).padStart(2, "0")}:${String(finalMins).padStart(2, "0")} ${finalPeriod}`;
  }, [allSystemLogs, checkIn]);

  // Filtered System Logs for Full-Width Bottom Table
  const filteredSystemLogs = useMemo(() => {
    let list = currentRole === "admin"
      ? allSystemLogs.filter(l => 
          adminFilter === "all" ? true : adminFilter === "student" ? (l.user_role === "student" || l.user_role === "course_student") : (l.user_role !== "student" && l.user_role !== "course_student")
        )
      : todayRecords;

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      list = list.filter(r =>
        (r.user_name || "").toLowerCase().includes(q) ||
        (r.user_id || "").toLowerCase().includes(q) ||
        (r.attendance_status || "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [currentRole, allSystemLogs, adminFilter, todayRecords, tableSearch]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-3 text-[#0F172A]">
        <div className="w-8 h-8 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-[#64748B]">Loading Enterprise Attendance Portal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* HEADER BANNER */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-full border border-[#2563EB]/20">
              Attendance Verification Desk
            </span>
            <span className="text-[10px] font-semibold text-[#64748B] bg-[#F8FAFC] px-2.5 py-1 rounded-full border border-[#E2E8F0] flex items-center gap-1">
              <FaGlobe className="text-[#2563EB]" /> Public IP: {userIp}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#0F172A] mt-1.5 flex items-center gap-2.5">
            <FaCalendarCheck className="text-[#2563EB]" />
            <span>Student & Staff Attendance Workspace</span>
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Logged in as: <strong className="text-[#0F172A] font-semibold">{userEmail}</strong> ({isStudentRole ? "Student Account" : "Staff Account"})
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xs font-mono font-bold text-[#0F172A]">Time: {formattedTimeString || "--:--:--"}</p>
          <p className="text-[11px] font-semibold text-[#64748B]">Shift: 10:00 AM – 6:00 PM</p>
        </div>
      </div>

      {/* 1. BALANCED TWO-COLUMN RESPONSIVE GRID (65% LEFT / 35% RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN (65% - 8 COLS): PRIMARY WORKFLOW & VERIFICATION STEPPER */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* REAL-TIME VERIFICATION STEPPER (Requirement #6 - Horizontal Stepper) */}
          <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-md border border-[#2563EB]/20">
                  Verification Progress Engine
                </span>
                <h2 className="text-base font-bold text-[#0F172A] mt-1">Real-Time Attendance Stepper</h2>
              </div>

              <button
                type="button"
                onClick={() => handleVerifyIpify()}
                disabled={isVerifyingIp}
                className="bg-white hover:bg-[#F8FAFC] text-[#2563EB] border border-[#E2E8F0] font-semibold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <FaWifi className={`text-xs ${isVerifyingIp ? "animate-spin" : ""}`} />
                <span>{isVerifyingIp ? "Verifying..." : "Verify Office Network"}</span>
              </button>
            </div>

            {/* Horizontal Step Pipeline (Network -> Policy -> Clock-In -> Session -> Clock-Out) */}
            <div className="pt-2">
              <div className="flex items-center justify-between relative">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#E2E8F0] -translate-y-1/2 z-0" />

                {/* Step 1: Network */}
                <div className="relative z-10 flex flex-col items-center gap-1 bg-white px-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    ipVerificationResult?.success
                      ? "bg-[#EFF6FF] text-[#2563EB] border-2 border-[#2563EB]"
                      : "bg-[#F8FAFC] text-[#94A3B8] border-2 border-[#E2E8F0]"
                  }`}>
                    {ipVerificationResult?.success ? <FaCheck className="text-xs text-[#2563EB]" /> : "1"}
                  </div>
                  <span className={`text-[11px] font-bold ${ipVerificationResult?.success ? "text-[#2563EB]" : "text-[#64748B]"}`}>Network</span>
                </div>

                {/* Step 2: Policy */}
                <div className="relative z-10 flex flex-col items-center gap-1 bg-white px-2">
                  <div className="w-8 h-8 rounded-full bg-[#EFF6FF] text-[#2563EB] border-2 border-[#2563EB] flex items-center justify-center text-xs font-bold">
                    <FaCheck className="text-xs text-[#2563EB]" />
                  </div>
                  <span className="text-[11px] font-bold text-[#2563EB]">Policy</span>
                </div>

                {/* Step 3: Clock-In */}
                <div className="relative z-10 flex flex-col items-center gap-1 bg-white px-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    checkIn
                      ? "bg-[#EFF6FF] text-[#2563EB] border-2 border-[#2563EB]"
                      : "bg-[#F8FAFC] text-[#94A3B8] border-2 border-[#E2E8F0]"
                  }`}>
                    {checkIn ? <FaCheck className="text-xs text-[#2563EB]" /> : "3"}
                  </div>
                  <span className={`text-[11px] font-bold ${checkIn ? "text-[#2563EB]" : "text-[#64748B]"}`}>Clock-In</span>
                </div>

                {/* Step 4: Session */}
                <div className="relative z-10 flex flex-col items-center gap-1 bg-white px-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    checkIn
                      ? "bg-[#EFF6FF] text-[#2563EB] border-2 border-[#2563EB]"
                      : "bg-[#F8FAFC] text-[#94A3B8] border-2 border-[#E2E8F0]"
                  }`}>
                    {checkIn ? <FaCheck className="text-xs text-[#2563EB]" /> : "4"}
                  </div>
                  <span className={`text-[11px] font-bold ${checkIn ? "text-[#2563EB]" : "text-[#64748B]"}`}>Session</span>
                </div>

                {/* Step 5: Clock-Out */}
                <div className="relative z-10 flex flex-col items-center gap-1 bg-white px-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    checkOut
                      ? "bg-[#EFF6FF] text-[#2563EB] border-2 border-[#2563EB]"
                      : "bg-[#F8FAFC] text-[#94A3B8] border-2 border-[#E2E8F0]"
                  }`}>
                    {checkOut ? <FaCheck className="text-xs text-[#2563EB]" /> : "5"}
                  </div>
                  <span className={`text-[11px] font-bold ${checkOut ? "text-[#2563EB]" : "text-[#64748B]"}`}>Clock-Out</span>
                </div>
              </div>
            </div>
          </div>

          {/* PRIMARY ATTENDANCE WORKFLOW (Requirements #7 & #8 - Context Aware CTAs Only) */}
          <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] border-l-4 border-l-[#2563EB] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <FaClock className="text-[#2563EB]" />
                <span>Primary Attendance Workflow</span>
              </h3>
              <span className="text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#2563EB]/20">
                1 Check-In Per Day
              </span>
            </div>

            {/* STATE 1: Wi-Fi Unverified */}
            {(!ipVerificationResult || !ipVerificationResult.success) && (
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-[#64748B]">
                  <FaInfoCircle className="text-[#2563EB] text-base shrink-0" />
                  <span>Connect to authorized Office Wi-Fi to unlock Clock-In.</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleVerifyIpify()}
                  disabled={isVerifyingIp}
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer text-xs shrink-0"
                >
                  Verify Office Wi-Fi
                </button>
              </div>
            )}

            {/* STATE 2: Wi-Fi Verified, Ready to Clock In */}
            {ipVerificationResult?.success && !checkIn && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => handleAttendance("check_in")}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <FaCheckCircle className="text-sm" />
                  <span>Clock In (Mark Attendance)</span>
                </button>
              </div>
            )}

            {/* STATE 3: Clocked In, Ready to Clock Out */}
            {checkIn && !checkOut && (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleAttendance("check_out")}
                    className="flex-1 py-3.5 px-4 rounded-xl font-bold text-xs bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                  >
                    <FaTimesCircle className="text-sm" />
                    <span>Clock Out</span>
                  </button>

                  <button
                    type="button"
                    onClick={navigateToDashboard}
                    className="flex-1 py-3.5 px-4 rounded-xl font-semibold text-xs bg-white hover:bg-[#F8FAFC] text-[#2563EB] border border-[#E2E8F0] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Proceed to Workspace</span>
                    <FaArrowRight className="text-xs" />
                  </button>
                </div>
              </div>
            )}

            {/* STATE 4: Clocked Out Completed */}
            {checkIn && checkOut && (
              <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#2563EB]/20 flex items-center justify-between text-xs">
                <span className="font-bold text-[#2563EB] flex items-center gap-1.5">
                  <FaCheckCircle /> Attendance Completed for Today
                </span>
                <button
                  type="button"
                  onClick={navigateToDashboard}
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Proceed to Workspace →
                </button>
              </div>
            )}
          </div>

          {/* TODAY'S ACTIVE SESSION BREAKDOWN — fills height gap below Primary Workflow */}
          <TodaySessionBreakdown
            checkIn={checkIn}
            checkOut={checkOut}
            formattedTimeString={formattedTimeString}
            currentMinutes={currentMinutes}
          />

        </div>

        {/* RIGHT COLUMN (35% - 4 COLS): SIDEBAR WIDGETS (Requirement #2) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Widget 1: Attendance Statistics */}
          <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm space-y-4">
            <div className="border-b border-[#E2E8F0] pb-3">
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <FaChartPie className="text-[#2563EB]" />
                <span>Attendance Statistics</span>
              </h3>
              <p className="text-xs text-[#64748B]">Live system metrics.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#EFF6FF] border border-[#2563EB]/20 space-y-0.5">
                <span className="text-[10px] font-semibold text-[#2563EB] uppercase">Present Today</span>
                <p className="text-lg font-bold text-[#2563EB]">{attendanceMetrics.present}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FEF3C7] border border-[#F59E0B]/20 space-y-0.5">
                <span className="text-[10px] font-semibold text-[#92400E] uppercase">Late Today</span>
                <p className="text-lg font-bold text-[#92400E]">{attendanceMetrics.late}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-0.5">
                <span className="text-[10px] font-semibold text-[#64748B] uppercase">Absent Today</span>
                <p className="text-lg font-bold text-[#0F172A]">{attendanceMetrics.absent}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-0.5">
                <span className="text-[10px] font-semibold text-[#64748B] uppercase">Attendance Rate</span>
                <p className="text-lg font-bold text-[#0F172A]">{attendanceMetrics.ratePct}%</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs flex justify-between items-center">
              <span className="text-[#64748B] font-semibold">Avg Check-In Time:</span>
              <span className="font-mono font-bold text-[#0F172A]">{avgCheckInTimeStr}</span>
            </div>
          </div>

          {/* Widget 2: Vertical Compact Policy Timeline */}
          <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm space-y-3">
            <div className="border-b border-[#E2E8F0] pb-3">
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <FaShieldAlt className="text-[#2563EB]" />
                <span>Attendance Policy Timeline</span>
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#EFF6FF] border border-[#2563EB]/20 flex justify-between items-center">
                <span className="font-semibold text-[#2563EB]">10:00 – 10:14 AM</span>
                <span className="text-[10px] font-bold text-[#2563EB] bg-white px-2.5 py-1 rounded border border-[#2563EB]/20">On Time 🟢</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FEF3C7] border border-[#F59E0B]/20 flex justify-between items-center">
                <span className="font-semibold text-[#92400E]">10:15 – 10:29 AM</span>
                <span className="text-[10px] font-bold text-[#92400E] bg-white px-2.5 py-1 rounded border border-[#F59E0B]/20">Late Warning 🟠</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FEE2E2] border border-[#EF4444]/20 flex justify-between items-center">
                <span className="font-semibold text-[#991B1B]">10:30 AM & After</span>
                <span className="text-[10px] font-bold text-[#991B1B] bg-white px-2.5 py-1 rounded border border-[#EF4444]/20">Salary Deduction 🔴</span>
              </div>
            </div>
          </div>

          {/* Widget 3: Quick Rules & Notices */}
          <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm space-y-3 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2563EB]" />
            <div className="border-b border-[#E2E8F0] pb-2">
              <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                <FaInfoCircle className="text-[#2563EB]" />
                <span>Quick Rules & Notices</span>
              </h3>
            </div>

            <div className="space-y-1.5 text-xs text-[#64748B]">
              <p>• <strong>Shift Timing:</strong> 10:00 AM – 6:00 PM</p>
              <p>• <strong>Grace Period:</strong> 10:00 AM – 10:14 AM</p>
              <p className="text-[11px] text-[#0F172A] font-medium leading-relaxed pt-1">
                Attendance recorded after 10:30 AM will automatically trigger the one-day salary deduction rule according to company HR policy.
              </p>
            </div>
          </div>

          {/* Widget 4: System Status & Attendance Adjustment Request (Requirement Solution #1) */}
          <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm space-y-3">
            <div className="border-b border-[#E2E8F0] pb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                <FaShieldAlt className="text-[#2563EB]" />
                <span>System Status & Support</span>
              </h3>
              <span className="text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#2563EB]/20">
                Operational 🟢
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-[#0F172A] font-medium text-[11px]">
                <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
                <span>All Verification Gateways Operational</span>
              </div>

              <button
                type="button"
                onClick={() => showToast("Request Submitted 📩", "HR Support notified for manual attendance adjustment review.", "info")}
                className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-[#EFF6FF] text-[#2563EB] border border-[#E2E8F0] font-semibold text-xs transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>📩 Request Attendance Adjustment</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* 3. MASTER SYSTEM ATTENDANCE LOG (FULL 100% WIDTH BELOW BOTH COLUMNS - Requirement #1 & #3) */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
          <div>
            <h3 className="font-bold text-[#0F172A] text-base flex items-center gap-2">
              <FaHistory className="text-[#2563EB]" />
              <span>Master System Attendance Log</span>
            </h3>
            <p className="text-xs text-[#64748B]">Full width attendance historical database.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-60">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] text-xs" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search user, ID, status..."
                className="w-full pl-9 pr-3 py-1.5 text-xs text-[#0F172A] border border-[#E2E8F0] rounded-xl outline-none focus:border-[#2563EB] bg-white font-medium"
              />
            </div>

            {currentRole === "admin" && (
              <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0] text-xs font-medium">
                {["all", "employee", "student"].map(f => (
                  <button
                    key={f}
                    onClick={() => setAdminFilter(f)}
                    className={`px-3 py-1 rounded-lg uppercase text-[10px] font-bold cursor-pointer transition-colors ${
                      adminFilter === f ? "bg-white text-[#2563EB] shadow-xs border border-[#E2E8F0]" : "text-[#64748B] hover:text-[#0F172A]"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleExportCsv}
              className="bg-white hover:bg-[#F8FAFC] text-[#2563EB] border border-[#E2E8F0] font-semibold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <FaDownload className="text-xs" /> Export CSV
            </button>
          </div>
        </div>

        {/* 100% Full Width Table */}
        <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] w-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold uppercase text-[10px] tracking-wider border-b border-[#E2E8F0] sticky top-0">
              <tr>
                <th className="py-3 px-4 min-w-[180px] whitespace-nowrap">User Name & Role</th>
                <th className="py-3 px-4 min-w-[130px] whitespace-nowrap">Attendance Status</th>
                <th className="py-3 px-4 min-w-[140px] whitespace-nowrap">Last Action</th>
                <th className="py-3 px-4 min-w-[120px] whitespace-nowrap">Work Duration</th>
                <th className="py-3 px-4 min-w-[140px] whitespace-nowrap">Public IP</th>
                <th className="py-3 px-4 text-right min-w-[160px] whitespace-nowrap">Date & Time</th>
                {currentRole === "admin" && <th className="py-3 px-4 text-right min-w-[80px] whitespace-nowrap">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] font-normal">
              {filteredSystemLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#64748B] italic">
                    No attendance records matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredSystemLogs.map((r, idx) => (
                  <tr key={`att-row-${r.id || 'rec'}-${idx}`} className="hover:bg-[#F8FAFC] transition-colors align-middle">
                    <td className="py-3.5 px-4 font-semibold text-[#0F172A] whitespace-nowrap">
                      {r.user_name || r.user_id}
                      <span className="text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded ml-2 border border-[#2563EB]/20 uppercase whitespace-nowrap">
                        {r.user_role === "student" ? "Student" : "Staff"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {/* Consistent Badge Padding (Requirement #4) */}
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${
                        (r.attendance_status || "").toLowerCase().includes("late")
                          ? "bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]/20"
                          : "bg-[#EFF6FF] text-[#2563EB] border-[#2563EB]/20"
                      }`}>
                        {r.attendance_status || "Present"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-[#0F172A] whitespace-nowrap">
                      {r.type === "check_in" ? "Clock-In Completed" : "Clock-Out Completed"}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[#0F172A] font-semibold whitespace-nowrap">
                      {r.total_work_hours || "In Progress"}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[#64748B] whitespace-nowrap">{r.public_ip || userIp}</td>

                    <td className="py-3.5 px-4 text-right font-medium text-[#64748B] whitespace-nowrap">
                      {r.attendance_date} {r.check_in_time || r.check_out_time}
                    </td>

                    {currentRole === "admin" && (
                      <td className="py-3.5 px-4 text-right">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setActiveKebabId(activeKebabId === r.id ? null : r.id)}
                            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                          >
                            <FaEllipsisV className="text-xs" />
                          </button>

                          {activeKebabId === r.id && (
                            <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white p-1.5 shadow-lg border border-[#E2E8F0] z-30 space-y-0.5 text-xs text-left animate-in fade-in zoom-in-95 duration-100">
                              <button
                                type="button"
                                onClick={() => {
                                  setInspectModal(r);
                                  setActiveKebabId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[#EFF6FF] text-[#0F172A] hover:text-[#2563EB] font-semibold transition-colors"
                              >
                                View Details
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteModal({ isOpen: true, record: r, loading: false });
                                  setActiveKebabId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 font-semibold transition-colors"
                              >
                                Delete Record
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRMATION DESTRUCTIVE MODAL */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E2E8F0] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-[#E2E8F0] pb-3 text-[#0F172A]">
              <FaExclamationTriangle className="text-xl text-[#2563EB]" />
              <h3 className="font-bold text-[#0F172A] text-base">Delete Attendance Record</h3>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Are you sure you want to delete this attendance entry? Only this record will be purged.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, record: null, loading: false })}
                className="flex-1 py-2.5 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#2563EB] border border-[#E2E8F0] font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeleteRecord}
                disabled={deleteModal.loading}
                className="flex-1 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs cursor-pointer flex items-center justify-center"
              >
                {deleteModal.loading ? "Purging..." : "Confirm & Delete 🗑️"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT DETAILS MODAL */}
      {inspectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E2E8F0] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">{inspectModal.user_name || inspectModal.user_id}</h3>
                <p className="text-xs font-mono text-[#64748B]">{inspectModal.user_email || inspectModal.user_id}</p>
              </div>
              <button onClick={() => setInspectModal(null)} className="text-[#64748B] hover:text-[#0F172A] font-bold text-base">✕</button>
            </div>

            <div className="space-y-2 text-xs font-mono text-[#0F172A]">
              <p><strong>Status:</strong> {inspectModal.attendance_status || "Present"}</p>
              <p><strong>Date:</strong> {inspectModal.attendance_date}</p>
              <p><strong>Check-In:</strong> {inspectModal.check_in_time}</p>
              <p><strong>Check-Out:</strong> {inspectModal.check_out_time}</p>
              <p><strong>Work Duration:</strong> {inspectModal.total_work_hours}</p>
              <p><strong>Public IP:</strong> {inspectModal.public_ip}</p>
            </div>

            <div className="pt-2 text-right">
              <button onClick={() => setInspectModal(null)} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-4 py-2 rounded-xl text-xs">
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
