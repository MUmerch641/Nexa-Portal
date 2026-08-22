"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Modal from "@/components/Modal";
import { showToast } from "@/components/Toast";
import { generatePrintableStudentFeeReceiptPdf } from "@/lib/generateStudentReceiptPdf";
import { generatePrintable3MonthStudentCertificatePdf } from "@/lib/generate3MonthStudentCertificatePdf";
import { dbFetch } from "@/lib/dbPersistence";
import { calculate30DayFeeCycles } from "@/lib/studentEnrollmentUtils";
import {
  FaGraduationCap,
  FaCalendarAlt,
  FaChalkboardTeacher,
  FaTasks,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaFileUpload,
  FaFileDownload,
  FaMoneyBillWave,
  FaShieldAlt,
  FaUserCheck,
  FaBuilding,
  FaBookReader,
  FaAward,
  FaQrcode,
  FaLaptopCode,
  FaCode,
  FaClipboardCheck,
  FaDesktop,
  FaBullhorn,
  FaPlay,
  FaPause,
  FaStop,
  FaCheckDouble,
  FaShareAlt,
  FaPrint,
  FaSearch,
  FaRegLightbulb,
  FaUserTimes,
  FaPaperPlane
} from "react-icons/fa";

import {
  getDailyTasks,
  saveTaskRecord,
  getCertificates,
  saveCertificate,
} from "@/lib/studentTaskUtils";

import {
  getAssignedExamsForUser,
  getExamAttemptsForUser,
  submitExamAttempt
} from "@/lib/mcqExamUtils";

// Centralized Safe Date Validator
const formatSafeDueDate = (rawDate) => {
  if (
    !rawDate ||
    rawDate === "0000-00-00" ||
    rawDate === "2024-00-00" ||
    rawDate === "Invalid Date" ||
    rawDate.includes("-00")
  ) {
    return "Pending Verification";
  }
  try {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return "Pending Verification";
    return rawDate;
  } catch (e) {
    return "Pending Verification";
  }
};

