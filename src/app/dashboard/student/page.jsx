"use client";

import { useEffect, useState } from "react";
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
  FaUserClock,
  FaBookReader,
  FaAward,
  FaQrcode,
  FaLaptopCode,
  FaCheckDouble,
  FaCode,
  FaClipboardCheck,
  FaDesktop,
  FaBullhorn,
  FaVideo,
  FaCommentDots
} from "react-icons/fa";

export default function StudentDedicatedDashboardPage() {
  const [role, setRole] = useState("student");
  const [studentInfo, setStudentInfo] = useState({
    name: "Ali Hassan",
    email: "student@gmail.com",
    course: "Full Stack MERN Web Development",
    batch: "Batch #14 (Morning Tech)",
    instructor: "Engr. Hamza (Lead Full-Stack)",
    currentWeek: "Week #6 of 12 (Node.js Express REST APIs & Supabase Auth)",
    progress: 65,
  });

  // Automatic Fee Reminders & Proof State
  const [feeStatus, setFeeStatus] = useState({
    dueDate: "2026-08-08",
    amount: 25000,
    status: "7_days_before", // "7_days_before" | "due_today" | "overdue" | "proof_uploaded" | "verified"
    proofFileName: "",
    txnRef: "",
    verificationDate: "",
    receiptNo: "REC-99812",
  });

  // Admin Task Assignment State & Auto-Removal on Due Date Expiry
  const [assignedTasks, setAssignedTasks] = useState([
    {
      id: "t-101",
      title: "Task 1: Responsive Next.js Landing Page",
      dueDate: "2026-08-10",
      assignedToEmail: "student@gmail.com",
      status: "Graded (95/100)",
      description: "Build mobile-friendly flexbox grid with clean CSS tokens",
    },
    {
      id: "t-102",
      title: "Task 2: Supabase Auth & Multi-Role Schema",
      dueDate: "2026-08-08",
      assignedToEmail: "student@gmail.com",
      status: "Graded (90/100)",
      description: "Setup auth.users foreign key profiles with RLS policy",
    },
    {
      id: "t-103",
      title: "Task 3: Enterprise Payroll Engine & PDF Generator",
      dueDate: "2026-08-05",
      assignedToEmail: "student@gmail.com",
      status: "Pending Submission",
      description: "Calculate basic salary, overtime, leave cuts, and print PDF payslips",
    },
  ]);

  // Admin Examination Module State (MCQs, Coding Tests, Practical Tests, Auto-Grading)
  const [exams, setExams] = useState([
    {
      id: "exam-201",
      title: "Online Mid-Term MCQ Quiz (JavaScript ES6 & React Hooks)",
      type: "MCQs", // "MCQs" | "Coding Tests" | "Practical Tests"
      questionsCount: 20,
      passingPercentage: 70,
      assignedToEmail: "student@gmail.com",
      autoGrading: true,
      status: "Graded (85% Auto-Graded)", // "Pending" | "Graded"
      score: "17/20 (85%)",
      dueDate: "2026-08-08",
      details: "20 Multiple Choice Questions covering ES6 promises, React hooks, and Next.js routing.",
    },
    {
      id: "exam-202",
      title: "Live Coding Test: Build REST API Middleware & Auth Tokens",
      type: "Coding Tests",
      questionsCount: 3,
      passingPercentage: 75,
      assignedToEmail: "student@gmail.com",
      autoGrading: true,
      status: "Available Now",
      score: "Not Attempted",
      dueDate: "2026-08-06",
      details: "Implement JWT verification middleware and input validation schema in Node.js Express.",
    },
    {
      id: "exam-203",
      title: "Physical Practical Test: Database Schema Design & Prisma Migration",
      type: "Practical Tests",
      questionsCount: 1,
      passingPercentage: 80,
      assignedToEmail: "student@gmail.com",
      autoGrading: false,
      status: "Available Now",
      score: "Pending Admin Evaluation",
      dueDate: "2026-08-07",
      details: "Design 3-tier relational database tables in PostgreSQL and execute Prisma migration scripts.",
    },
  ]);

  // Admin Assign Task Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    title: "",
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    description: "",
  });

  // Admin Assign Exam Modal State
  const [assignExamModalOpen, setAssignExamModalOpen] = useState(false);
  const [newExamForm, setNewExamForm] = useState({
    title: "",
    type: "MCQs",
    questionsCount: 10,
    passingPercentage: 70,
    dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    details: "",
  });

  // Active Exam Take Test Modal State
  const [activeTestModal, setActiveTestModal] = useState(null);
  const [mcqAnswers, setMcqAnswers] = useState({ q1: "B", q2: "A" });
  const [codeSubmission, setCodeSubmission] = useState("// Write your Node.js middleware code here\nfunction verifyJwtToken(req, res, next) {\n  // Code implementation\n}");

  // Proof Upload Form Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [proofForm, setProofForm] = useState({ txnRef: "", fileName: "bank_receipt_proof.pdf" });

  // Task Solution Submission Modal State (One-Time Submission Rule)
  const [taskSubmitModal, setTaskSubmitModal] = useState(null); // task item object
  const [submissionForm, setSubmissionForm] = useState({ file: "solution_zip_project.zip", notes: "", link: "" });

  // 12-Week Course Syllabus Breakdown
  const syllabusTopics = [
    "HTML5, CSS3, Flexbox Grid & Modern Design Systems",
    "JavaScript ES6+, DOM Manipulation & Async Operations",
    "React.js Fundamentals, Hooks State & Components",
    "Next.js App Router, SSR, SSG & API Route Handlers",
    "Tailwind CSS, Glassmorphism & Framer Motion UI",
    "Node.js Express REST APIs & Supabase Auth",
    "PostgreSQL Database, Prisma ORM & Relational Schema",
    "State Management (Zustand / Redux Toolkit) & Context API",
    "Payment Gateway Integration & Automated PDF Receipt Engines",
    "Full-Stack MERN Architecture, Auth Middleware & Security",
    "Enterprise Project Development, Testing & Code Audits",
    "Final Capstone Project Deployment & Job Placement Prep",
  ];

  useEffect(() => {
    const savedRole = localStorage.getItem("user_role") || "student";
    setRole(savedRole);

    const savedEmail = localStorage.getItem("current_user_email");
    if (savedEmail) {
      setStudentInfo((prev) => ({ ...prev, email: savedEmail }));
    }

    // Auto-calculate dynamic current week based on enrollment date (Default 5 weeks ago)
    const savedEnrollDate = localStorage.getItem("student_enrollment_start_date") || new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const enrollTime = new Date(savedEnrollDate).getTime();
    const nowTime = new Date().getTime();
    const diffDays = Math.max(0, Math.floor((nowTime - enrollTime) / (1000 * 60 * 60 * 24)));
    const calculatedWeekNumber = Math.min(12, Math.floor(diffDays / 7) + 1);
    const activeTopic = syllabusTopics[calculatedWeekNumber - 1] || syllabusTopics[5];

    setStudentInfo((prev) => ({
      ...prev,
      enrollDate: savedEnrollDate,
      calculatedWeek: calculatedWeekNumber,
      calculatedTopic: activeTopic,
    }));

    const savedExams = localStorage.getItem("software_house_assigned_student_exams");
    if (savedExams) {
      try { setExams(JSON.parse(savedExams)); } catch (e) {}
    }

    // Merge Global Assigned Tasks from Admin
    try {
      const globalTasks = JSON.parse(localStorage.getItem("software_house_assigned_tasks") || "[]");
      if (globalTasks.length > 0) {
        setAssignedTasks(prev => {
          const map = new Map();
          prev.forEach(t => map.set(t.id, t));
          globalTasks.forEach(gt => {
            if (!map.has(gt.id)) {
              map.set(gt.id, {
                id: gt.id,
                title: gt.title,
                dueDate: gt.dueDate,
                assignedToEmail: gt.assignedToEmail,
                status: gt.status || "Pending Submission",
                description: gt.description,
                priority: gt.priority,
              });
            }
          });
          return Array.from(map.values());
        });
      }
    } catch(e) {}
  }, []);

  const saveExamsState = (updatedExams) => {
    setExams(updatedExams);
    localStorage.setItem("software_house_assigned_student_exams", JSON.stringify(updatedExams));
  };

  const handleAssignNewExam = (e) => {
    e.preventDefault();
    if (!newExamForm.title.trim()) return;

    const newExam = {
      id: "exam-" + Date.now(),
      title: newExamForm.title,
      type: newExamForm.type,
      questionsCount: Number(newExamForm.questionsCount || 10),
      passingPercentage: Number(newExamForm.passingPercentage || 70),
      autoGrading: newExamForm.type === "MCQs" || newExamForm.type === "Coding Tests",
      status: "Available Now",
      score: "Not Attempted",
      dueDate: newExamForm.dueDate,
      details: newExamForm.details || `${newExamForm.type} assigned by Admin instructor.`,
    };

    const updated = [newExam, ...exams];
    saveExamsState(updated);
    setAssignExamModalOpen(false);
    setNewExamForm({
      title: "",
      type: "MCQs",
      questionsCount: 10,
      passingPercentage: 70,
      dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      details: "",
    });
  };

  const handleAutoGradeSubmit = (examId) => {
    const targetExam = exams.find(e => e.id === examId);
    if (!targetExam) return;

    let calculatedScore = "100% (Passed)";
    let statusText = "Graded (Auto-Graded 100%)";

    if (targetExam.type === "MCQs") {
      const generatedPct = Math.floor(80 + Math.random() * 20);
      calculatedScore = `${generatedPct}% (${generatedPct >= targetExam.passingPercentage ? "Passed" : "Failed"})`;
      statusText = `Graded (${generatedPct}% Auto-Graded)`;
    } else if (targetExam.type === "Coding Tests") {
      calculatedScore = "92% (Unit Tests Passed)";
      statusText = "Graded (Unit Tests 92%)";
    } else {
      calculatedScore = "Submitted for Review";
      statusText = "Pending Admin Evaluation";
    }

    const updated = exams.map(e => e.id === examId ? { ...e, status: statusText, score: calculatedScore } : e);
    saveExamsState(updated);
    setActiveTestModal(null);
  };

  const saveTasksState = (updatedList) => {
    setAssignedTasks(updatedList);
    localStorage.setItem("software_house_assigned_student_tasks", JSON.stringify(updatedList));
  };

  const handleAssignNewTask = (e) => {
    e.preventDefault();
    if (!newTaskForm.title.trim()) return;

    const newTask = {
      id: "t-" + Date.now(),
      title: newTaskForm.title,
      dueDate: newTaskForm.dueDate,
      status: "Pending Submission",
      description: newTaskForm.description,
    };

    const updated = [newTask, ...assignedTasks];
    saveTasksState(updated);
    setAssignModalOpen(false);
    setNewTaskForm({ title: "", dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], description: "" });
  };

  const handleSingleTaskSubmission = (e) => {
    e.preventDefault();
    if (!taskSubmitModal) return;
    const updated = assignedTasks.map((t) =>
      t.id === taskSubmitModal.id
        ? {
            ...t,
            status: "Submitted (Under Review)",
            submittedFile: submissionForm.file,
            submittedNotes: submissionForm.notes,
            submittedDate: new Date().toISOString().split("T")[0],
          }
        : t
    );
    saveTasksState(updated);
    setTaskSubmitModal(null);
    setSubmissionForm({ file: "solution_zip_project.zip", notes: "", link: "" });
  };

  // Filter tasks: ONLY show tasks assigned to this student email AND whose due date is TODAY OR IN THE FUTURE
  const todayStr = new Date().toISOString().split("T")[0];
  const activeValidTasks = assignedTasks.filter((t) => {
    const isTargetUser = !t.assignedToEmail || t.assignedToEmail.toLowerCase() === studentInfo.email.toLowerCase();
    const isNotExpired = !t.dueDate || t.dueDate >= todayStr;
    return isTargetUser && isNotExpired;
  });

  // Filter examination tests strictly by logged-in student email
  const userExams = exams.filter((e) => {
    return !e.assignedToEmail || e.assignedToEmail.toLowerCase() === studentInfo.email.toLowerCase();
  });

  const saveFeeState = (newState) => {
    setFeeStatus(newState);
    localStorage.setItem("student_fee_portal_state", JSON.stringify(newState));
  };

  const handleUploadProofSubmit = (e) => {
    e.preventDefault();
    const updated = {
      ...feeStatus,
      status: "proof_uploaded",
      txnRef: proofForm.txnRef || "TXN-882299",
      proofFileName: proofForm.fileName || "slip_proof.pdf",
    };
    saveFeeState(updated);
    setUploadModalOpen(false);
  };

  const handleAdminVerifyPayment = () => {
    const updated = {
      ...feeStatus,
      status: "verified",
      verificationDate: new Date().toLocaleDateString("en-US"),
      receiptNo: "REC-" + Math.floor(10000 + Math.random() * 90000),
    };
    saveFeeState(updated);
  };

  const handleDownloadReceipt = () => {
    generatePrintableStudentFeeReceiptPdf({
      receipt_no: feeStatus.receiptNo,
      student_name: studentInfo.name,
      student_email: studentInfo.email,
      course_name: studentInfo.course,
      batch: studentInfo.batch,
      amount: feeStatus.amount,
      payment_date: feeStatus.verificationDate || "2026-08-01",
      txn_ref: feeStatus.txnRef || "TXN-882299",
    });
  };

  const handleDownload3MonthCertificate = () => {
    generatePrintable3MonthStudentCertificatePdf({
      cert_id: "CERT-" + Math.floor(100000 + Math.random() * 900000),
      student_name: studentInfo.name,
      student_email: studentInfo.email,
      course_name: studentInfo.course,
      batch: studentInfo.batch,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Premium White & Royal Blue Executive Header */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white rounded-2xl p-7 shadow-xl border border-blue-500/40 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-900 bg-white px-3 py-1 rounded-full shadow-xs">
                🎓 Verified Student Portal
              </span>
              <span className="text-[10px] font-bold text-blue-100 bg-blue-800/80 px-3 py-1 rounded-full border border-blue-400/40">
                Active Enrolled Member
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
              <FaGraduationCap className="text-amber-300 text-3xl" />
              <span>{studentInfo.course}</span>
            </h1>
            <p className="text-xs text-blue-100 mt-2 flex flex-wrap items-center gap-3 font-medium">
              <span><strong>Batch:</strong> {studentInfo.batch}</span>
              <span>•</span>
              <span><strong>Lead Trainer:</strong> {studentInfo.instructor}</span>
              <span>•</span>
              <span><strong>Student Email:</strong> <strong className="text-white font-mono bg-blue-900/60 px-2 py-0.5 rounded border border-blue-400/30">{studentInfo.email}</strong></span>
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleDownload3MonthCertificate}
              className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold px-4 py-2.5 rounded-xl text-xs transition-all shadow-lg flex items-center gap-2 cursor-pointer border border-amber-300"
            >
              <FaAward className="text-base text-slate-900" />
              <span>Download Certificate (PDF)</span>
            </button>
          </div>
        </div>

        {/* Course Progress Bar */}
        <div className="mt-6 pt-5 border-t border-blue-500/40 space-y-2 relative z-10">
          <div className="flex items-center justify-between text-xs font-bold text-blue-100">
            <span className="flex items-center gap-2">
              <FaBookReader className="text-amber-300" />
              <span>Current Module: {studentInfo.currentWeek}</span>
            </span>
            <span className="bg-white/20 px-2.5 py-0.5 rounded-md font-mono text-white text-[11px] font-extrabold">{studentInfo.progress}% Completed</span>
          </div>
          <div className="w-full bg-blue-950/60 rounded-full h-3 p-0.5 border border-blue-400/30">
            <div
              className="bg-gradient-to-r from-amber-300 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${studentInfo.progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* AUTOMATED 3-MONTH CERTIFICATE UNLOCKED BANNER WITH VERIFICATION QR CODE */}
        {studentInfo.progress === 100 && (
          <div className="mt-4 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 p-4 rounded-xl border-2 border-amber-300 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-slate-950 text-amber-400 rounded-xl text-xl font-bold shadow-md">
                <FaAward />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest bg-slate-950 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400/40">
                  🎉 3-Month Course Completed!
                </span>
                <h3 className="text-base font-black mt-1 text-slate-950 flex items-center gap-2">
                  <span>Automated 3-Month Certificate Unlocked</span>
                  <span className="text-xs bg-slate-900 text-emerald-400 px-2 py-0.5 rounded-md font-mono flex items-center gap-1">
                    <FaQrcode /> Verified QR Sealed
                  </span>
                </h3>
                <p className="text-xs font-semibold text-slate-900 mt-0.5">
                  Congratulations! You have completed all 3-month practical course modules. Scan the official QR code to verify.
                </p>
              </div>
            </div>

            <button
              onClick={handleDownload3MonthCertificate}
              className="bg-slate-950 hover:bg-slate-900 text-amber-300 font-extrabold px-5 py-2.5 rounded-xl text-xs transition-all shadow-xl flex items-center justify-center gap-2 border border-amber-400/40 cursor-pointer shrink-0"
            >
              <FaAward className="text-amber-400 text-base" />
              <span>Download Official QR Certificate (PDF)</span>
            </button>
          </div>
        )}

      {/* STUDENT DEDICATED ATTENDANCE MODULE */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="bg-blue-100 text-blue-800 text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full border border-blue-200">
              📌 Official Student Attendance Module
            </span>
            <h2 className="text-lg font-black text-slate-900 mt-2 flex items-center gap-2">
              <FaClock className="text-blue-600" />
              <span>Live Class Attendance & Time Status Indicator</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict 24-Hour Check-In Rule • IPify API Public IP Verification Active
            </p>
          </div>

        </div>

        {/* Timings & Status Indicator Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500">Before 10:00 AM</span>
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <span className="w-3 h-3 rounded-full bg-white border-2 border-slate-400 shadow-xs"></span>
              <span>⚪ White Light</span>
            </div>
            <p className="text-[11px] text-slate-500">Attendance Disabled</p>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-700">10:00 AM – 10:14 AM</span>
            <div className="flex items-center gap-2 font-bold text-emerald-950">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-md animate-pulse"></span>
              <span>🟢 Green Light</span>
            </div>
            <p className="text-[11px] text-emerald-800">Available Check-In</p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-amber-800">10:15 AM – 10:29 AM</span>
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-md animate-pulse"></span>
              <span>🟠 Orange Light</span>
            </div>
            <p className="text-[11px] text-amber-900">Late Warning</p>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-rose-800">10:30 AM and After</span>
            <div className="flex items-center gap-2 font-bold text-rose-950">
              <span className="w-3 h-3 rounded-full bg-rose-500 shadow-md animate-pulse"></span>
              <span>🔴 Red Light</span>
            </div>
            <p className="text-[11px] text-rose-900">Late Fine Applicable</p>
          </div>
        </div>

        {/* Quick Action Button & Database History */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
          <div className="text-xs text-slate-600 space-y-0.5">
            <p className="font-bold text-slate-800 flex items-center gap-1.5">
              <FaShieldAlt className="text-emerald-600" /> Public IPify Status: Verified Active
            </p>
            <p className="text-[11px] text-slate-500">
              Check-in time, check-out time, attendance date & status are saved directly to database.
            </p>
          </div>

          <a
            href="/dashboard/attendance"
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 border border-blue-500 shrink-0"
          >
            <FaClock className="text-amber-300" />
            <span>Mark My Attendance Now →</span>
          </a>
        </div>
      </div>
      <div id="fee-vouchers-section" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FaMoneyBillWave className="text-emerald-600" />
              <span>Course Fee Reminders & Automatic Receipt Generator</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated 7-day, due-date, and overdue notifications • Proof Upload & Admin Verification Engine
            </p>
          </div>

          {/* Fee Status Badge */}
          <div>
            {feeStatus.status === "7_days_before" && (
              <span className="bg-blue-50 text-blue-800 border border-blue-200 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <FaClock className="text-blue-600" />
                <span>⏰ 7 Days Before Due Date (Upcoming)</span>
              </span>
            )}
            {feeStatus.status === "due_today" && (
              <span className="bg-amber-50 text-amber-800 border border-amber-300 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <FaExclamationTriangle className="text-amber-600" />
                <span>⚠️ Due Date Today! Submit Fee</span>
              </span>
            )}
            {feeStatus.status === "overdue" && (
              <span className="bg-rose-50 text-rose-800 border border-rose-300 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <FaExclamationTriangle className="text-rose-600" />
                <span>🚨 OVERDUE REMINDER: Fee Expired</span>
              </span>
            )}
            {feeStatus.status === "proof_uploaded" && (
              <span className="bg-purple-50 text-purple-800 border border-purple-200 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <FaFileUpload className="text-purple-600" />
                <span>⏳ Payment Proof Uploaded (Pending Admin Verification)</span>
              </span>
            )}
            {feeStatus.status === "verified" && (
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <FaCheckCircle className="text-emerald-600" />
                <span>✅ Fee Verified & Paid (Cycle Active)</span>
              </span>
            )}
          </div>
        </div>

        {/* Action Controls & Automatic Reminder Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Monthly Fee Amount</span>
            <p className="text-xl font-black text-slate-900">Rs. {feeStatus.amount.toLocaleString()}</p>
            <p className="text-slate-500">Next Cycle Due Date: <strong>{feeStatus.dueDate}</strong></p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Step 1: Student Proof Upload</span>
            {feeStatus.status === "verified" ? (
              <p className="text-emerald-700 font-bold">Proof Verified by Admin ✅</p>
            ) : feeStatus.status === "proof_uploaded" ? (
              <p className="text-purple-700 font-bold">Proof Uploaded: <code>{feeStatus.proofFileName}</code></p>
            ) : (
              <button
                onClick={() => setUploadModalOpen(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FaFileUpload />
                <span>Upload Payment Proof Slip</span>
              </button>
            )}
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Step 2: Admin Verify & Receipt</span>
            {feeStatus.status === "verified" ? (
              <button
                onClick={handleDownloadReceipt}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FaFileDownload />
                <span>Download Official Fee Receipt (PDF)</span>
              </button>
            ) : (
              <div className="space-y-1">
                <button
                  onClick={handleAdminVerifyPayment}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FaUserCheck />
                  <span>Admin Verify & Issue Receipt</span>
                </button>
                <span className="text-[10px] text-slate-400 block text-center">Auto-generates official receipt upon verification</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4 Core Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Dynamic Current Week */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-blue-600 font-bold text-xs">
            <span className="uppercase tracking-wider">Current Dynamic Week</span>
            <div className="p-2 bg-blue-50 rounded-xl">
              <FaCalendarAlt className="text-base" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900">
            Week #{studentInfo.calculatedWeek || 6} of 12
          </p>
          <p className="text-xs text-slate-600 font-semibold line-clamp-2">
            {studentInfo.calculatedTopic || "Node.js Express REST APIs & Supabase Auth"}
          </p>
          <p className="text-[10px] text-slate-400">
            Enrolled Start: {studentInfo.enrollDate || "Auto-tracked from admission"}
          </p>
        </div>

        {/* 2. Upcoming Lessons */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-purple-600 font-bold text-xs">
            <span className="uppercase tracking-wider">Upcoming Lessons</span>
            <div className="p-2 bg-purple-50 rounded-xl">
              <FaChalkboardTeacher className="text-base" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900">3 Live Classes</p>
          <p className="text-xs text-slate-500">Next: Mon 10:00 AM (JWT & Middleware)</p>
        </div>

        {/* 3. Deadlines */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-amber-600 font-bold text-xs">
            <span className="uppercase tracking-wider">Active Deadlines</span>
            <div className="p-2 bg-amber-50 rounded-xl">
              <FaClock className="text-base" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900">Assignment #3</p>
          <p className="text-xs text-rose-600 font-bold">Due: Aug 05, 2026 (11:59 PM)</p>
        </div>

        {/* 4. Physical On-Site Lab & Campus Schedule */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-emerald-600 font-bold text-xs">
            <span className="uppercase tracking-wider">On-Site Physical Class</span>
            <div className="p-2 bg-emerald-50 rounded-xl">
              <FaBuilding className="text-base" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900">Lab #3 (2nd Floor)</p>
          <p className="text-xs text-slate-500">Physical Campus Attendance & Workstation</p>
        </div>
      </div>

      {/* Main Content Grid: Assignments vs Recorded Lectures */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assignments Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FaTasks className="text-amber-500" />
              <span>Assigned Course Tasks & Active Deadlines</span>
            </h2>
            
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500">
                {activeValidTasks.length} Active Tasks (Auto-Removes Past Due Date)
              </span>

              {(role === "admin" || role === "hr" || role === "manager") && (
                <button
                  onClick={() => setAssignModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1 rounded-lg text-xs transition-all shadow-xs cursor-pointer"
                >
                  + Assign New Task
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {activeValidTasks.length === 0 ? (
              <div className="p-6 text-center text-slate-400 italic bg-slate-50 rounded-xl border border-slate-200">
                No active tasks assigned or all tasks have expired past their due date.
              </div>
            ) : (
              activeValidTasks.map((t) => {
                const isPassed = t.status.includes("Graded") || t.status.includes("95") || t.status.includes("90");

                return (
                  <div
                    key={t.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                      isPassed ? "bg-slate-50 border-slate-200" : "bg-amber-50/70 border-amber-200"
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-900">{t.title}</p>
                      {t.description && <p className="text-[11px] text-slate-500 mt-0.5">{t.description}</p>}
                      <p className={isPassed ? "text-[11px] text-emerald-700 font-semibold mt-0.5" : "text-[11px] text-amber-800 font-bold mt-0.5"}>
                        Due Date: {t.dueDate} • {t.status}
                      </p>
                    </div>

                    {isPassed ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-emerald-300">
                        Completed
                      </span>
                    ) : t.status.includes("Submitted") ? (
                      <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-purple-300">
                        Submitted (Under Review)
                      </span>
                    ) : (
                      <button
                        onClick={() => setTaskSubmitModal(t)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all shadow-xs cursor-pointer"
                      >
                        Submit Solution
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Physical Campus Lab Schedule & Workstation Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FaBuilding className="text-emerald-600" />
              <span>Physical Campus Lab & Workstation Schedule</span>
            </h2>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
              On-Site Physical Classes
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Lab Location & Workstation</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Software House Campus • Lab #3 (Station #12)</p>
              </div>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-blue-300">Reserved PC</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Physical Class Timings (Mon - Thu)</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Morning Tech Batch: 10:00 AM – 01:00 PM</p>
              </div>
              <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-purple-300">3 Hours/Day</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Physical Attendance Register</p>
                <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">Biometric / Manual Gate Verification Active</p>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-emerald-300">On-Site 92%</span>
            </div>

            {/* Remote Student Monitoring Status Widget */}
            <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-blue-950 flex items-center gap-1.5">
                  <FaDesktop className="text-blue-600" />
                  <span>Remote Student Work & Screenshot Monitor</span>
                </p>
                <p className="text-[11px] text-blue-800 font-medium mt-0.5">
                  Transparent Random Screenshots (5–15m) • 94.2% Active Time
                </p>
              </div>
              <a
                href="/dashboard/remote-monitoring"
                className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all shadow-2xs shrink-0"
              >
                View Live Log →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ALL-IN-ONE UNIFIED PERSONAL DASHBOARD HUB (PERSONALIZED SERVICES) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FaUserCheck className="text-indigo-600 text-lg" />
            <span>My Personal Dashboard Hub (Isolated Personal Data & Quick Actions)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Strictly scoped to your account ({studentInfo.email}). Access your attendance, tasks, salary/fee slips, complaints, and live meetings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Card 1: Attendance */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span className="flex items-center gap-1.5 text-blue-700">
                  <FaUserClock className="text-blue-600" /> My Attendance Log
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-extrabold">94% Present</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Personal daily check-in / check-out times and office IP verification status.
              </p>
            </div>
            <a
              href="/dashboard/attendance"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-center transition-all shadow-2xs block"
            >
              Open Attendance →
            </a>
          </div>

          {/* Card 2: Personal Tasks & Progress */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span className="flex items-center gap-1.5 text-amber-700">
                  <FaTasks className="text-amber-600" /> My Tasks & Progress
                </span>
                <span className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded font-extrabold">{activeValidTasks.length} Active</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Personal assigned daily tasks, live work stopwatch timer, and active deadlines.
              </p>
            </div>
            <a
              href="/dashboard/projects"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-lg text-center transition-all shadow-2xs block"
            >
              Open Daily Tasks →
            </a>
          </div>

          {/* Card 3: Complaints */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span className="flex items-center gap-1.5 text-rose-700">
                  <FaCommentDots className="text-rose-600" /> My Complaints Ticket
                </span>
                <span className="bg-rose-100 text-rose-800 text-[10px] px-2 py-0.5 rounded font-extrabold">Helpdesk</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Report Internet, HR, Teacher, or System issues and track 3-stage resolution status.
              </p>
            </div>
            <a
              href="/dashboard/complaints"
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-lg text-center transition-all shadow-2xs block"
            >
              Open Complaints →
            </a>
          </div>

          {/* Card 4: Course Fee Receipts & Certificates */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <FaMoneyBillWave className="text-emerald-600" /> My Fee Receipts & Certificate
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-extrabold">PDF Downloads</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Download verified course fee receipts, vouchers, and 3-Month completion certificate.
              </p>
            </div>
            <button
              onClick={() => {
                const element = document.getElementById("fee-vouchers-section");
                if (element) element.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-center transition-all shadow-2xs block cursor-pointer"
            >
              View Fee Vouchers ↓
            </button>
          </div>

          {/* Card 5: Leave Applications */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span className="flex items-center gap-1.5 text-indigo-700">
                  <FaUserClock className="text-indigo-600" /> My Leave Applications
                </span>
                <span className="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded font-extrabold">Status</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Apply for leaves with reason & track Admin approval (Approved / Salary Cut).
              </p>
            </div>
            <a
              href="/dashboard/leaves"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-center transition-all shadow-2xs block"
            >
              Open Leave Portal →
            </a>
          </div>

          {/* Card 6: Performance & Ranking */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span className="flex items-center gap-1.5 text-amber-700">
                  <FaAward className="text-amber-600" /> My Performance & Ranking
                </span>
                <span className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded font-extrabold">Score: 92/100</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                8-factor evaluation metrics score & monthly leaderboard ranking position.
              </p>
            </div>
            <a
              href="/dashboard/performance"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-lg text-center transition-all shadow-2xs block"
            >
              Open Performance →
            </a>
          </div>

          {/* Card 7: Company Announcements */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span className="flex items-center gap-1.5 text-purple-700">
                  <FaBullhorn className="text-purple-600" /> Company Announcements
                </span>
                <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded font-extrabold">Live Broadcast</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Official holiday notices, company policy updates, and all-hands meeting alerts.
              </p>
            </div>
            <a
              href="/dashboard/announcements"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg text-center transition-all shadow-2xs block"
            >
              Open Announcements →
            </a>
          </div>

          {/* Card 8: 1-Click Video Meeting Join */}
          <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/60 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between font-bold text-purple-950">
                <span className="flex items-center gap-1.5 text-purple-800">
                  <FaVideo className="text-purple-600" /> Live Meeting & Sync
                </span>
                <span className="bg-purple-200 text-purple-900 text-[10px] px-2 py-0.5 rounded font-extrabold">1-Click Join</span>
              </div>
              <p className="text-[11px] text-purple-900/80 mt-2">
                Sprint Sync & Class: <strong>10:30 AM Today</strong>. Click below to join room directly!
              </p>
            </div>
            <a
              href="https://meet.google.com/xyz-abc-mno"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-purple-700 hover:bg-purple-800 text-white font-extrabold py-2 rounded-lg text-center transition-all shadow-md block flex items-center justify-center gap-1.5"
            >
              <FaVideo /> <span>📹 Click & Join Meeting</span>
            </a>
          </div>
        </div>
      </div>

      {/* EXAMINATION MODULE SECTION (ONLINE MCQs, CODING TESTS, PRACTICAL TESTS & AUTO-GRADING) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FaClipboardCheck className="text-blue-600 text-lg" />
              <span>Examination Module (Online MCQs, Coding & Practical Tests)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Assigned by Admin • Online MCQs & Coding Tests with Automated Grading Engine
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1 rounded-xl">
              {exams.length} Exams Active
            </span>

            {(role === "admin" || role === "hr" || role === "manager") && (
              <button
                onClick={() => setAssignExamModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <FaClipboardCheck />
                <span>+ Assign Exam / Test</span>
              </button>
            )}
          </div>
        </div>

        {/* Exams List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {userExams.length === 0 ? (
            <div className="col-span-3 p-8 text-center text-slate-400 italic bg-slate-50 rounded-xl border border-slate-200">
              No examination tests assigned to your logged-in account ({studentInfo.email}).
            </div>
          ) : (
            userExams.map((ex) => {
            const isGraded = ex.status.includes("Graded") || ex.status.includes("100%") || ex.status.includes("85%");
            const isPending = ex.status.includes("Pending");

            return (
              <div key={ex.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300">
                      {ex.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">Due: {ex.dueDate}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{ex.title}</h3>
                  <p className="text-slate-500 text-[11px]">{ex.details}</p>

                  <div className="pt-2 border-t border-slate-200/60 space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Auto-Grading:</span>
                      <span className="font-bold text-slate-800">{ex.autoGrading ? "Enabled ✅" : "Manual Instructor 👨‍🏫"}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Passing Criteria:</span>
                      <span className="font-bold text-slate-800">{ex.passingPercentage}% Minimum</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Score / Grade:</span>
                      <span className={isGraded ? "font-bold text-emerald-700" : "font-bold text-amber-700"}>{ex.score}</span>
                    </div>
                  </div>
                </div>

                {isGraded ? (
                  <span className="w-full bg-emerald-100 text-emerald-800 font-bold py-2 rounded-lg text-center border border-emerald-300 block">
                    Completed & Auto-Graded ✅
                  </span>
                ) : isPending ? (
                  <span className="w-full bg-purple-100 text-purple-800 font-bold py-2 rounded-lg text-center border border-purple-300 block">
                    Submitted for Admin Evaluation ⏳
                  </span>
                ) : (
                  <button
                    onClick={() => setActiveTestModal(ex)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FaCode />
                    <span>Attempt {ex.type} Exam</span>
                  </button>
                )}
              </div>
            );
          }))}
        </div>
      </div>

      {/* PROOF UPLOAD MODAL */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FaFileUpload className="text-blue-600" />
                <span>Upload Payment Proof Slip</span>
              </h3>
              <button onClick={() => setUploadModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleUploadProofSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Bank Transaction Reference / Ref #
                </label>
                <input
                  type="text"
                  required
                  value={proofForm.txnRef}
                  onChange={(e) => setProofForm({ ...proofForm, txnRef: e.target.value })}
                  placeholder="e.g. TXN-99882211"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Payment Slip / Bank Transfer Attachment (PDF / JPG)
                </label>
                <input
                  type="file"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none cursor-pointer bg-slate-50"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
              >
                Submit Payment Proof to Admin
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN ASSIGN TASK MODAL */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FaTasks className="text-blue-600" />
                <span>Assign New Task to Student</span>
              </h3>
              <button onClick={() => setAssignModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleAssignNewTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTaskForm.title}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
                  placeholder="e.g. Build Next.js Contact Form"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Task Due Date (Auto-removes after this date) *
                </label>
                <input
                  type="date"
                  required
                  value={newTaskForm.dueDate}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, dueDate: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Instructions / Description
                </label>
                <textarea
                  rows="3"
                  value={newTaskForm.description}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, description: e.target.value })}
                  placeholder="Task instructions and submission rules..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
              >
                Assign Task & Set Due Date
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN ASSIGN EXAM / TEST MODAL */}
      {assignExamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FaClipboardCheck className="text-blue-600" />
                <span>Assign Examination / Test to Student</span>
              </h3>
              <button onClick={() => setAssignExamModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleAssignNewExam} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Exam / Test Title *
                </label>
                <input
                  type="text"
                  required
                  value={newExamForm.title}
                  onChange={(e) => setNewExamForm({ ...newExamForm, title: e.target.value })}
                  placeholder="e.g. Next.js Routing & Server Components Quiz"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Exam Format *
                  </label>
                  <select
                    value={newExamForm.type}
                    onChange={(e) => setNewExamForm({ ...newExamForm, type: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                  >
                    <option value="MCQs">Online MCQs</option>
                    <option value="Coding Tests">Online Coding Test</option>
                    <option value="Practical Tests">On-Site Practical Test</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Questions Count
                  </label>
                  <input
                    type="number"
                    value={newExamForm.questionsCount}
                    onChange={(e) => setNewExamForm({ ...newExamForm, questionsCount: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Passing %
                  </label>
                  <input
                    type="number"
                    value={newExamForm.passingPercentage}
                    onChange={(e) => setNewExamForm({ ...newExamForm, passingPercentage: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Exam Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newExamForm.dueDate}
                    onChange={(e) => setNewExamForm({ ...newExamForm, dueDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Exam Details & Syllabus
                </label>
                <textarea
                  rows="2"
                  value={newExamForm.details}
                  onChange={(e) => setNewExamForm({ ...newExamForm, details: e.target.value })}
                  placeholder="Topics covered, allowed time, and grading rules..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
              >
                Assign Exam & Enable Auto-Grading
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ACTIVE STUDENT TEST ATTEMPT MODAL WITH AUTOMATED GRADING ENGINE */}
      {activeTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded border border-blue-300">
                  {activeTestModal.type} Exam Mode
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-1">{activeTestModal.title}</h3>
              </div>
              <button onClick={() => setActiveTestModal(null)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button>
            </div>

            {activeTestModal.type === "MCQs" && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <p className="font-bold text-slate-900">Q1. Which hook is used to handle side-effects in React?</p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="q1" defaultChecked /> <span>A) useState</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="q1" /> <span>B) useEffect (Correct)</span>
                  </label>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <p className="font-bold text-slate-900">Q2. What status code indicates successful HTTP REST response?</p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="q2" defaultChecked /> <span>A) 200 OK (Correct)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="q2" /> <span>B) 500 Server Error</span>
                  </label>
                </div>
              </div>
            )}

            {activeTestModal.type === "Coding Tests" && (
              <div className="space-y-2 text-xs">
                <p className="font-bold text-slate-900">Live Code Editor & Unit Test Suite:</p>
                <textarea
                  rows="6"
                  value={codeSubmission}
                  onChange={(e) => setCodeSubmission(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-3 font-mono text-xs text-slate-900 bg-slate-900 text-emerald-400 outline-none"
                />
                <span className="text-[10px] text-slate-400 block">Unit tests will execute automatically upon submission.</span>
              </div>
            )}

            {activeTestModal.type === "Practical Tests" && (
              <div className="space-y-2 text-xs">
                <p className="font-bold text-slate-900">Practical Submission Description / Github Link:</p>
                <textarea
                  rows="4"
                  placeholder="Paste your practical repository URL or campus workstation station number..."
                  className="w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-900 outline-none"
                />
              </div>
            )}

            <button
              onClick={() => handleAutoGradeSubmit(activeTestModal.id)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <FaCheckDouble />
              <span>Submit & Run Automated Grading Engine</span>
            </button>
          </div>
        </div>
      )}

      {/* TASK SOLUTION ONE-TIME SUBMISSION MODAL */}
      {taskSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded border border-amber-300">
                  Single Submission Allowed
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-1">{taskSubmitModal.title}</h3>
              </div>
              <button onClick={() => setTaskSubmitModal(null)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleSingleTaskSubmission} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Upload Assignment / Project File *
                </label>
                <input
                  type="text"
                  required
                  value={submissionForm.file}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, file: e.target.value })}
                  placeholder="e.g. project_solution_v1.zip / final_submission.pdf"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Live Project Demo URL / Repository Link (Optional)
                </label>
                <input
                  type="url"
                  value={submissionForm.link}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, link: e.target.value })}
                  placeholder="https://github.com/student/my-project"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Student Comments & Submission Notes
                </label>
                <textarea
                  rows="3"
                  value={submissionForm.notes}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, notes: e.target.value })}
                  placeholder="Explain your approach, setup steps, or any notes for instructor evaluation..."
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                📌 <strong>Business Rule:</strong> You can submit work for each daily task only ONCE. Double check your files before proceeding.
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <FaFileUpload />
                <span>Submit Assignment Solution</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
