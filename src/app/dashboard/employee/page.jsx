"use client";

import { useEffect, useState, useMemo } from "react";
import { dbFetch, dbSaveRecord, dbSaveList } from "@/lib/dbPersistence";
import Modal from "@/components/Modal";
import { showToast } from "@/components/Toast";
import { verifyOfficeWifiAttendance } from "@/lib/wifiVerificationUtils";
import {
  FaUserCheck,
  FaCalendarCheck,
  FaTasks,
  FaBullhorn,
  FaClock,
  FaCheckCircle,
  FaPlay,
  FaPause,
  FaWifi,
  FaPaperPlane,
  FaExclamationTriangle,
  FaUserTimes,
  FaBriefcase,
  FaFileAlt,
  FaLaptopCode
} from "react-icons/fa";

import {
  getAssignedExamsForUser,
  getExamAttemptsForUser,
  submitExamAttempt
} from "@/lib/mcqExamUtils";

export default function EmployeeDedicatedDashboardPage() {
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employeeName, setEmployeeName] = useState("");

  // Attendance State
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [myAttendanceHistory, setMyAttendanceHistory] = useState([]);
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [wifiStatus, setWifiStatus] = useState("Verifying Wi-Fi...");
  const [userIp, setUserIp] = useState("");

  // Tasks State
  const [myTasks, setMyTasks] = useState([]);
  
  // Announcements State
  const [announcements, setAnnouncements] = useState([]);

  // Dynamic MCQ Exams State
  const [assignedExams, setAssignedExams] = useState([]);
  const [examAttempts, setExamAttempts] = useState([]);
  const [activeExam, setActiveExam] = useState(null);
  const [examTimerSeconds, setExamTimerSeconds] = useState(0);
  const [latestAttemptResult, setLatestAttemptResult] = useState(null);
  const [mcqModalOpen, setMcqModalOpen] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});

  // Leave Form State
  const [myLeaves, setMyLeaves] = useState([]);
  const [leaveForm, setLeaveForm] = useState({
    leave_type: "Casual Leave",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
    reason: "",
  });
  const [submittingLeave, setSubmittingLeave] = useState(false);

  // Modal Notification
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info" });

  const showAlert = (title, message, type = "info") => {
    setModal({ isOpen: true, title, message, type });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  useEffect(() => {
    const savedEmail = (localStorage.getItem("current_user_email") || "").trim().toLowerCase();
    const savedName = localStorage.getItem("current_user_name") || savedEmail.split("@")[0] || "Employee";

    setEmployeeEmail(savedEmail);
    setEmployeeName(savedName);

    fetchEmployeeDashboardData(savedEmail);
  }, []);

  const fetchEmployeeDashboardData = async (email) => {
    if (!email) return;

    // 1. Fetch Today's Attendance & History Log
    try {
      const allLogs = await dbFetch("attendance").catch(() => []);
      const userLogs = (allLogs || []).filter(
        (l) => (l.user_email || l.email || "").toLowerCase().trim() === email
      );
      setMyAttendanceHistory(userLogs);

      const todayStr = new Date().toISOString().split("T")[0];
      const matchToday = userLogs.find(
        (l) => l.attendance_date === todayStr || (l.timestamp && l.timestamp.startsWith(todayStr))
      );

      const key = `today_attendance_${email}`;
      const savedToday = localStorage.getItem(key);
      if (savedToday) {
        try {
          const parsed = JSON.parse(savedToday);
          const checkInLog = parsed.find(r => r.type === "check_in" || r.check_in_time);
          setTodayAttendance(checkInLog || matchToday || null);
        } catch(e) {
          setTodayAttendance(matchToday || null);
        }
      } else {
        setTodayAttendance(matchToday || null);
      }
    } catch (e) {}

    // Verify Wi-Fi Network
    try {
      const wifiRes = await verifyOfficeWifiAttendance({
        userEmail: email,
        userName: employeeName,
        userRole: "employee",
      });
      setUserIp(wifiRes.currentPublicIp || "Offline");
      setWifiStatus(wifiRes.success ? "Office Wi-Fi Verified 🟢" : "Remote / Unverified Network 🟠");
    } catch (e) {
      setWifiStatus("Wi-Fi Check Active 🔵");
    }

    // 2. Fetch My Assigned Tasks
    try {
      const allTasks = await dbFetch("daily_tasks").catch(() => []);
      const assigned = (allTasks || []).filter((t) => {
        const tEmail = (t.assignedToEmail || t.assigned_to_email || "").toLowerCase().trim();
        const tName = (t.assignedTo || t.assigned_to || t.author || "").toLowerCase();
        return (
          tEmail === email ||
          (email && tEmail.includes(email)) ||
          (employeeName && tName.includes(employeeName.toLowerCase()))
        );
      });
      setMyTasks(assigned);
    } catch (e) {}

    // 3. Fetch Announcements
    try {
      const allAnnouncements = await dbFetch("announcements").catch(() => []);
      setAnnouncements(allAnnouncements || []);
    } catch (e) {}

    // 4. Fetch My Leave Requests
    try {
      const allLeaves = await dbFetch("leaves").catch(() => []);
      const userLeaves = (allLeaves || []).filter(
        (l) => (l.applicant_email || l.email || "").toLowerCase().trim() === email
      );
      setMyLeaves(userLeaves);
    } catch (e) {}

    // 5. Fetch Database MCQ Exams & Attempts
    try {
      const examsList = await getAssignedExamsForUser(email);
      const attemptsList = await getExamAttemptsForUser(email);
      setAssignedExams(examsList || []);
      setExamAttempts(attemptsList || []);
    } catch (e) {}
  };

  // Handle Start MCQ Exam
  const handleStartMcqExam = (exam) => {
    setActiveExam(exam);
    setUserAnswers({});
    setLatestAttemptResult(null);
    const limitMins = Number(exam.time_limit || 10);
    setExamTimerSeconds(limitMins * 60);
    setMcqModalOpen(true);
  };

  // Handle Submit MCQ Exam
  const handleSubmitMcqExam = async () => {
    if (!activeExam) return;

    const limitSecs = Number(activeExam.time_limit || 10) * 60;
    const timeTaken = Math.max(1, limitSecs - examTimerSeconds);
    const attempt = await submitExamAttempt({
      exam: activeExam,
      userEmail: employeeEmail,
      userName: employeeName,
      userRole: "employee",
      userAnswers: userAnswers,
      timeTakenSeconds: timeTaken,
    });

    setLatestAttemptResult(attempt);
    setExamAttempts((prev) => [attempt, ...prev.filter((a) => a.id !== attempt.id)]);
    showToast("Exam Submitted 📝", `Result: ${attempt.result} (${attempt.percentage}%)`, attempt.result === "PASSED" ? "success" : "info");
  };

  // MCQ Exam Countdown Timer Effect
  useEffect(() => {
    let interval = null;
    if (mcqModalOpen && activeExam && examTimerSeconds > 0 && latestAttemptResult === null) {
      interval = setInterval(() => {
        setExamTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            showToast("Time Expired ⏱️", "Time is over. Your exam has been submitted automatically.", "info");
            handleSubmitMcqExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mcqModalOpen, activeExam, examTimerSeconds, latestAttemptResult]);

  // Check-In Handler
  const handleCheckIn = async () => {
    if (todayAttendance?.check_in_time) {
      showToast("Already Checked In ℹ️", `Checked in today at ${todayAttendance.check_in_time}.`, "info");
      return;
    }

    setMarkingAttendance(true);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const newRecord = {
      id: `att-${Date.now()}`,
      employee_id: employeeEmail,
      user_email: employeeEmail,
      user_name: employeeName,
      user_role: "employee",
      type: "check_in",
      check_in_time: timeStr,
      check_out_time: null,
      attendance_status: "Present (On Time)",
      attendance_date: now.toISOString().split("T")[0],
      timestamp: now.toISOString(),
      public_ip: userIp || "127.0.0.1",
    };

    setTodayAttendance(newRecord);
    setMyAttendanceHistory((prev) => [newRecord, ...prev.filter(r => r.id !== newRecord.id)]);

    try {
      const key = `today_attendance_${employeeEmail}`;
      localStorage.setItem(key, JSON.stringify([newRecord]));
      await dbSaveRecord("attendance", newRecord).catch(() => {});
    } catch (e) {}

    setMarkingAttendance(false);
    showToast("Check-In Successful 🟢", `Checked in at ${timeStr}.`, "success");
    showAlert("Check-In Successful 🟢", `Checked in successfully at ${timeStr}!\n\nStatus: Present (On Time)\nNetwork: ${wifiStatus}`, "success");
  };

  // Check-Out Handler
  const handleCheckOut = async () => {
    if (!todayAttendance?.check_in_time) {
      showToast("Check-In Required 🛑", "You must check in first before checking out.", "error");
      return;
    }
    if (todayAttendance?.check_out_time) {
      showToast("Already Checked Out ℹ️", `Checked out today at ${todayAttendance.check_out_time}.`, "info");
      return;
    }

    setMarkingAttendance(true);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const updatedRecord = {
      ...todayAttendance,
      check_out_time: timeStr,
      attendance_status: "Present (Completed)",
      updated_at: now.toISOString(),
    };

    setTodayAttendance(updatedRecord);
    setMyAttendanceHistory((prev) =>
      prev.map((r) => (r.id === updatedRecord.id || r.attendance_date === updatedRecord.attendance_date ? updatedRecord : r))
    );

    try {
      const key = `today_attendance_${employeeEmail}`;
      localStorage.setItem(key, JSON.stringify([updatedRecord]));
      await dbSaveRecord("attendance", updatedRecord).catch(() => {});
    } catch (e) {}

    setMarkingAttendance(false);
    showToast("Check-Out Successful 🔴", `Checked out at ${timeStr}. Daily work log completed.`, "success");
    showAlert("Check-Out Successful 🔴", `Checked out successfully at ${timeStr}!\n\nDaily attendance log marked as Completed.`, "success");
  };

  // Task Status Update Handler
  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    const updated = myTasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          status: newStatus,
          isTimerRunning: newStatus === "In Progress",
          progress: newStatus === "Completed" ? 100 : t.progress || 0,
        };
      }
      return t;
    });

    setMyTasks(updated);

    const targetTask = updated.find((t) => t.id === taskId);
    if (targetTask) {
      await dbSaveRecord("daily_tasks", targetTask).catch(() => {});
    }

    showToast("Task Updated 📝", `Status updated to '${newStatus}'.`, "success");
  };

  // Submit Leave Request Handler
  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!leaveForm.reason.trim()) {
      showToast("Validation Error 🛑", "Please enter a reason for your leave request.", "error");
      return;
    }

    setSubmittingLeave(true);

    const newLeave = {
      id: `leave-${Date.now()}`,
      applicant_name: employeeName,
      applicant_email: employeeEmail,
      email: employeeEmail,
      role: "employee",
      leave_type: leaveForm.leave_type,
      start_date: leaveForm.start_date,
      end_date: leaveForm.end_date,
      reason: leaveForm.reason.trim(),
      status: "Pending",
      applied_at: new Date().toISOString().split("T")[0],
    };

    const updatedLeaves = [newLeave, ...myLeaves];
    setMyLeaves(updatedLeaves);
    await dbSaveRecord("leaves", newLeave).catch(() => {});

    setSubmittingLeave(false);
    setLeaveForm({
      leave_type: "Casual Leave",
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date().toISOString().split("T")[0],
      reason: "",
    });

    showToast("Leave Submitted 📝", "Your leave request has been submitted for Admin approval.", "success");
    showAlert("Leave Request Submitted 🟢", `Leave request (${leaveForm.leave_type}) submitted successfully!\n\nStatus: Pending Admin/HR Approval.`, "success");
  };

  // Metrics Calculations
  const pendingTasksCount = useMemo(() => myTasks.filter((t) => t.status === "Pending" || t.status === "In Progress").length, [myTasks]);
  const completedTasksCount = useMemo(() => myTasks.filter((t) => t.status === "Completed").length, [myTasks]);
  const pendingLeavesCount = useMemo(() => myLeaves.filter((l) => l.status === "Pending").length, [myLeaves]);

  return (
    <div className="space-[#F8FAFC] space-y-6 max-w-7xl mx-auto">
      {/* Modal Notification */}
      <Modal isOpen={modal.isOpen} title={modal.title} message={modal.message} type={modal.type} onClose={closeModal} />

      {/* HEADER BANNER */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-full border border-[#2563EB]/20">
              Official Employee Workspace
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#0F172A] mt-1.5 flex items-center gap-2.5">
            <FaBriefcase className="text-[#2563EB]" />
            <span>Welcome Back, {employeeName}!</span>
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Logged in as <strong className="text-[#0F172A]">{employeeEmail}</strong> • Employee Portal Active
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-2 rounded-xl text-right">
            <span className="block text-[10px] font-semibold text-[#64748B] uppercase">Network Verification</span>
            <span className="text-xs font-bold text-[#2563EB] flex items-center gap-1.5 justify-end">
              <FaWifi className="text-xs" /> {wifiStatus}
            </span>
          </div>
        </div>
      </div>

      {/* SUMMARY METRICS CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs text-[#64748B]">
            <span>Today's Attendance</span>
            <FaCalendarCheck className="text-emerald-500" />
          </div>
          <p className="text-lg font-bold text-[#0F172A]">
            {todayAttendance ? "Checked In" : "Not Marked"}
          </p>
          <p className="text-xs text-[#64748B]">
            {todayAttendance ? `In: ${todayAttendance.check_in_time || "Today"}` : "Action required"}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs text-[#64748B]">
            <span>My Pending Tasks</span>
            <FaTasks className="text-amber-500" />
          </div>
          <p className="text-2xl font-black text-[#0F172A]">{pendingTasksCount}</p>
          <p className="text-xs text-[#64748B]">Tasks in progress / pending</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs text-[#64748B]">
            <span>Completed Tasks</span>
            <FaCheckCircle className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-[#0F172A]">{completedTasksCount}</p>
          <p className="text-xs text-[#64748B]">Finished work items</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs text-[#64748B]">
            <span>Pending Leaves</span>
            <FaClock className="text-blue-500" />
          </div>
          <p className="text-2xl font-black text-[#0F172A]">{pendingLeavesCount}</p>
          <p className="text-xs text-[#64748B]">Awaiting Admin review</p>
        </div>
      </div>

      {/* MAIN TWO-COLUMN DASHBOARD CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN (7 COLS): Attendance Card & My Tasks */}
        <div className="lg:col-span-7 space-y-6">
          {/* TODAY'S ATTENDANCE CARD */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <FaCalendarCheck className="text-[#2563EB]" />
                <span>Today's Attendance Control</span>
              </h2>
              <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                todayAttendance?.check_out_time
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : todayAttendance?.check_in_time
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}>
                {todayAttendance?.check_out_time
                  ? "Completed"
                  : todayAttendance?.check_in_time
                  ? "Checked In"
                  : "Not Checked In"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <span className="text-[10px] font-semibold text-[#64748B] uppercase">Check-In Time</span>
                <p className="text-base font-mono font-bold text-[#0F172A]">
                  {todayAttendance?.check_in_time || "--:--"}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <span className="text-[10px] font-semibold text-[#64748B] uppercase">Check-Out Time</span>
                <p className="text-base font-mono font-bold text-[#0F172A]">
                  {todayAttendance?.check_out_time || "--:--"}
                </p>
              </div>
            </div>

            {/* Check-In / Check-Out Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleCheckIn}
                disabled={markingAttendance || Boolean(todayAttendance?.check_in_time)}
                className={`py-3 rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                  todayAttendance?.check_in_time
                    ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                    : "bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                }`}
              >
                <FaUserCheck />
                <span>{todayAttendance?.check_in_time ? "Checked In 🟢" : "Check In"}</span>
              </button>

              <button
                type="button"
                onClick={handleCheckOut}
                disabled={markingAttendance || !todayAttendance?.check_in_time || Boolean(todayAttendance?.check_out_time)}
                className={`py-3 rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                  !todayAttendance?.check_in_time || todayAttendance?.check_out_time
                    ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                    : "bg-rose-600 hover:bg-rose-700 text-white"
                }`}
              >
                <FaUserTimes />
                <span>{todayAttendance?.check_out_time ? "Checked Out 🔴" : "Check Out"}</span>
              </button>
            </div>
          </div>

          {/* MY ATTENDANCE HISTORY TABLE */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <FaCalendarCheck className="text-[#2563EB]" />
                <span>My Attendance History</span>
              </h2>
              <span className="text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-full border border-[#2563EB]/20">
                {myAttendanceHistory.length} Logs
              </span>
            </div>

            {myAttendanceHistory.length === 0 ? (
              <p className="text-xs text-[#64748B] italic text-center py-4">No attendance records found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] text-[#64748B] uppercase text-[10px]">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Check-In</th>
                      <th className="py-2.5 px-3">Check-Out</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {myAttendanceHistory.map((rec) => (
                      <tr key={rec.id || rec.timestamp} className="hover:bg-[#F8FAFC]">
                        <td className="py-2.5 px-3 font-semibold text-[#0F172A]">
                          {rec.attendance_date || rec.date || "Today"}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-emerald-700">
                          {rec.check_in_time || "--:--"}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-rose-700">
                          {rec.check_out_time || "--:--"}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                            (rec.attendance_status || "").toLowerCase().includes("completed") || (rec.attendance_status || "").toLowerCase().includes("present")
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : (rec.attendance_status || "").toLowerCase().includes("late")
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}>
                            {rec.attendance_status || "Present"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          {/* ONLINE MCQ EXAM CARD SECTION */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <FaLaptopCode className="text-[#2563EB]" />
                <span>Online MCQ Exam</span>
              </h2>
              <span className="text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-full border border-[#2563EB]/20">
                {assignedExams.length} Assigned
              </span>
            </div>

            {assignedExams.length === 0 ? (
              <div className="p-6 text-center bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-[#64748B] text-xs italic space-y-1">
                <p className="font-bold text-[#0F172A]">Online MCQ Exam</p>
                <p>No exam has been assigned to you yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignedExams.map((exam) => {
                  const attempt = examAttempts.find((a) => a.exam_id === exam.id);

                  return (
                    <div key={exam.id} className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0F172A]">{exam.title}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                          attempt
                            ? attempt.result === "PASSED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>
                          {attempt ? `Completed (${attempt.result})` : "Assigned"}
                        </span>
                      </div>

                      <p className="text-xs text-[#64748B]">{exam.description || "Official evaluation test."}</p>

                      <div className="text-[11px] text-[#64748B] flex justify-between bg-white p-2.5 rounded-lg border border-[#E2E8F0]">
                        <span>Questions: <strong>{exam.questions?.length || 0}</strong></span>
                        <span>Time Limit: <strong>{exam.time_limit || 10} Mins</strong></span>
                        <span>Due: <strong>{exam.due_date || "Open"}</strong></span>
                      </div>

                      {attempt ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                            <span>Score: {attempt.score} ({attempt.percentage}%)</span>
                            <span>{attempt.result}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveExam(exam);
                              setLatestAttemptResult(attempt);
                              setMcqModalOpen(true);
                            }}
                            className="w-full py-2.5 rounded-xl border border-[#2563EB] bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] font-bold text-xs transition-colors cursor-pointer"
                          >
                            View Result
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartMcqExam(exam)}
                          className="w-full py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
                        >
                          Start MCQ Exam Now
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* MY ASSIGNED TASKS */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <FaTasks className="text-[#2563EB]" />
                <span>My Assigned Tasks</span>
              </h2>
              <span className="text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-full border border-[#2563EB]/20">
                {myTasks.length} Assigned
              </span>
            </div>

            {myTasks.length === 0 ? (
              <div className="p-8 text-center bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-[#64748B] text-xs italic">
                No tasks assigned to you currently. Check back later or notify Admin.
              </div>
            ) : (
              <div className="space-y-3">
                {myTasks.map((t) => (
                  <div key={t.id} className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-bold text-[#0F172A]">{t.task || t.task_title || "Assigned Work Item"}</h3>
                        <p className="text-[11px] text-[#64748B] mt-0.5">{t.description || "Complete assigned project deliverables as per guidelines."}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border shrink-0 ${
                        t.status === "Completed"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : t.status === "In Progress"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {t.status || "Pending"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#64748B] pt-1 border-t border-[#E2E8F0]">
                      <span>Due: <strong className="text-[#0F172A]">{t.dueDate || t.due_date || "Today"}</strong></span>
                      <span>Priority: <strong className="text-[#2563EB]">{t.priority || "Normal"}</strong></span>
                    </div>

                    {/* Task Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      {t.status !== "In Progress" && t.status !== "Completed" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateTaskStatus(t.id, "In Progress")}
                          className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <FaPlay className="text-[9px]" /> Start Task
                        </button>
                      )}

                      {t.status === "In Progress" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateTaskStatus(t.id, "Pending")}
                          className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <FaPause className="text-[9px]" /> Pause
                        </button>
                      )}

                      {t.status !== "Completed" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateTaskStatus(t.id, "Completed")}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <FaCheckCircle className="text-[9px]" /> Complete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (5 COLS): Announcements & Leave Application */}
        <div className="lg:col-span-5 space-y-6">
          {/* OFFICIAL ANNOUNCEMENTS */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <FaBullhorn className="text-[#2563EB]" />
                <span>Company Announcements</span>
              </h2>
              <span className="text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-full border border-[#2563EB]/20">
                Notice Board
              </span>
            </div>

            {announcements.length === 0 ? (
              <div className="p-6 text-center bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-[#64748B] text-xs italic">
                No active announcements at the moment.
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {announcements.map((a) => (
                  <div key={a.id} className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#0F172A]">{a.title}</h4>
                      <span className="text-[9px] font-semibold text-[#64748B]">{a.date || a.created_at || "Recent"}</span>
                    </div>
                    <p className="text-[11px] text-[#64748B] leading-relaxed">{a.message || a.content}</p>
                    <p className="text-[9px] text-[#2563EB] font-bold pt-0.5">Posted by: {a.posted_by || "Management"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* APPLY FOR LEAVE FORM */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4">
            <div className="border-b border-[#E2E8F0] pb-3">
              <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <FaPaperPlane className="text-[#2563EB]" />
                <span>Apply for Leave</span>
              </h2>
            </div>

            <form onSubmit={handleLeaveSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] uppercase mb-1">Leave Type *</label>
                <select
                  value={leaveForm.leave_type}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}
                  className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] bg-white outline-none focus:border-[#2563EB]"
                >
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Emergency Leave">Emergency Leave</option>
                  <option value="Annual Leave">Annual Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] uppercase mb-1">Start Date</label>
                  <input
                    type="date"
                    value={leaveForm.start_date}
                    onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                    className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] uppercase mb-1">End Date</label>
                  <input
                    type="date"
                    value={leaveForm.end_date}
                    onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                    className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] uppercase mb-1">Reason *</label>
                <textarea
                  rows={2}
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="State reason for leave request..."
                  required
                  className="w-full rounded-xl border border-[#E2E8F0] p-3 text-xs text-[#0F172A] outline-none focus:border-[#2563EB]"
                />
              </div>

              <button
                type="submit"
                disabled={submittingLeave}
                className="w-full py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
              >
                {submittingLeave ? "Submitting..." : "Submit Leave Request"}
              </button>
            </form>
          </div>

          {/* MY LEAVE HISTORY FEED */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">My Leave Applications History</h3>
            {myLeaves.length === 0 ? (
              <p className="text-xs text-[#64748B] italic">No leave applications submitted yet.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {myLeaves.map((l) => (
                  <div key={l.id} className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#0F172A]">{l.leave_type}</p>
                      <p className="text-[10px] text-[#64748B]">{l.start_date} to {l.end_date}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                      l.status === "Approved"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : l.status === "Rejected"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {l.status || "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MCQ EXAM RUNNER MODAL */}
      {mcqModalOpen && activeExam && (
        <Modal
          isOpen={mcqModalOpen}
          onClose={() => setMcqModalOpen(false)}
          title={activeExam.title}
        >
          <div className="space-y-6 text-xs text-slate-700">
            {latestAttemptResult === null ? (
              <div className="space-y-5">
                <div className="p-3.5 rounded-xl bg-blue-900 text-white flex justify-between items-center shadow-xs">
                  <div>
                    <span className="text-[10px] text-blue-200 uppercase font-bold block">Passing Criteria</span>
                    <span className="font-bold text-xs">{activeExam.passing_score || 50}% Minimum Score</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-blue-200 uppercase font-bold block">Time Remaining</span>
                    <span className="font-mono text-base font-black text-amber-300">
                      {Math.floor(examTimerSeconds / 60).toString().padStart(2, "0")}:
                      {(examTimerSeconds % 60).toString().padStart(2, "0")}
                    </span>
                  </div>
                </div>

                {(activeExam.questions || []).map((q, qIdx) => (
                  <div key={q.id || qIdx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <p className="font-bold text-slate-900 text-xs">
                      Question {qIdx + 1} of {(activeExam.questions || []).length}: {q.question}
                    </p>
                    <div className="space-y-2 pt-1">
                      {[
                        { key: "option_a", text: q.option_a || q.options?.[0] },
                        { key: "option_b", text: q.option_b || q.options?.[1] },
                        { key: "option_c", text: q.option_c || q.options?.[2] },
                        { key: "option_d", text: q.option_d || q.options?.[3] },
                      ].map((opt) => (
                        <label
                          key={opt.key}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                            userAnswers[q.id] === opt.key
                              ? "bg-blue-100 border-blue-500 text-blue-900 font-bold"
                              : "bg-white border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            checked={userAnswers[q.id] === opt.key}
                            onChange={() => setUserAnswers((prev) => ({ ...prev, [q.id]: opt.key }))}
                            className="text-blue-600"
                          />
                          <span>{opt.text}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setMcqModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitMcqExam}
                    className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-xs cursor-pointer"
                  >
                    Submit Exam Answers
                  </button>
                </div>
              </div>
            ) : (
              /* Score & Result Display */
              <div className="text-center py-6 space-y-4">
                <div className={`mx-auto h-20 w-20 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-md ${
                  latestAttemptResult.result === "PASSED" ? "bg-emerald-600" : "bg-rose-600"
                }`}>
                  {latestAttemptResult.percentage}%
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">
                    {latestAttemptResult.result === "PASSED" ? "Congratulations! Exam Passed 🎉" : "Exam Completed (Needs Improvement)"}
                  </h3>
                  <p className="text-xs text-slate-500">Your score has been saved to your employee record.</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-sm mx-auto text-xs space-y-2 text-left">
                  <div className="flex justify-between border-b border-slate-200 pb-1">
                    <span className="text-slate-500">Total Questions:</span>
                    <span className="font-bold text-slate-900">{latestAttemptResult.total_questions}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1">
                    <span className="text-slate-500">Correct Answers:</span>
                    <span className="font-bold text-emerald-700">{latestAttemptResult.correct_answers}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1">
                    <span className="text-slate-500">Wrong Answers:</span>
                    <span className="font-bold text-rose-600">{latestAttemptResult.wrong_answers}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1">
                    <span className="text-slate-500">Score Ratio:</span>
                    <span className="font-bold text-slate-900">{latestAttemptResult.score}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Result:</span>
                    <span className={`font-black ${latestAttemptResult.result === "PASSED" ? "text-emerald-700" : "text-rose-600"}`}>
                      {latestAttemptResult.result}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMcqModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-xs"
                >
                  Close Result Summary
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