export default function StudentDedicatedDashboardPage() {
  const [role, setRole] = useState("student");
  const [studentInfo, setStudentInfo] = useState({
    name: "Enrolled Student",
    email: "",
    enrollmentNo: "ENR-2026-101",
    course: "Full Stack MERN Web Development",
    batch: "Batch #14 (Morning Tech)",
    instructor: "Lead Industry Instructor",
    currentWeek: "Week #1 of 12 (Orientation & Course Setup)",
    progress: 0,
    attendance: 95,
  });

  const [feeStatus, setFeeStatus] = useState({
    dueDate: "2026-08-08",
    totalFee: 25000,
    paidAmount: 25000,
    remainingBalance: 0,
    status: "Approved & Paid",
    receiptNo: "REC-99812",
  });

  // Daily Tasks State with Timer
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [activeTaskTimerId, setActiveTaskTimerId] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Dynamic Database MCQ Exams State
  const [assignedExams, setAssignedExams] = useState([]);
  const [examAttempts, setExamAttempts] = useState([]);
  const [activeExam, setActiveExam] = useState(null);
  const [examTimerSeconds, setExamTimerSeconds] = useState(0);
  const [latestAttemptResult, setLatestAttemptResult] = useState(null);
  const [mcqModalOpen, setMcqModalOpen] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [examSubmittedScore, setExamSubmittedScore] = useState(null);

  // Certificate Modal & QR State
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);
  const [feeReceiptModalOpen, setFeeReceiptModalOpen] = useState(false);

  const [feeCyclesList, setFeeCyclesList] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [studentAttendanceHistory, setStudentAttendanceHistory] = useState([]);
  const [markingAttendance, setMarkingAttendance] = useState(false);

  // Leave Form & History State
  const [myStudentLeaves, setMyStudentLeaves] = useState([]);
  const [submittingStudentLeave, setSubmittingStudentLeave] = useState(false);
  const [studentLeaveForm, setStudentLeaveForm] = useState({
    leave_type: "Casual Leave",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
    reason: "",
  });

  useEffect(() => {
    const savedRole = localStorage.getItem("user_role") || "student";
    const savedEmail = (localStorage.getItem("current_user_email") || "").trim().toLowerCase();
    const savedName = localStorage.getItem("current_user_name") || "";

    setRole(savedRole);

    async function fetchStudentData() {
      const allStudents = await dbFetch("students").catch(() => []);
      const matched = (allStudents || []).find(
        (s) => (s.email || "").trim().toLowerCase() === savedEmail
      );

      if (matched) {
        const courseTitle = matched.course_name || matched.course || "Full Stack MERN Web Development";

        // Calculate dynamic learning week based on start date
        const startDate = matched.start_date || matched.enrollment_date
          ? new Date(matched.start_date || matched.enrollment_date)
          : new Date();
        const diffTime = Math.max(0, new Date().getTime() - startDate.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
        const weekNum = Math.min(12, Math.max(1, Math.floor(diffDays / 7) + 1));

        // Dynamic Instructor Assignment
        let assignedInstructor = matched.instructor || "";
        if (!assignedInstructor) {
          if (courseTitle.includes("Python") || courseTitle.includes("AI")) {
            assignedInstructor = "Dr. Bilal Ahmed (AI Specialist)";
          } else if (courseTitle.includes("UI/UX") || courseTitle.includes("Design")) {
            assignedInstructor = "Ayesha Malik (Senior UI/UX Designer)";
          } else if (courseTitle.includes("Flutter") || courseTitle.includes("Mobile")) {
            assignedInstructor = "Usman Raza (Mobile Apps Lead)";
          } else if (courseTitle.includes("Cybersecurity") || courseTitle.includes("Security")) {
            assignedInstructor = "Zain Ali (Security Consultant)";
          } else {
            assignedInstructor = "Engr. Hamza (Lead Full-Stack)";
          }
        }

        // Dynamic Learning Week Topic Mapping
        const weekTopics = [
          "Orientation & Development Setup",
          "HTML5, CSS3 & Responsive Design",
          "JavaScript ES6+ & Async Operations",
          "React Components & State Architecture",
          "Next.js App Router & Tailwind CSS",
          "Node.js Express REST APIs & Backend Security",
          "Supabase Auth & Database Architecture",
          "State Management & Custom Hooks",
          "Full-Stack Integration & API Client",
          "Testing, Debugging & Code Reviews",
          "CI/CD Pipelines & Cloud Deployment",
          "Final Capstone Presentation & Graduation",
        ];
        const topic = weekTopics[weekNum - 1] || "Specialized Course Modules";
        const dynamicWeekString = `Week #${weekNum} of 12 (${topic})`;

        // Calculate student's actual attendance rate & set history
        const masterLogs = await dbFetch("attendance").catch(() => []);
        const studentLogs = (masterLogs || []).filter(
          (l) => (l.user_id || l.user_email || "").toLowerCase().trim() === savedEmail
        );
        setStudentAttendanceHistory(studentLogs);

        let studentAttendanceRate = matched.attendance !== undefined ? Number(matched.attendance) : 100;
        if (studentLogs.length > 0) {
          const presentCount = studentLogs.filter(
            (l) => (l.attendance_status || "").toLowerCase().includes("present") || (l.attendance_status || "").toLowerCase().includes("on time")
          ).length;
          studentAttendanceRate = Math.round((presentCount / studentLogs.length) * 100);
        }

        // Fetch My Leave Requests
        try {
          const allLeaves = await dbFetch("leaves").catch(() => []);
          const userLeaves = (allLeaves || []).filter(
            (l) => (l.applicant_email || l.email || "").toLowerCase().trim() === savedEmail
          );
          setMyStudentLeaves(userLeaves);
        } catch (e) {}

        // Fetch Database-Assigned MCQ Exams & Attempts
        try {
          const examsList = await getAssignedExamsForUser(savedEmail);
          const attemptsList = await getExamAttemptsForUser(savedEmail);
          setAssignedExams(examsList || []);
          setExamAttempts(attemptsList || []);
        } catch (e) {}

        // Check Today's Attendance
        const key = `today_attendance_${savedEmail}`;
        const savedToday = localStorage.getItem(key);
        if (savedToday) {
          try {
            const parsed = JSON.parse(savedToday);
            const match = parsed.find((r) => r.type === "check_in" || r.check_in_time);
            setTodayAttendance(match || null);
          } catch (e) {}
        } else if (studentLogs.length > 0) {
          const todayStr = new Date().toISOString().split("T")[0];
          const matchToday = studentLogs.find(
            (l) => l.attendance_date === todayStr || (l.timestamp && l.timestamp.startsWith(todayStr))
          );
          setTodayAttendance(matchToday || null);
        }

        setStudentInfo((prev) => ({
          ...prev,
          name: matched.full_name || matched.student_name || savedName || "Student",
          email: matched.email || savedEmail,
          course: courseTitle,
          batch: matched.batch || prev.batch,
          enrollmentNo: matched.id || matched.student_id || prev.enrollmentNo,
          progress: matched.progress !== undefined ? matched.progress : prev.progress,
          attendance: studentAttendanceRate,
          instructor: assignedInstructor,
          currentWeek: dynamicWeekString,
        }));

        const totalFee = Number(matched.course_fee || matched.total_fee || 25000);
        const paidFee = Number(matched.fee_paid || matched.submitted_fee || 25000);
        const remFee = Math.max(0, totalFee - paidFee);

        setFeeStatus({
          dueDate: matched.next_due_date || matched.end_date || "2026-08-08",
          totalFee: totalFee,
          paidAmount: paidFee,
          remainingBalance: remFee,
          status: matched.fee_status || (remFee === 0 ? "Paid" : "Pending Due"),
          receiptNo: `REC-${matched.id || "99812"}`,
        });

        // Load 30-day fee cycles for this student
        try {
          const storedCycles = JSON.parse(
            localStorage.getItem("persistent_student_fee_cycles") || "[]"
          );
          const studentCycles = storedCycles.filter(
            (c) => c.student_id === matched.id || c.student_id === matched.student_id
          );

          if (studentCycles && studentCycles.length > 0) {
            setFeeCyclesList(studentCycles);
          } else {
            const generated = calculate30DayFeeCycles({
              studentId: matched.id || matched.student_id,
              enrollmentDate: matched.start_date || matched.enrollment_date,
              totalFee: totalFee,
              submittedFee: paidFee,
              courseMonths: 3,
            });
            setFeeCyclesList(generated);
          }
        } catch (e) {}
      } else if (savedEmail) {
        setStudentInfo((prev) => ({
          ...prev,
          email: savedEmail,
          name: savedName || "Enrolled Student",
        }));
      }

      loadStudentTasks(savedEmail);
    }

    fetchStudentData();
  }, []);

  const loadStudentTasks = async (email) => {
    try {
      const tasks = await getDailyTasks(email);
      setAssignedTasks(tasks || []);
    } catch (e) {
      console.error("Error loading tasks:", e);
    }
  };

  // Live Task Duration Timer Effect
  useEffect(() => {
    let timer = null;
    if (activeTaskTimerId) {
      timer = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeTaskTimerId]);

  // Handle Start MCQ Exam
  const handleStartMcqExam = (exam) => {
    setActiveExam(exam);
    setUserAnswers({});
    setExamSubmittedScore(null);
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
      userEmail: studentInfo.email,
      userName: studentInfo.name,
      userRole: "student",
      userAnswers: userAnswers,
      timeTakenSeconds: timeTaken,
    });

    setLatestAttemptResult(attempt);
    setExamSubmittedScore(attempt.percentage);
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

  const handleStudentCheckIn = async () => {
    if (todayAttendance?.check_in_time) {
      showToast("Already Checked In ℹ️", `Checked in today at ${todayAttendance.check_in_time}.`, "info");
      return;
    }

    setMarkingAttendance(true);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const newRecord = {
      id: `att-${Date.now()}`,
      student_id: studentInfo.email,
      user_email: studentInfo.email,
      user_name: studentInfo.name,
      user_role: "student",
      type: "check_in",
      check_in_time: timeStr,
      check_out_time: null,
      attendance_status: "Present (On Time)",
      attendance_date: now.toISOString().split("T")[0],
      timestamp: now.toISOString(),
      public_ip: "127.0.0.1",
    };

    setTodayAttendance(newRecord);
    setStudentAttendanceHistory((prev) => [newRecord, ...prev.filter(r => r.id !== newRecord.id)]);

    try {
      const key = `today_attendance_${studentInfo.email}`;
      localStorage.setItem(key, JSON.stringify([newRecord]));
      await dbSaveRecord("attendance", newRecord).catch(() => {});
    } catch (e) {}

    setMarkingAttendance(false);
    showToast("Check-In Successful 🟢", `Checked in at ${timeStr}.`, "success");
  };

  const handleStudentCheckOut = async () => {
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
    setStudentAttendanceHistory((prev) =>
      prev.map((r) => (r.id === updatedRecord.id || r.attendance_date === updatedRecord.attendance_date ? updatedRecord : r))
    );

    try {
      const key = `today_attendance_${studentInfo.email}`;
      localStorage.setItem(key, JSON.stringify([updatedRecord]));
      await dbSaveRecord("attendance", updatedRecord).catch(() => {});
    } catch (e) {}

    setMarkingAttendance(false);
    showToast("Check-Out Successful 🔴", `Checked out at ${timeStr}. Daily log completed.`, "success");
  };

  const handleStudentLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!studentLeaveForm.reason.trim()) {
      showToast("Validation Error 🛑", "Please enter a reason for your leave request.", "error");
      return;
    }

    setSubmittingStudentLeave(true);

    const newLeave = {
      id: `leave-${Date.now()}`,
      applicant_name: studentInfo.name || "Student Applicant",
      employee_name: studentInfo.name || "Student Applicant",
      applicant_email: studentInfo.email,
      email: studentInfo.email,
      role: "student",
      leave_type: studentLeaveForm.leave_type,
      type: studentLeaveForm.leave_type,
      start_date: studentLeaveForm.start_date,
      end_date: studentLeaveForm.end_date,
      reason: studentLeaveForm.reason.trim(),
      status: "pending",
      salary_cut: false,
      applied_at: new Date().toISOString().split("T")[0],
    };

    setMyStudentLeaves((prev) => [newLeave, ...prev]);

    try {
      const savedLeaves = JSON.parse(localStorage.getItem("software_house_leaves") || "[]");
      localStorage.setItem("software_house_leaves", JSON.stringify([newLeave, ...savedLeaves.filter(l => l.id !== newLeave.id)]));
      window.dispatchEvent(new Event("storage"));
    } catch (err) {}

    await dbSaveRecord("leaves", newLeave).catch(() => {});

    setSubmittingStudentLeave(false);
    setStudentLeaveForm({
      leave_type: "Casual Leave",
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date().toISOString().split("T")[0],
      reason: "",
    });

    showToast("Leave Application Submitted 📝", "Submitted for Admin/HR review.", "success");
  };

  // Task Control Handlers
  const handleStartTask = async (task) => {
    const updatedTask = {
      ...task,
      status: "In Progress",
      start_time: task.start_time || new Date().toISOString(),
    };
    setActiveTaskTimerId(task.id);
    setTimerSeconds(task.total_working_seconds || 0);

    const updatedList = await saveTaskRecord(updatedTask);
    setAssignedTasks(updatedList);
    showToast("Task Started ⏱️", `Timer running for "${task.task_title}"`, "info");
  };

  const handlePauseTask = async (task) => {
    setActiveTaskTimerId(null);
    const updatedTask = {
      ...task,
      status: "Paused",
      total_working_seconds: (task.total_working_seconds || 0) + timerSeconds,
      pause_time: new Date().toISOString(),
    };

    const updatedList = await saveTaskRecord(updatedTask);
    setAssignedTasks(updatedList);
    showToast("Task Paused ⏸️", `Duration logged: ${Math.floor(timerSeconds / 60)} mins`, "warning");
  };

  const handleCompleteTask = async (task) => {
    setActiveTaskTimerId(null);
    const updatedTask = {
      ...task,
      status: "Completed",
      total_working_seconds: (task.total_working_seconds || 0) + timerSeconds,
      completion_time: new Date().toISOString(),
    };

    const updatedList = await saveTaskRecord(updatedTask);
    setAssignedTasks(updatedList);
    showToast("Task Completed 🎉", `Task "${task.task_title}" marked as complete!`, "success");
  };



  // Print Fee Receipt PDF
  const handlePrintReceipt = () => {
    try {
      generatePrintableStudentFeeReceiptPdf({
        student_name: studentInfo.name,
        student_email: studentInfo.email,
        course_name: studentInfo.course,
        batch: studentInfo.batch,
        receipt_no: feeStatus.receiptNo || "REC-2026-9018",
        amount_paid: feeStatus.paidAmount || 25000,
        remaining_balance: feeStatus.remainingBalance || 0,
        payment_date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        payment_method: "Bank Transfer / Online Slip",
      });
    } catch (e) {
      showToast("PDF Error", "Unable to generate receipt PDF.", "error");
    }
  };

  // Print Certificate PDF
  const handlePrintCertificate = () => {
    try {
      generatePrintable3MonthStudentCertificatePdf({
        full_name: studentInfo.name,
        course_name: studentInfo.course,
        completion_date: "2026-08-01",
        certificate_no: "CERT-NEXA-2026-9901",
        grade: "A+ (98%)",
        instructor: studentInfo.instructor,
      });
    } catch (e) {
      showToast("PDF Error", "Unable to generate certificate PDF.", "error");
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans bg-[#F8FAFC]">
      {/* === STUDENT PROFILE HEADER BANNER === */}
      <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB] text-2xl font-black shadow-xs">
              {studentInfo.name.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">{studentInfo.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                  Enrolled & Active
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">{studentInfo.course} • {studentInfo.batch}</p>
              <p className="text-[11px] text-slate-400">Enrollment No: <span className="font-mono text-slate-800 font-semibold">{studentInfo.enrollmentNo}</span> | Email: {studentInfo.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCertificateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <FaAward className="h-4 w-4" /> View Certificate & QR
            </button>
            <button
              onClick={handlePrintReceipt}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
            >
              <FaPrint className="h-4 w-4" /> Fee Receipt PDF
            </button>
          </div>
        </div>

        {/* Course Overall Progress Bar */}
        <div className="mt-6 border-t border-slate-100 pt-5 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-700 font-bold flex items-center gap-2">
              <FaBookReader className="text-[#2563EB]" /> Overall Course Completion Progress
            </span>
            <span className="font-mono font-black text-[#2563EB] text-sm">{studentInfo.progress}% Completed</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
            <div
              className="bg-[#2563EB] h-full rounded-full transition-all duration-700 shadow-xs"
              style={{ width: `${studentInfo.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* === TODAY'S ATTENDANCE CONTROL BANNER CARD === */}
      <div className="p-6 rounded-2xl border border-blue-200 bg-white shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-blue-200">
              Student Attendance Control
            </span>
            <h2 className="text-base font-bold text-[#0F172A] mt-1 flex items-center gap-2">
              <FaUserCheck className="text-[#2563EB]" /> My Attendance Session
            </h2>
          </div>

          <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full border ${
            todayAttendance?.check_out_time
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : todayAttendance?.check_in_time
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}>
            {todayAttendance?.check_out_time
              ? "Session Completed 🟢"
              : todayAttendance?.check_in_time
              ? "Checked In 🔵"
              : "Not Checked In 🟠"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">Check-In Time</span>
            <p className="text-base font-mono font-bold text-slate-900">
              {todayAttendance?.check_in_time || "--:--"}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">Check-Out Time</span>
            <p className="text-base font-mono font-bold text-slate-900">
              {todayAttendance?.check_out_time || "--:--"}
            </p>
          </div>
        </div>

        {/* Check-In / Check-Out Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={handleStudentCheckIn}
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
            onClick={handleStudentCheckOut}
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

      {/* === MY ATTENDANCE HISTORY TABLE === */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FaCalendarAlt className="text-[#2563EB]" /> My Attendance History
          </h2>
          <span className="text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full border border-blue-200">
            {studentAttendanceHistory.length} Total Logs
          </span>
        </div>

        {studentAttendanceHistory.length === 0 ? (
          <p className="text-xs text-slate-500 italic text-center py-4">No attendance records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Check-In</th>
                  <th className="py-2.5 px-3">Check-Out</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentAttendanceHistory.map((rec) => (
                  <tr key={rec.id || rec.timestamp} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
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
      </div>

      {/* === STUDENT LEAVE APPLICATION SECTION === */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* APPLY FOR LEAVE FORM */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FaPaperPlane className="text-[#2563EB]" /> Apply for Leave
            </h2>
          </div>

          <form onSubmit={handleStudentLeaveSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-800 uppercase mb-1">Leave Type *</label>
              <select
                value={studentLeaveForm.leave_type}
                onChange={(e) => setStudentLeaveForm({ ...studentLeaveForm, leave_type: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 bg-white outline-none focus:border-[#2563EB]"
              >
                <option value="Casual Leave">Casual Leave</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Emergency Leave">Emergency Leave</option>
                <option value="Exam / University Leave">Exam / University Leave</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-800 uppercase mb-1">Start Date</label>
                <input
                  type="date"
                  value={studentLeaveForm.start_date}
                  onChange={(e) => setStudentLeaveForm({ ...studentLeaveForm, start_date: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 uppercase mb-1">End Date</label>
                <input
                  type="date"
                  value={studentLeaveForm.end_date}
                  onChange={(e) => setStudentLeaveForm({ ...studentLeaveForm, end_date: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 uppercase mb-1">Reason *</label>
              <textarea
                rows={2}
                value={studentLeaveForm.reason}
                onChange={(e) => setStudentLeaveForm({ ...studentLeaveForm, reason: e.target.value })}
                placeholder="State reason for your leave application..."
                required
                className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 outline-none focus:border-[#2563EB]"
              />
            </div>

            <button
              type="submit"
              disabled={submittingStudentLeave}
              className="w-full py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
            >
              {submittingStudentLeave ? "Submitting..." : "Submit Leave Application"}
            </button>
          </form>
        </div>

        {/* MY LEAVE APPLICATIONS HISTORY */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FaClock className="text-[#2563EB]" /> My Leave Applications
            </h2>
            <span className="text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-blue-200">
              {myStudentLeaves.length} Submitted
            </span>
          </div>

          {myStudentLeaves.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-4">No leave applications submitted yet.</p>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {myStudentLeaves.map((l) => (
                <div key={l.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{l.leave_type}</p>
                    <p className="text-[10px] text-slate-500">{l.start_date} to {l.end_date}</p>
                    <p className="text-[11px] text-slate-600 mt-1">{l.reason}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase shrink-0 ${
                    (l.status || "").toLowerCase() === "approved"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : (l.status || "").toLowerCase() === "rejected"
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

      {/* === DASHBOARD STATS GRID === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Current Learning Week</span>
            <FaCalendarAlt className="text-blue-500" />
          </div>
          <p className="text-sm font-bold text-slate-900">{studentInfo.currentWeek}</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Attendance Rate</span>
            <FaUserCheck className="text-emerald-500" />
          </div>
          <p className="text-xl font-black text-slate-900">
            {studentInfo.attendance}%{" "}
            <span className={`text-xs font-semibold ${studentInfo.attendance >= 90 ? "text-emerald-600" : studentInfo.attendance >= 75 ? "text-blue-600" : studentInfo.attendance >= 60 ? "text-amber-600" : "text-rose-600"}`}>
              {studentInfo.attendance >= 90 ? "(Excellent)" : studentInfo.attendance >= 75 ? "(Good)" : studentInfo.attendance >= 60 ? "(Satisfactory)" : "(Needs Improvement)"}
            </span>
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Fee Status</span>
            <FaMoneyBillWave className="text-emerald-500" />
          </div>
          <p className="text-sm font-bold text-emerald-600 flex items-center gap-1">
            <FaCheckCircle /> {feeStatus.status}
          </p>
        </div>
      </div>

      {/* === SECTION: 30-DAY RECURRING FEE CYCLES TRACKING === */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FaMoneyBillWave className="text-emerald-600" /> My 30-Day Recurring Fee Cycles (3 Months Course)
            </h2>
            <p className="text-xs text-slate-500">Automated 30-day recurring fee cycle schedule & installment breakdown.</p>
          </div>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            Total Course Fee: PKR {feeStatus.totalFee.toLocaleString()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {feeCyclesList.map((c) => (
            <div
              key={c.id || c.cycle_number}
              className={`p-4 rounded-2xl border ${
                c.status === "Paid"
                  ? "border-emerald-200 bg-emerald-50/40"
                  : c.status === "Overdue"
                  ? "border-rose-200 bg-rose-50/40"
                  : "border-amber-200 bg-amber-50/40"
              } space-y-2.5 relative`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-800 tracking-wider">
                  Cycle #{c.cycle_number} (30 Days)
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    c.status === "Paid"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : c.status === "Overdue"
                      ? "bg-rose-100 text-rose-800 border border-rose-200"
                      : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}
                >
                  {c.status}
                </span>
              </div>

              <div className="text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Cycle Period:</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {c.cycle_start_date} → {c.cycle_end_date}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Due Date:</span>
                  <span className="font-mono font-bold text-slate-900">{c.due_date}</span>
                </div>
                <div className="flex justify-between text-slate-600 border-t border-slate-200/60 pt-1.5 mt-1.5">
                  <span>Cycle Installment:</span>
                  <span className="font-bold text-slate-900">PKR {Number(c.amount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Submitted Amount:</span>
                  <span className="font-bold text-emerald-700">PKR {Number(c.paid_amount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-700 font-bold border-t border-slate-200/60 pt-1">
                  <span>Remaining Due:</span>
                  <span className={c.remaining_amount > 0 ? "text-rose-600" : "text-emerald-700"}>
                    PKR {Number(c.remaining_amount || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* === SECTION: DAILY TASK MANAGER WITH LIVE TIMER === */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FaTasks className="text-blue-600" /> My Daily Work & Assignment Tasks
            </h2>
            <p className="text-xs text-slate-500">Start task timers to record working duration and submit daily progress updates.</p>
          </div>

          <button
            onClick={() => loadStudentTasks(studentInfo.email)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
          >
            Refresh Tasks
          </button>
        </div>

        {/* Task Cards List */}
        <div className="space-y-4">
          {assignedTasks.map((t) => (
            <div
              key={t.id}
              className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1 ${
                    t.priority === "Urgent" || t.priority === "High"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {t.priority} Priority
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{t.task_title}</h3>
                  <p className="text-xs text-slate-500">{t.description}</p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {t.status === "Pending" && (
                    <button
                      onClick={() => handleStartTask(t)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-colors shadow-xs"
                    >
                      <FaPlay className="h-3 w-3" /> Start Task
                    </button>
                  )}

                  {t.status === "In Progress" && (
                    <>
                      <button
                        onClick={() => handlePauseTask(t)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-white font-semibold text-xs hover:bg-amber-600 transition-colors"
                      >
                        <FaPause className="h-3 w-3" /> Pause
                      </button>
                      <button
                        onClick={() => handleCompleteTask(t)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors shadow-xs"
                      >
                        <FaCheckCircle className="h-3 w-3" /> Complete
                      </button>
                    </>
                  )}

                  {t.status === "Completed" && (
                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold">
                      <FaCheckDouble /> Completed
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-200/60 pt-3">
                <span>Due Date: <strong>{formatSafeDueDate(t.due_date)}</strong></span>
                <span>Assigned by: <strong>{t.assigned_by_name}</strong></span>
                <span className="font-mono text-slate-700">Logged Time: {Math.floor((t.total_working_seconds || 0) / 60)} mins</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* === SECTION: ONLINE EXAMINATIONS & MCQ QUIZ ENGINE === */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FaLaptopCode className="text-blue-600" /> Examinations & Testing Suite
            </h2>
            <p className="text-xs text-slate-500">Attempt online MCQ tests, live coding evaluations, and submit practical assignments.</p>
          </div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            {assignedExams.length} Exams Assigned
          </span>
        </div>

        {assignedExams.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <FaLaptopCode className="mx-auto h-8 w-8 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-800">Online MCQ Exam</h3>
            <p className="text-xs text-slate-500 italic">No exam has been assigned to you yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {assignedExams.map((exam) => {
              const attempt = examAttempts.find((a) => a.exam_id === exam.id);

              return (
                <div key={exam.id} className="p-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50/50 via-white to-slate-50 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">
                      {exam.course || "Online MCQ Exam"}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                      attempt
                        ? attempt.result === "PASSED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}>
                      {attempt ? `Status: Completed (${attempt.result})` : "Status: Assigned"}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm">{exam.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2">{exam.description || "Official evaluation test."}</p>

                  <div className="text-[11px] text-slate-500 space-y-1 bg-white/80 p-2.5 rounded-xl border border-slate-200/60">
                    <div className="flex justify-between">
                      <span>Questions: <strong>{exam.questions?.length || 0} Questions</strong></span>
                      <span>Time Limit: <strong>{exam.time_limit || 10} Mins</strong></span>
                    </div>
                    <div className="flex justify-between">
                      <span>Passing Score: <strong>{exam.passing_score || 50}%</strong></span>
                      <span>Due: <strong>{exam.due_date || "Open"}</strong></span>
                    </div>
                  </div>

                  {attempt ? (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-100 font-semibold text-slate-800">
                        <span>Score: {attempt.score} ({attempt.percentage}%)</span>
                        <span className={attempt.result === "PASSED" ? "text-emerald-700" : "text-rose-700"}>{attempt.result}</span>
                      </div>
                      <button
                        onClick={() => {
                          setActiveExam(exam);
                          setLatestAttemptResult(attempt);
                          setExamSubmittedScore(attempt.percentage);
                          setMcqModalOpen(true);
                        }}
                        className="w-full py-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors"
                      >
                        View Result
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartMcqExam(exam)}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
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

      {/* === MCQ EXAM RUNNER MODAL === */}
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
                    onClick={() => setMcqModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
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
                  <p className="text-xs text-slate-500">Your score has been saved to your academic record.</p>
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

      {/* === CERTIFICATE PREVIEW & QR MODAL === */}
      {certificateModalOpen && (
        <Modal
          isOpen={certificateModalOpen}
          onClose={() => setCertificateModalOpen(false)}
          title="Official Course Certificate & Verification QR"
        >
          <div className="space-y-5 text-xs text-slate-700">
            <div className="p-6 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50/60 via-white to-slate-50 text-center space-y-3">
              <FaAward className="mx-auto h-12 w-12 text-blue-600" />
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                Certificate of Academic Excellence
              </h3>
              <p className="text-xs text-slate-600">This certifies that <strong>{studentInfo.name}</strong> has successfully completed all requirements for <strong>{studentInfo.course}</strong>.</p>
              
              <div className="pt-2 flex justify-center">
                <div className="p-3 bg-white border border-slate-200 rounded-xl inline-block shadow-xs">
                  <FaQrcode className="h-16 w-16 text-slate-900 mx-auto" />
                  <p className="text-[9px] font-mono text-slate-500 mt-1">Scan or Visit to Verify</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <Link
                href="/verify-certificate?id=CERT-NEXA-2026-9901"
                target="_blank"
                className="flex items-center gap-1.5 text-blue-600 font-semibold hover:underline"
              >
                <FaQrcode /> Open Public Verification Link
              </Link>

              <button
                onClick={handlePrintCertificate}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-xs"
              >
                <FaPrint /> Download Certificate PDF
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
