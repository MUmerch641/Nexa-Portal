"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Modal from "@/components/Modal";
import { showToast } from "@/components/Toast";
import { generatePrintableStudentFeeReceiptPdf } from "@/lib/generateStudentReceiptPdf";
import { generatePrintable3MonthStudentCertificatePdf } from "@/lib/generate3MonthStudentCertificatePdf";
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
  FaRegLightbulb
} from "react-icons/fa";

import {
  getDailyTasks,
  saveTaskRecord,
  getCertificates,
  saveCertificate,
  SAMPLE_MCQ_EXAM
} from "@/lib/studentTaskUtils";

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
    name: "Ali Hassan",
    email: "student@gmail.com",
    enrollmentNo: "ENR-2026-901",
    course: "Full Stack MERN Web Development",
    batch: "Batch #14 (Morning Tech)",
    instructor: "Engr. Hamza (Lead Full-Stack)",
    currentWeek: "Week #6 of 12 (Node.js Express REST APIs & Supabase Auth)",
    progress: 78,
    attendance: 94,
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

  // Exams State
  const [mcqModalOpen, setMcqModalOpen] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [examSubmittedScore, setExamSubmittedScore] = useState(null);

  // Certificate Modal & QR State
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);
  const [feeReceiptModalOpen, setFeeReceiptModalOpen] = useState(false);

  useEffect(() => {
    const savedRole = localStorage.getItem("user_role") || "student";
    const savedEmail = localStorage.getItem("current_user_email") || "student@gmail.com";
    const savedName = localStorage.getItem("current_user_name") || "Ali Hassan";

    setRole(savedRole);
    setStudentInfo((prev) => ({ ...prev, email: savedEmail, name: savedName }));

    loadStudentTasks(savedEmail);
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

  // MCQ Exam Submission Handler
  const handleSubmitMcqExam = () => {
    let score = 0;
    SAMPLE_MCQ_EXAM.questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctIndex) {
        score += 25;
      }
    });

    setExamSubmittedScore(score);
    showToast("Exam Submitted 📝", `You scored ${score}/100 in ${SAMPLE_MCQ_EXAM.title}`, score >= 70 ? "success" : "warning");
  };

  // Print Fee Receipt PDF
  const handlePrintReceipt = () => {
    try {
      generatePrintableStudentFeeReceiptPdf({
        student_name: studentInfo.name,
        course_name: studentInfo.course,
        batch: studentInfo.batch,
        receipt_no: feeStatus.receiptNo,
        amount_paid: feeStatus.paidAmount,
        remaining_balance: feeStatus.remainingBalance,
        payment_date: new Date().toLocaleDateString(),
        payment_method: "Bank Transfer / Online",
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

      {/* === DASHBOARD STATS GRID === */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <p className="text-xl font-black text-slate-900">{studentInfo.attendance}% <span className="text-xs font-normal text-emerald-600">(Excellent)</span></p>
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

        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Active Instructor</span>
            <FaChalkboardTeacher className="text-indigo-500" />
          </div>
          <p className="text-xs font-bold text-slate-900">{studentInfo.instructor}</p>
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* MCQ Test Card */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50/50 to-white space-y-3">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">
              Online MCQ Exam
            </span>
            <h3 className="font-bold text-slate-900 text-sm">{SAMPLE_MCQ_EXAM.title}</h3>
            <p className="text-xs text-slate-600">4 Multiple choice questions with timer & auto-grading.</p>

            <button
              onClick={() => setMcqModalOpen(true)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              Start MCQ Exam Now
            </button>
          </div>

          {/* Practical Assignment Card */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50/50 to-white space-y-3">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 uppercase">
              Practical Coding Project
            </span>
            <h3 className="font-bold text-slate-900 text-sm">Full-Stack MERN E-Commerce App</h3>
            <p className="text-xs text-slate-600">Submit GitHub Repo link or PDF documentation for teacher review.</p>

            <button
              onClick={() => showToast("Submission Modal", "Upload your PDF or GitHub URL.", "info")}
              className="w-full py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs transition-colors"
            >
              Submit Project Solution
            </button>
          </div>
        </div>
      </div>

      {/* === MCQ EXAM RUNNER MODAL === */}
      {mcqModalOpen && (
        <Modal
          isOpen={mcqModalOpen}
          onClose={() => setMcqModalOpen(false)}
          title={SAMPLE_MCQ_EXAM.title}
        >
          <div className="space-y-6 text-xs text-slate-700">
            {examSubmittedScore === null ? (
              <div className="space-y-5">
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-900 flex justify-between items-center">
                  <span>Pass Percentage: <strong>{SAMPLE_MCQ_EXAM.pass_percentage}%</strong></span>
                  <span>Duration: <strong>{SAMPLE_MCQ_EXAM.duration_minutes} Mins</strong></span>
                </div>

                {SAMPLE_MCQ_EXAM.questions.map((q, qIdx) => (
                  <div key={q.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <p className="font-bold text-slate-900 text-xs">
                      Q{qIdx + 1}. {q.question}
                    </p>
                    <div className="space-y-1.5 pt-1">
                      {q.options.map((opt, optIdx) => (
                        <label
                          key={optIdx}
                          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                            userAnswers[q.id] === optIdx
                              ? "bg-blue-100 border-blue-400 text-blue-900 font-semibold"
                              : "bg-white border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            checked={userAnswers[q.id] === optIdx}
                            onChange={() => setUserAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                            className="text-blue-600"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    onClick={() => setMcqModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitMcqExam}
                    className="px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-xs"
                  >
                    Submit Exam Answers
                  </button>
                </div>
              </div>
            ) : (
              /* Score Display */
              <div className="text-center py-6 space-y-4">
                <div className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center text-white text-2xl font-bold ${
                  examSubmittedScore >= 70 ? "bg-emerald-500" : "bg-amber-500"
                }`}>
                  {examSubmittedScore}%
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">
                    {examSubmittedScore >= 70 ? "Congratulations! Exam Passed 🎉" : "Exam Attempt Completed"}
                  </h3>
                  <p className="text-xs text-slate-500">Your score has been logged to your academic record.</p>
                </div>

                <button
                  onClick={() => setMcqModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs"
                >
                  Close Exam
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
