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
  FaCommentDots,
  FaCheck
} from "react-icons/fa";

// Centralized Safe Date Validator (Requirement #2)
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
    course: "Full Stack MERN Web Development",
    batch: "Batch #14 (Morning Tech)",
    instructor: "Engr. Hamza (Lead Full-Stack)",
    currentWeek: "Week #6 of 12 (Node.js Express REST APIs & Supabase Auth)",
    progress: 65,
  });

  const [feeStatus, setFeeStatus] = useState({
    dueDate: "2026-08-08",
    amount: 25000,
    status: "7_days_before",
    proofFileName: "",
    txnRef: "",
    verificationDate: "",
    receiptNo: "REC-99812",
  });

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

  const [exams, setExams] = useState([
    {
      id: "exam-201",
      title: "Online Mid-Term MCQ Quiz (JavaScript ES6 & React Hooks)",
      type: "MCQs",
      questionsCount: 20,
      passingPercentage: 70,
      assignedToEmail: "student@gmail.com",
      autoGrading: true,
      status: "Graded (85% Auto-Graded)",
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

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    title: "",
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    description: "",
  });

  const [assignExamModalOpen, setAssignExamModalOpen] = useState(false);
  const [newExamForm, setNewExamForm] = useState({
    title: "",
    type: "MCQs",
    questionsCount: 10,
    passingPercentage: 70,
    dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    details: "",
  });

  const [activeTestModal, setActiveTestModal] = useState(null);
  const [mcqAnswers, setMcqAnswers] = useState({ q1: "B", q2: "A" });
  const [codeSubmission, setCodeSubmission] = useState("// Write your Node.js middleware code here\nfunction verifyJwtToken(req, res, next) {\n  // Code implementation\n}");

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [proofForm, setProofForm] = useState({ txnRef: "", fileName: "bank_receipt_proof.pdf" });
  const [taskSubmitModal, setTaskSubmitModal] = useState(null);
  const [submissionForm, setSubmissionForm] = useState({ file: "solution_zip_project.zip", notes: "", link: "" });

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
      setStudentInfo(prev => ({
        ...prev,
        email: savedEmail,
        name: savedEmail.split("@")[0] || "Ali Hassan"
      }));
    }

    try {
      const savedTasks = localStorage.getItem("software_house_assigned_tasks");
      if (savedTasks) {
        setAssignedTasks(JSON.parse(savedTasks));
      }
    } catch(e) {}
  }, []);

  const handleDownloadReceipt = () => {
    generatePrintableStudentFeeReceiptPdf({
      receiptNo: feeStatus.receiptNo || "REC-99812",
      studentName: studentInfo.name,
      email: studentInfo.email,
      course: studentInfo.course,
      amount: feeStatus.amount,
      txnRef: feeStatus.txnRef || "TRX-8821992",
      datePaid: feeStatus.verificationDate || new Date().toLocaleDateString(),
    });
  };

  const handleDownload3MonthCertificate = () => {
    generatePrintable3MonthStudentCertificatePdf({
      studentName: studentInfo.name,
      courseName: studentInfo.course,
      batchName: studentInfo.batch,
      issueDate: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      verificationCode: "CERT-3M-" + Math.floor(100000 + Math.random() * 900000),
      studentEmail: studentInfo.email,
    });
  };

  const handleAdminVerifyPayment = () => {
    setFeeStatus(prev => ({
      ...prev,
      status: "verified",
      verificationDate: new Date().toLocaleDateString(),
      receiptNo: "REC-" + Math.floor(100000 + Math.random() * 900000)
    }));
  };

  const activeValidTasks = assignedTasks.filter(t => {
    const currentEmail = (localStorage.getItem("current_user_email") || "student@gmail.com").toLowerCase().trim();
    if (role === "admin" || role === "hr" || role === "manager") return true;
    return t.assignedToEmail ? t.assignedToEmail.toLowerCase().trim() === currentEmail : true;
  });

  const userExams = exams.filter(e => {
    const currentEmail = (localStorage.getItem("current_user_email") || "student@gmail.com").toLowerCase().trim();
    if (role === "admin" || role === "hr" || role === "manager") return true;
    return e.assignedToEmail ? e.assignedToEmail.toLowerCase().trim() === currentEmail : true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* 1. STANDARDIZED BLUE & WHITE HERO BANNER (Requirement #1) */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-full border border-[#2563EB]/20">
                Verified Student Portal
              </span>
              <span className="text-[10px] font-semibold text-[#64748B] bg-[#F8FAFC] px-2.5 py-1 rounded-full border border-[#E2E8F0]">
                Active Enrolled Member
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-[#0F172A] mt-1.5 flex items-center gap-2.5">
              <FaGraduationCap className="text-[#2563EB]" />
              <span>{studentInfo.course}</span>
            </h1>
            <p className="text-xs text-[#64748B] mt-0.5 flex flex-wrap items-center gap-3 font-medium">
              <span><strong>Batch:</strong> {studentInfo.batch}</span>
              <span>•</span>
              <span><strong>Lead Trainer:</strong> {studentInfo.instructor}</span>
              <span>•</span>
              <span><strong>Student Email:</strong> <strong className="text-[#0F172A] font-mono">{studentInfo.email}</strong></span>
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Standard Royal Blue Button (#2563EB) replacing bright yellow button */}
            <button
              onClick={handleDownload3MonthCertificate}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <FaAward className="text-sm" />
              <span>Download Certificate (PDF)</span>
            </button>
          </div>
        </div>

        {/* Course Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#0F172A]">
            <span className="flex items-center gap-2">
              <FaBookReader className="text-[#2563EB]" />
              <span>Current Module: {studentInfo.currentWeek}</span>
            </span>
            <span className="bg-[#EFF6FF] text-[#2563EB] px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold border border-[#2563EB]/20">
              {studentInfo.progress}% Completed
            </span>
          </div>
          <div className="w-full bg-[#F8FAFC] rounded-full h-3 p-0.5 border border-[#E2E8F0]">
            <div
              className="bg-[#2563EB] h-full rounded-full transition-all duration-500 shadow-xs"
              style={{ width: `${studentInfo.progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 2. COURSE FEE REMINDERS (Requirement #2 - Robust Date Fallback Validation) */}
      <div id="fee-vouchers-section" className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
          <div>
            <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
              <FaMoneyBillWave className="text-[#2563EB]" />
              <span>Course Fee Reminders & Automatic Receipt Generator</span>
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Proof Upload & Admin Verification Engine
            </p>
          </div>

          <div>
            {feeStatus.status === "verified" ? (
              <span className="bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/20 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
                <FaCheckCircle className="text-xs text-[#2563EB]" /> Fee Verified & Paid
              </span>
            ) : (
              <span className="bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/20 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
                <FaClock className="text-xs text-[#92400E]" /> Upcoming Cycle Due
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-1">
            <span className="text-[#64748B] font-semibold uppercase text-[10px]">Monthly Fee Amount</span>
            <p className="text-lg font-bold text-[#0F172A]">Rs. {feeStatus.amount.toLocaleString()}</p>
            {/* Robust Date Validation (Requirement #2) */}
            <p className="text-[#64748B]">
              Next Cycle Due Date: <strong className="text-[#0F172A]">{formatSafeDueDate(feeStatus.dueDate)}</strong>
            </p>
          </div>

          <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-2">
            <span className="text-[#64748B] font-semibold uppercase text-[10px]">Step 1: Student Proof Upload</span>
            {feeStatus.status === "verified" ? (
              <p className="text-[#2563EB] font-bold">Proof Verified by Admin ✅</p>
            ) : (
              <button
                onClick={() => setUploadModalOpen(true)}
                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold py-2 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FaFileUpload />
                <span>Upload Payment Proof Slip</span>
              </button>
            )}
          </div>

          <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-2">
            <span className="text-[#64748B] font-semibold uppercase text-[10px]">Step 2: Admin Verify & Receipt</span>
            {feeStatus.status === "verified" ? (
              <button
                onClick={handleDownloadReceipt}
                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold py-2 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FaFileDownload />
                <span>Download Official Fee Receipt (PDF)</span>
              </button>
            ) : (
              <button
                onClick={handleAdminVerifyPayment}
                className="w-full bg-white hover:bg-[#F8FAFC] text-[#2563EB] border border-[#E2E8F0] font-bold py-2 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FaUserCheck />
                <span>Admin Verify & Issue Receipt</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. UNIFIED ACTION SYSTEM FOR PERSONAL DASHBOARD HUB (Requirement #3) */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
        <div className="border-b border-[#E2E8F0] pb-3">
          <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
            <FaUserCheck className="text-[#2563EB]" />
            <span>My Personal Dashboard Hub</span>
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Strictly scoped to your account ({studentInfo.email}).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Card 1: Attendance */}
          <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between font-bold text-[#0F172A]">
                <span className="flex items-center gap-1.5 text-[#2563EB]">
                  <FaUserClock /> My Attendance Log
                </span>
                <span className="bg-[#EFF6FF] text-[#2563EB] text-[10px] px-2.5 py-0.5 rounded-full font-bold border border-[#2563EB]/20">94% Present</span>
              </div>
              <p className="text-[11px] text-[#64748B] mt-2">
                Personal daily check-in / check-out times and office IP verification status.
              </p>
            </div>
            <a
              href="/dashboard/attendance"
              className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold py-2 rounded-xl text-center transition-colors shadow-xs block"
            >
              Open Attendance →
            </a>
          </div>

          {/* Card 2: Tasks */}
          <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between font-bold text-[#0F172A]">
                <span className="flex items-center gap-1.5 text-[#2563EB]">
                  <FaTasks /> My Tasks & Progress
                </span>
                <span className="bg-[#EFF6FF] text-[#2563EB] text-[10px] px-2.5 py-0.5 rounded-full font-bold border border-[#2563EB]/20">{activeValidTasks.length} Active</span>
              </div>
              <p className="text-[11px] text-[#64748B] mt-2">
                Assigned daily tasks, work stopwatch timer, and active project deadlines.
              </p>
            </div>
            <a
              href="/dashboard/projects"
              className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold py-2 rounded-xl text-center transition-colors shadow-xs block"
            >
              Open Daily Tasks →
            </a>
          </div>

          {/* Card 3: Complaints */}
          <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between font-bold text-[#0F172A]">
                <span className="flex items-center gap-1.5 text-[#2563EB]">
                  <FaCommentDots /> My Complaints Ticket
                </span>
                <span className="bg-[#EFF6FF] text-[#2563EB] text-[10px] px-2.5 py-0.5 rounded-full font-bold border border-[#2563EB]/20">Helpdesk</span>
              </div>
              <p className="text-[11px] text-[#64748B] mt-2">
                Report Internet, HR, Teacher, or System issues and track 3-stage resolution status.
              </p>
            </div>
            <a
              href="/dashboard/complaints"
              className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold py-2 rounded-xl text-center transition-colors shadow-xs block"
            >
              Open Complaints →
            </a>
          </div>
        </div>
      </div>

      {/* 4. EXAMINATION MODULE SECTION (Requirement #4 - Ice Blue Pill Badges & Subtle Completed Indicators) */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
          <div>
            <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
              <FaClipboardCheck className="text-[#2563EB]" />
              <span>Examination Module (Online MCQs, Coding & Practical Tests)</span>
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Online MCQs & Coding Tests with Automated Grading Engine
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/20 px-3 py-1 rounded-full">
              {userExams.length} Exams Active
            </span>
          </div>
        </div>

        {/* Exams List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {userExams.length === 0 ? (
            <div className="col-span-3 p-8 text-center text-[#64748B] italic bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              No examination tests assigned to your logged-in account ({studentInfo.email}).
            </div>
          ) : (
            userExams.map((ex) => {
              const isGraded = ex.status.includes("Graded") || ex.status.includes("100%") || ex.status.includes("85%");

              return (
                <div key={ex.id} className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-3 flex flex-col justify-between shadow-xs">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      {/* Compact Ice Blue Pill Badge (Requirement #4) */}
                      <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/20 whitespace-nowrap">
                        {ex.type}
                      </span>
                      <span className="text-[10px] text-[#64748B] font-semibold">Due: {formatSafeDueDate(ex.dueDate)}</span>
                    </div>

                    <h3 className="font-bold text-[#0F172A] text-xs leading-snug">{ex.title}</h3>
                    <p className="text-[#64748B] text-[11px]">{ex.details}</p>

                    <div className="pt-2 border-t border-[#E2E8F0] space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#64748B]">Auto-Grading:</span>
                        <span className="font-semibold text-[#0F172A]">{ex.autoGrading ? "Enabled" : "Manual Instructor"}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#64748B]">Passing Criteria:</span>
                        <span className="font-semibold text-[#0F172A]">{ex.passingPercentage}% Minimum</span>
                      </div>
                    </div>
                  </div>

                  {/* Lightweight Status Badge replacing large colored footer button (Requirement #4) */}
                  <div>
                    {isGraded ? (
                      <div className="w-full bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/20 py-2 rounded-xl font-bold text-center flex items-center justify-center gap-1.5">
                        <FaCheck className="text-xs text-[#2563EB]" />
                        <span>✓ Completed ({ex.score})</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveTestModal(ex)}
                        className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold py-2 rounded-xl text-center transition-colors shadow-xs cursor-pointer block"
                      >
                        Take Test Now →
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
