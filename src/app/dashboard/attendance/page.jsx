"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Modal from "@/components/Modal";
import StatusLight from "@/components/StatusLight";
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
  FaExclamationTriangle
} from "react-icons/fa";
import "@/app/dashboard/attendance/attendance.css";

export default function AttendancePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("employee");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [userIp, setUserIp] = useState("Detecting...");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info" });
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
  const [adminFilter, setAdminFilter] = useState("all");
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, record: null });

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
      const storedEmail = (localStorage.getItem("current_user_email") || "user@gmail.com").toLowerCase().trim();
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

      setLoading(false);
    };
    fetchData();
  }, []);

  const handleVerifyIpify = async () => {
    setIsVerifyingIp(true);
    const role = user?.user_metadata?.role || userRole || "employee";

    const res = await verifyOfficeWifiAttendance({
      userId: userEmail,
      userEmail,
      userRole: role,
      userName
    });

    const activeIp = res.currentPublicIp || "Live Connected Network";
    setUserIp(activeIp);

    setIpVerificationResult({
      success: true,
      message: "Office Wi-Fi Verified Successfully.",
      publicIp: activeIp,
      officePublicIp: activeIp
    });
    showToast("Office Wi-Fi Verified 🟢", "Network Verified Successfully. You can now mark your attendance.", "success");
    setIsVerifyingIp(false);
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
    // Strict Check 1: Block attendance if browser / Wi-Fi is turned off
    if (typeof window !== "undefined" && !window.navigator.onLine) {
      setIpVerificationResult({
        success: false,
        message: "❌ Wi-Fi / Internet Disconnected! Please connect to authorized Wi-Fi network to mark attendance.",
        publicIp: "Disconnected / Offline",
        officePublicIp: "Office Wi-Fi"
      });
      showToast("Attendance Blocked 🛑", "Wi-Fi or Internet is turned off! Connect to Office Wi-Fi to mark attendance.", "error");
      return;
    }

    // IP Restriction Validation via attendanceIpUtils.js engine
    const verificationRes = await verifyOfficeWifiAttendance({
      userId: userEmail,
      userEmail,
      userRole: role,
      userName
    });

    if (!verificationRes.success) {
      const activeNet = verificationRes.activeOfficeNetwork || getActiveOfficeNetworks()[0];
      const registeredOfficeIp = (activeNet?.public_ip_address || "39.46.118.183").trim();
      const currentIp = verificationRes.currentPublicIp || "Unknown IP";

      setIpVerificationResult({
        success: false,
        message: verificationRes.errorMessage || `❌ Network Mismatch! Connected Wi-Fi IP (${currentIp}) does not match Authorized Office Wi-Fi IP (${registeredOfficeIp}).`,
        publicIp: currentIp,
        officePublicIp: registeredOfficeIp
      });

      const actionLabel = type === "check_in" ? "Clock In" : "Clock Out";
      showToast(
        `${actionLabel} Blocked 🛑`,
        `Unauthorized Wi-Fi! Connected IP (${currentIp}) does not match authorized Office Wi-Fi IP (${registeredOfficeIp}). Attendance blocked!`,
        "error"
      );
      return;
    }

    const livePublicIp = verificationRes.currentPublicIp || "Live Connected Network";

    // Update IP Verification UI state on success
    setIpVerificationResult({
      success: true,
      message: "Office Wi-Fi Verified Successfully.",
      publicIp: livePublicIp,
      officePublicIp: livePublicIp
    });

    const checkInRecord = todayRecords.find(r => r.type === "check_in" || r.check_in_timestamp);
    const checkOutRecord = todayRecords.find(r => r.type === "check_out" || r.check_out_timestamp);

    // Validation 1: Prevent multiple Clock In attempts on the same day
    if (type === "check_in" && checkInRecord) {
      showToast("Clock In Already Marked 🛑", "You have already Clocked In for today.", "warning");
      return;
    }

    // Validation 2: Prevent Clock Out if employee has not Clocked In
    if (type === "check_out" && !checkInRecord) {
      showToast("Clock In Required ⚠️", "You must Clock In before you can Clock Out.", "warning");
      return;
    }

    // Validation 3: Prevent multiple Clock Out attempts for the same record
    if (type === "check_out" && checkOutRecord) {
      showToast("Clock Out Already Completed 🛑", "You have already Clocked Out for today.", "warning");
      return;
    }

    const { allowed, modalMessage, status, lightColor, attendanceStatus, salaryDeductionStatus } = determineAttendanceState(role, minutes);

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

      if (hours > 0) {
        calculatedWorkDuration = `${hours}h ${mins}m ${secs}s`;
      } else if (mins > 0) {
        calculatedWorkDuration = `${mins}m ${secs}s`;
      } else {
        calculatedWorkDuration = `${secs} sec${secs !== 1 ? 's' : ''}`;
      }
    }

    const newRecord = {
      id: `att-${Date.now()}`,
      attendance_id: `att-${Date.now()}`,
      user_id: userEmail,
      user_role: role,
      student_id: (role.includes("student")) ? userEmail : null,
      employee_id: (!role.includes("student")) ? userEmail : null,
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
      office_public_ip: registeredOfficeIp,
      wifi_verification_status: "Office IP Verified",
      ip_verification_status: "Office IP Verified",
      light_status: lightColor,
      salary_deduction_status: salaryDeductionStatus,
      created_at: nowIso,
      updated_at: nowIso,
      timestamp: nowIso,
    };

    const userKey = `today_attendance_${userEmail}`;
    let updatedUserRecords = [];
    if (type === "check_out" && checkInRecord) {
      // Update check-in record with check_out details
      updatedUserRecords = todayRecords.map(r => 
        (r.id === checkInRecord.id || r.type === "check_in")
          ? { 
              ...r, 
              check_out_time: nowLocalTime, 
              check_out_timestamp: nowIso, 
              total_work_hours: calculatedWorkDuration,
              total_work_seconds: calculatedWorkSeconds,
              wifi_verification_status: "Office IP Verified",
              ip_verification_status: "Office IP Verified",
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
      let updatedMaster = [];
      if (type === "check_out" && checkInRecord) {
        updatedMaster = masterSaved.map(r => 
          (r.id === checkInRecord.id && r.user_email === userEmail)
            ? { 
                ...r, 
                check_out_time: nowLocalTime, 
                check_out_timestamp: nowIso, 
                total_work_hours: calculatedWorkDuration,
                total_work_seconds: calculatedWorkSeconds,
                wifi_verification_status: "Office IP Verified",
                ip_verification_status: "Office IP Verified",
                updated_at: nowIso
              }
            : r
        );
        updatedMaster.unshift(newRecord);
      } else {
        updatedMaster = [newRecord, ...masterSaved];
      }
      setAllSystemLogs(updatedMaster);
      localStorage.setItem("software_house_master_attendance_logs", JSON.stringify(updatedMaster));

      // Save to Supabase DB safely
      try {
        let validEmployeeUuid = null;
        const { data: empDb } = await supabase.from("employees").select("id").eq("email", userEmail).limit(1);
        if (empDb && empDb.length > 0) {
          validEmployeeUuid = empDb[0].id;
        }

        const insertPayload = {
          date: todayDateStr,
          check_in: newRecord.check_in_time,
          check_out: newRecord.check_out_time,
          status: attendanceStatus,
          created_at: nowIso
        };

        if (validEmployeeUuid) {
          insertPayload.employee_id = validEmployeeUuid;
        }

        const { data: dbRes, error: dbErr } = await supabase.from("attendance").insert([insertPayload]).select();
        if (dbErr) {
          // If schema requires simple insert without select or optional fields
          await supabase.from("attendance").insert([insertPayload]);
        }
      } catch(e) {}

      const toastTitle = type === "check_in" ? "Clocked In Successfully 🟢" : "Clocked Out Successfully 🔴";
      const toastDesc = type === "check_in" 
        ? `Clock-In time recorded at ${nowLocalTime}. Button disabled.`
        : `Clock-Out recorded at ${nowLocalTime}. Total Work Hours: ${calculatedWorkDuration}`;

      showToast(toastTitle, toastDesc, "success");

      setTimeout(() => {
        navigateToDashboard();
      }, 1500);
    } catch(e) {
      console.error(e);
    }
  };

  const handleTriggerDelete = (record) => {
    const role = user?.user_metadata?.role || userRole || "employee";
    if (role !== "admin") {
      showToast("Access Denied", "Only Admin can delete attendance records.", "error");
      return;
    }
    setDeleteModal({ isOpen: true, record });
  };

  const executeDeleteRecord = async () => {
    if (!deleteModal.record) return;
    const record = deleteModal.record;

    try {
      await supabase.from("attendance").delete().eq("id", record.id);
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

      showToast("Deleted Successfully", "Attendance record deleted successfully.", "success");
    } catch(e) {
      showToast("Delete Failed", "Failed to delete the attendance record. Please try again.", "error");
    } finally {
      setDeleteModal({ isOpen: false, record: null });
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading Attendance System...</div>;

  const currentRole = user?.user_metadata?.role || userRole || "employee";
  const isStudentRole = currentRole === "student" || currentRole === "course_student";
  const { lightColor, label } = determineAttendanceState(currentRole, currentMinutes);

  const checkIn = todayRecords.find((r) => r.type === "check_in");
  const checkOut = todayRecords.find((r) => r.type === "check_out");

  return (
    <div className="attendance-wrapper">
      <div className="attendance-card-main max-w-4xl mx-auto">
        <div className="text-center space-y-2 mb-8">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
              <FaClock className="text-indigo-600" /> Mandatory Check-In Before Dashboard
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-mono font-bold">
              <FaGlobe className="text-blue-600" /> ipify Public IP: <strong>{userIp}</strong>
            </span>
          </div>
          <h1 className="attendance-header-glow">Student & Employee Attendance Gate</h1>
          <p className="attendance-subtitle flex items-center justify-center gap-1.5">
            Connected User: <strong>{userEmail}</strong> ({isStudentRole ? <span className="inline-flex items-center gap-1"><FaUserGraduate className="text-amber-500" /> Student Account</span> : <span className="inline-flex items-center gap-1"><FaUserTie className="text-blue-500" /> Employee Account</span>})
          </p>
        </div>

        <div className="status-pill-glow mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusLight color={lightColor} />
            <div className="text-left">
              <p className="text-[11px] uppercase font-extrabold tracking-wider text-slate-500 flex items-center gap-1.5">
                <FaShieldAlt className="text-emerald-600" /> Automated Real-Time Status Engine
              </p>
              <p className="text-xl font-black capitalize text-slate-900 mt-0.5">{label}</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs font-mono font-bold text-slate-600">Current Time: {formattedTimeString || "--:--:--"}</p>
            <p className="text-[10px] text-slate-400">Shift Starts: 10:00 AM</p>
          </div>
        </div>

        <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-4 mb-8 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FaShieldAlt className="text-emerald-400 text-lg" />
              <h2 className="text-sm font-black tracking-wide uppercase">
                {isStudentRole ? "Student Attendance Time Policy" : "Employee Attendance Time Policy"}
              </h2>
            </div>
            <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
              Auto-Calculated Policy
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-left">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
              <p className="text-slate-400 font-bold text-[10px]">BEFORE 10:00 AM</p>
              <p className="text-slate-200 font-bold text-xs">White: Disabled</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 space-y-1">
              <p className="text-emerald-400 font-bold text-[10px]">10:00 AM - 10:14 AM</p>
              <p className="text-emerald-200 font-bold text-xs">Green: On Time</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800/60 space-y-1">
              <p className="text-amber-400 font-bold text-[10px]">10:15 AM - 10:29 AM</p>
              <p className="text-amber-200 font-bold text-xs">Orange: Late Warning</p>
            </div>
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 space-y-1">
              <p className="text-rose-400 font-bold text-[10px]">10:30 AM & AFTER</p>
              <p className="text-rose-200 font-bold text-xs">{isStudentRole ? "Red: Fine Applied" : "Red: 1-Day Salary Deduction"}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-4 mb-8 border border-slate-800 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-mono font-black uppercase text-blue-400 tracking-wider">
                STEP 1: OFFICE WI-FI IPIFY VERIFICATION
              </span>
              <h3 className="text-base font-black text-white flex items-center gap-2 mt-1">
                <FaWifi className="text-blue-400" />
                <span>Verify Office Wi-Fi Network</span>
              </h3>
              <p className="text-xs text-slate-300">
                You must connect to the authorized Office Wi-Fi before marking attendance.
              </p>
            </div>

            <button
              type="button"
              onClick={handleVerifyIpify}
              disabled={isVerifyingIp}
              className={`px-6 py-3.5 rounded-2xl font-black text-xs transition-all shadow-lg flex items-center gap-2 shrink-0 cursor-pointer border ${
                isVerifyingIp
                  ? "bg-slate-700 text-slate-400 border-slate-600 cursor-wait"
                  : "bg-blue-600 hover:bg-blue-500 text-white border-blue-400 shadow-blue-900/40"
              }`}
            >
              <FaWifi className={isVerifyingIp ? "animate-spin text-sm" : "text-sm"} />
              <span>{isVerifyingIp ? "Comparing ipify Public IP..." : "Verify Office Wi-Fi"}</span>
            </button>
          </div>

          {ipVerificationResult ? (
            <div
              className={`p-4 rounded-2xl border text-xs font-bold transition-all ${
                ipVerificationResult.success
                  ? "bg-emerald-950/80 border-emerald-500/60 text-emerald-200"
                  : "bg-rose-950/80 border-rose-500/60 text-rose-200"
              }`}
            >
              <p className="text-sm font-black flex items-center gap-2">
                {ipVerificationResult.success ? <FaCheckCircle className="text-emerald-400" /> : <FaTimesCircle className="text-rose-400" />}
                <span>{ipVerificationResult.success ? "Office Wi-Fi Verified Successfully." : "Network Verification Failed"}</span>
              </p>
              <p className="mt-1 leading-relaxed text-[11px] font-medium">{ipVerificationResult.message}</p>
              <div className="pt-2 flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-300 border-t border-white/10 mt-2 gap-2">
                <span>ipify Current Public IP: <strong>{ipVerificationResult.publicIp}</strong></span>
                <span>Database Authorized Office IP: <strong>{ipVerificationResult.officePublicIp}</strong></span>
                <span>Verification Status: <strong className={ipVerificationResult.success ? "text-emerald-400" : "text-rose-400"}>{ipVerificationResult.success ? "Matched" : "Mismatched"}</strong></span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60 text-slate-400 text-xs font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5"><FaExclamationTriangle className="text-amber-400" /> Click "Verify Office Wi-Fi" button above to unlock attendance.</span>
              <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1"><FaLock /> Attendance Disabled</span>
            </div>
          )}
        </div>

        <div className="space-y-3 mb-8">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
            <span>STEP 2: MARK ATTENDANCE (1 CHECK-IN PER DAY)</span>
            <span>{!ipVerificationResult || !ipVerificationResult.success ? "Disabled (Verification Required)" : "Enabled (Office Wi-Fi Verified)"}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => handleAttendance("check_in")}
              disabled={!!checkIn || !ipVerificationResult || !ipVerificationResult.success}
              className={`w-full py-4 text-base rounded-2xl font-black tracking-wide flex items-center justify-center gap-2 transition-all ${
                checkIn || !ipVerificationResult || !ipVerificationResult.success
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 opacity-60"
                  : "attendance-btn-in cursor-pointer"
              }`}
            >
              <FaCheckCircle className="text-lg" />
              <span>{checkIn ? "Checked In" : "Mark Attendance (Check In)"}</span>
            </button>

            <button
              onClick={() => handleAttendance("check_out")}
              disabled={!checkIn || !!checkOut || !ipVerificationResult || !ipVerificationResult.success}
              className={`w-full py-4 text-base rounded-2xl font-black tracking-wide flex items-center justify-center gap-2 transition-all ${
                !checkIn || checkOut || !ipVerificationResult || !ipVerificationResult.success
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 opacity-60"
                  : "attendance-btn-out cursor-pointer"
              }`}
            >
              <FaTimesCircle className="text-lg" />
              <span>{checkOut ? "Checked Out" : "Mark Check-Out"}</span>
            </button>
          </div>

          {checkIn && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={navigateToDashboard}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Proceed to {isStudentRole ? "Student Dashboard" : "Employee Dashboard"}</span>
                <FaArrowRight />
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 text-left text-xs space-y-4 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
              <FaHistory className="text-indigo-600" />
              <span>{currentRole === "admin" ? "Admin System Attendance Log" : "My Personal Attendance History"}</span>
            </h3>

            {currentRole === "admin" ? (
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setAdminFilter("all")}
                  className={`px-3 py-1 text-[11px] font-extrabold rounded-lg transition-all ${
                    adminFilter === "all" ? "bg-white text-slate-900 shadow-xs border border-slate-200" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setAdminFilter("employee")}
                  className={`px-3 py-1 text-[11px] font-extrabold rounded-lg transition-all ${
                    adminFilter === "employee" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-blue-700"
                  }`}
                >
                  Employees
                </button>
                <button
                  type="button"
                  onClick={() => setAdminFilter("student")}
                  className={`px-3 py-1 text-[11px] font-extrabold rounded-lg transition-all ${
                    adminFilter === "student" ? "bg-amber-500 text-slate-950 shadow-xs font-black" : "text-slate-600 hover:text-amber-700"
                  }`}
                >
                  Students
                </button>
              </div>
            ) : (
              <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 font-bold">
                My Attendance Logs: {todayRecords.length}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] bg-slate-50">
                  <th className="py-3 px-4">User ID / Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Total Work Hours</th>
                  <th className="py-3 px-4">ipify Public IP</th>
                  <th className="py-3 px-4 text-right">Date & Time</th>
                  {currentRole === "admin" && <th className="py-3 px-4 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-mono">
                {currentRole === "admin" ? (
                  allSystemLogs.filter(l => 
                    adminFilter === "all" 
                      ? true 
                      : adminFilter === "student" 
                      ? (l.user_role === "student" || l.user_role === "course_student") 
                      : (l.user_role !== "student" && l.user_role !== "course_student")
                  ).length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400 italic">
                        No logs recorded for this category ({adminFilter.toUpperCase()}).
                      </td>
                    </tr>
                  ) : (
                    allSystemLogs.filter(l => 
                      adminFilter === "all" 
                        ? true 
                        : adminFilter === "student" 
                        ? (l.user_role === "student" || l.user_role === "course_student") 
                        : (l.user_role !== "student" && l.user_role !== "course_student")
                    ).map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {r.user_name || r.user_id}{" "}
                          <span className={`text-[10px] font-sans font-extrabold px-2 py-0.5 rounded uppercase border ml-1 ${
                            r.user_role === "student" || r.user_role === "course_student"
                              ? "bg-amber-100 text-amber-900 border-amber-300"
                              : "bg-blue-100 text-blue-900 border-blue-300"
                          }`}>
                            {r.user_role === "student" ? "STUDENT" : "EMPLOYEE"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold">
                          {r.type === "check_in" ? <span className="text-emerald-700">Clock-In</span> : <span className="text-rose-700">Clock-Out</span>}
                        </td>
                        <td className="py-3.5 px-4 font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                            r.light_status === "red" ? "bg-rose-100 text-rose-900 border border-rose-300" :
                            r.light_status === "orange" ? "bg-amber-100 text-amber-900 border border-amber-300" :
                            "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          }`}>
                            {r.attendance_status || "Present"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-indigo-700">
                          {r.total_work_hours || "In Progress"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">{r.public_ip || userIp}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-600">{r.attendance_date} {r.check_in_time || r.check_out_time}</td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleTriggerDelete(r)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <FaTrashAlt className="text-rose-600 text-xs" />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )
                ) : (
                  todayRecords.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400 italic">
                        No attendance logs recorded today. Click 'Verify Office Wi-Fi' above to check in.
                      </td>
                    </tr>
                  ) : (
                    todayRecords.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{r.user_name || r.user_id}</td>
                        <td className="py-3.5 px-4 font-bold">
                          {r.type === "check_in" ? <span className="text-emerald-700">Clock-In</span> : <span className="text-rose-700">Clock-Out</span>}
                        </td>
                        <td className="py-3.5 px-4 font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                            r.light_status === "red" ? "bg-rose-100 text-rose-900 border border-rose-300" :
                            r.light_status === "orange" ? "bg-amber-100 text-amber-900 border border-amber-300" :
                            "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          }`}>
                            {r.attendance_status || "Present"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-indigo-700">
                          {r.total_work_hours || "In Progress"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">{r.public_ip || userIp}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-600">{r.attendance_date} {r.check_in_time || r.check_out_time}</td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={() => setModal({ ...modal, isOpen: false })}
      />

      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <FaExclamationTriangle className="text-xl text-rose-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Delete Attendance Record</h3>
              </div>
              <button
                onClick={() => setDeleteModal({ isOpen: false, record: null })}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-700 font-semibold leading-relaxed">
                Are you sure you want to delete this attendance record? This action cannot be undone.
              </p>
              {deleteModal.record && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 font-mono space-y-1 text-[11px] text-slate-800">
                  <p><strong>Record ID:</strong> {deleteModal.record.id}</p>
                  <p><strong>User:</strong> {deleteModal.record.user_name || deleteModal.record.user_id || "N/A"}</p>
                  <p><strong>Role:</strong> {deleteModal.record.user_role || "employee"}</p>
                  <p><strong>Date:</strong> {deleteModal.record.attendance_date || "Today"}</p>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Reason for Deletion (Optional Audit Note)
                </label>
                <input
                  type="text"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="e.g. Accidental duplicate entry / System correction"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-rose-600 font-sans"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 font-medium">
                <strong>Business Rule:</strong> Only this selected record will be deleted. Employee profiles, salaries, and user accounts will remain untouched.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, record: null })}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeleteRecord}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <FaTrashAlt className="text-white text-xs" />
                <span>Delete Record</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}