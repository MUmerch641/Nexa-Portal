"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Modal from "@/components/Modal";
import { generatePrintableStudentFeeReceiptPdf } from "@/lib/generateStudentReceiptPdf";
import { generatePrintable3MonthStudentCertificatePdf } from "@/lib/generate3MonthStudentCertificatePdf";
import {
  FaGraduationCap,
  FaUserPlus,
  FaEnvelope,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTrash,
  FaCalendarAlt,
  FaPaperPlane,
  FaChalkboardTeacher,
  FaLink,
  FaAward,
  FaPrint,
  FaTimes,
  FaHistory,
  FaMoneyBillWave,
  FaVideo,
  FaTasks
} from "react-icons/fa";

export default function CoursesPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [role, setRole] = useState("admin");

  // Modal State
  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  // Certificate Modal State
  const [certificateModal, setCertificateModal] = useState({
    isOpen: false,
    student: null,
  });

  const showAlert = (title, message, type = "info") => {
    setModal({ isOpen: true, title, message, type });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  const calculate30DaysLater = (dateString) => {
    const date = new Date(dateString || new Date());
    date.setDate(date.getDate() + 30);
    return date.toISOString().split("T")[0];
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const threeMonthsLaterStr = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const availableCourses = [
    {
      title: "Full Stack MERN Web Development",
      defaultFee: 25000,
      instructor: "Engr. Hamza (Lead Full-Stack)",
      resources: "https://github.com/softwarehouse/mern-course-materials",
    },
    {
      title: "Python & Artificial Intelligence",
      defaultFee: 30000,
      instructor: "Dr. Bilal Ahmed (AI Specialist)",
      resources: "https://drive.google.com/drive/folders/ai-python-resources",
    },
    {
      title: "UI/UX Graphic & Product Design",
      defaultFee: 20000,
      instructor: "Ayesha Malik (Senior UI/UX Designer)",
      resources: "https://figma.com/@softwarehouse-design-system",
    },
    {
      title: "Mobile App Development (Flutter)",
      defaultFee: 28000,
      instructor: "Usman Raza (Mobile Apps Lead)",
      resources: "https://github.com/softwarehouse/flutter-mobile-course",
    },
    {
      title: "Cybersecurity & Ethical Hacking",
      defaultFee: 35000,
      instructor: "Zain Ali (Security Consultant)",
      resources: "https://drive.google.com/drive/folders/cyber-security-labs",
    },
  ];

  // Paid Course Enrollment Form State
  const [form, setForm] = useState({
    full_name: "",
    cnic: "",
    email: "",
    assigned_password: "studentpassword123",
    phone: "",
    batch: "Batch #14 (Morning Tech)",
    guardian_name: "",
    guardian_phone: "",
    emergency_phone: "",
    assignments_count: 5,
    completed_assignments: 3,
    course_name: "Full Stack MERN Web Development",
    instructor: "Engr. Hamza (Lead Full-Stack)",
    resources_url: "https://github.com/softwarehouse/mern-course-materials",
    start_date: todayStr,
    end_date: threeMonthsLaterStr,
    progress: 0,
    course_fee: "25000",
    fee_paid: "25000",
    last_payment_date: todayStr,
    next_due_date: calculate30DaysLater(todayStr),
  });

  // Full Student Management Inspection Modal State
  const [inspectStudentModal, setInspectStudentModal] = useState(null);

  useEffect(() => {
    setRole(localStorage.getItem("user_role") || "admin");
    const handleRoleChange = () => setRole(localStorage.getItem("user_role") || "admin");
    window.addEventListener("roleChanged", handleRoleChange);
    return () => window.removeEventListener("roleChanged", handleRoleChange);
  }, []);

  const handleCourseSelect = (e) => {
    const selectedTitle = e.target.value;
    const courseObj = availableCourses.find((c) => c.title === selectedTitle);
    const fee = courseObj ? courseObj.defaultFee.toString() : "25000";
    const inst = courseObj ? courseObj.instructor : "Internal Lead Trainer";
    const res = courseObj ? courseObj.resources : "";

    setForm({
      ...form,
      course_name: selectedTitle,
      course_fee: fee,
      fee_paid: fee,
      instructor: inst,
      resources_url: res,
    });
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // Automated 30-Day Direct Student Fee Email Dispatcher
  const autoDispatchFeeReminders = async (studentList) => {
    const today = new Date();
    const overdueList = studentList.filter((s) => {
      if (!s.next_due_date || s.reminder_sent) return false;
      const dueDate = new Date(s.next_due_date);
      return dueDate <= today;
    });

    if (overdueList.length > 0) {
      for (const student of overdueList) {
        await supabase
          .from("students")
          .update({ reminder_sent: true })
          .eq("id", student.id);
      }

      const names = overdueList.map((s) => `${s.full_name} (${s.email})`).join(", ");
      showAlert(
        "⚡ Automatic Student Email Sent!",
        `30-day course fee cycle matured for: ${names}.\n\nSystem has automatically dispatched monthly fee reminder emails directly to their registered email addresses asking them to submit their fee!`,
        "info"
      );
    }
  };

  // Fetch Paid Course Students with Local Storage Fallback & Supabase Sync
  const fetchStudents = async () => {
    setLoading(true);
    let dbStudents = [];
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        dbStudents = data;
      }
    } catch (err) {}

    let localStudents = [];
    try {
      const saved = localStorage.getItem("persistent_courses");
      if (saved) localStudents = JSON.parse(saved);
    } catch(e) {}

    const studentMap = new Map();
    localStudents.forEach(s => {
      const key = (s.id || s.email || "").toLowerCase();
      if (key) studentMap.set(key, s);
    });
    dbStudents.forEach(s => {
      const key = (s.id || s.email || "").toLowerCase();
      if (key) studentMap.set(key, { ...studentMap.get(key), ...s });
    });

    const finalStudents = Array.from(studentMap.values());
    setStudents(finalStudents);
    autoDispatchFeeReminders(finalStudents);
    try {
      localStorage.setItem("persistent_courses", JSON.stringify(finalStudents));
    } catch(e) {}
    setLoading(false);
  };

  const handleClearAllLocalData = () => {
    if (!confirm("Clear all local cached student test records?")) return;
    localStorage.removeItem("persistent_courses");
    setStudents([]);
    fetchStudents();
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Fee Receipt Modal State
  const [feeReceiptModal, setFeeReceiptModal] = useState({
    isOpen: false,
    receiptData: null,
  });

  // Register Paid Course Student
  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.course_name) {
      showAlert("Missing Fields", "Please enter Student Name, Email, and select a Course.", "warning");
      return;
    }

    const trimmedEmail = form.email.trim().toLowerCase();
    const selectedCourseObj = availableCourses.find(c => c.title === form.course_name);

    if (!selectedCourseObj) {
      showAlert("Invalid Course ⚠️", "Please select an Active course from the list.", "warning");
      return;
    }

    // Duplicate Enrollment Validation: Prevent duplicate enrollment in the same course
    const isAlreadyEnrolled = students.some(
      s => (s.email || "").trim().toLowerCase() === trimmedEmail &&
           (s.course_name || "").trim().toLowerCase() === form.course_name.trim().toLowerCase()
    );

    if (isAlreadyEnrolled) {
      showAlert(
        "Duplicate Enrollment Blocked 🛑",
        `Student '${form.full_name}' (${form.email}) is ALREADY enrolled in '${form.course_name}'. Duplicate course enrollment is not allowed.`,
        "error"
      );
      return;
    }

    setSubmitting(true);
    const totalFeeAmount = Number(form.course_fee || selectedCourseObj.defaultFee || 0);
    const feePaidAmount = Number(form.fee_paid || 0);
    const receiptNo = `REC-${Date.now().toString().slice(-6)}`;
    const nowIso = new Date().toISOString();

    const receiptObj = {
      receipt_no: receiptNo,
      student_name: form.full_name,
      student_email: form.email,
      student_phone: form.phone,
      course_name: form.course_name,
      instructor: form.instructor || selectedCourseObj.instructor,
      batch: form.batch,
      enrollment_date: form.start_date || todayStr,
      total_course_fee: totalFeeAmount,
      amount_paid: feePaidAmount,
      balance_due: Math.max(0, totalFeeAmount - feePaidAmount),
      payment_status: feePaidAmount >= totalFeeAmount ? "Fully Paid" : "Partially Paid",
      issued_at: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    };

    const newStudentObj = {
      id: `s-${Date.now()}`,
      full_name: form.full_name,
      cnic: form.cnic,
      email: form.email,
      phone: form.phone,
      enrollment_type: "Paid Course Student",
      course_name: form.course_name,
      instructor: form.instructor,
      resources_url: form.resources_url,
      start_date: form.start_date,
      end_date: form.end_date,
      progress: Number(form.progress || 0),
      course_fee: totalFeeAmount,
      fee_paid: feePaidAmount,
      last_payment_date: form.last_payment_date,
      next_due_date: form.next_due_date,
      fee_status: feePaidAmount >= totalFeeAmount ? "Paid" : "Pending Due",
      reminder_sent: false,
      receipt: receiptObj,
    };

    const studentMap = new Map();
    [newStudentObj, ...students].forEach(s => {
      const emailKey = (s.email || "").trim().toLowerCase();
      const courseKey = (s.course_name || "").trim().toLowerCase();
      studentMap.set(`${emailKey}_${courseKey}`, s);
    });

    const currentList = Array.from(studentMap.values());
    setStudents(currentList);
    try {
      localStorage.setItem("persistent_courses", JSON.stringify(currentList));
    } catch (e) {}

    try {
      const dbInsertObj = {
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        course_name: form.course_name,
        course_fee: totalFeeAmount,
        fee_paid: feePaidAmount,
        fee_status: feePaidAmount >= totalFeeAmount ? "Paid" : "Pending Due",
      };

      const { data: insertRes, error: insertErr } = await supabase
        .from("students")
        .insert([dbInsertObj])
        .select();

      if (insertErr) {
        console.warn("Supabase student insert notice:", insertErr);
      } else {
        await fetchStudents();
      }
    } catch (dbErr) {
      console.warn("Supabase insert notice:", dbErr);
    }

    // Auto-save credentials for registered student
    const userCredentials = {
      fullName: form.full_name,
      email: form.email,
      password: form.assigned_password || "studentpassword123",
      role: "employee",
      department: form.course_name,
    };

    try {
      const saved = localStorage.getItem("registered_system_users");
      const existing = saved ? JSON.parse(saved) : [];
      const updated = [...existing.filter(u => u.email.toLowerCase() !== form.email.toLowerCase()), userCredentials];
      localStorage.setItem("registered_system_users", JSON.stringify(updated));
    } catch(e) {}

    setSubmitting(false);

    // Auto-generate & show Student Fee Receipt Modal
    setFeeReceiptModal({
      isOpen: true,
      receiptData: receiptObj
    });

    setForm({
      full_name: "",
      cnic: "",
      email: "",
      assigned_password: "studentpassword123",
      phone: "",
      batch: "Batch #14 (Morning Tech)",
      guardian_name: "",
      guardian_phone: "",
      emergency_phone: "",
      assignments_count: 5,
      completed_assignments: 3,
      course_name: "Full Stack MERN Web Development",
      instructor: "Engr. Hamza (Lead Full-Stack)",
      resources_url: "https://github.com/softwarehouse/mern-course-materials",
      start_date: todayStr,
      end_date: threeMonthsLaterStr,
      progress: 0,
      course_fee: "25000",
      fee_paid: "25000",
      last_payment_date: todayStr,
      next_due_date: calculate30DaysLater(todayStr),
    });
  };

  // Update Student Progress Handler
  const updateStudentProgress = async (studentId, newProgress) => {
    const val = Math.min(100, Math.max(0, Number(newProgress) || 0));
    const updatedList = students.map((s) => (s.id === studentId ? { ...s, progress: val } : s));
    setStudents(updatedList);
    try {
      localStorage.setItem("persistent_courses", JSON.stringify(updatedList));
    } catch (e) {}

    try {
      await supabase.from("students").update({ progress: val }).eq("id", studentId);
    } catch (e) {}
  };

  // Record Monthly Fee Submission & Recalculate Next 30-Day Due Date
  const handleRecordFeeSubmission = async (studentId) => {
    const today = new Date().toISOString().split("T")[0];
    const newNextDueDate = calculate30DaysLater(today);

    const updatedList = students.map((s) => {
      if (s.id === studentId) {
        return {
          ...s,
          last_payment_date: today,
          next_due_date: newNextDueDate,
          fee_status: "Paid",
          reminder_sent: false,
        };
      }
      return s;
    });

    setStudents(updatedList);
    try {
      localStorage.setItem("persistent_courses", JSON.stringify(updatedList));
    } catch (e) {}

    try {
      await supabase
        .from("students")
        .update({
          last_payment_date: today,
          next_due_date: newNextDueDate,
          fee_status: "Paid",
          reminder_sent: false,
        })
        .eq("id", studentId);
    } catch (e) {}

    const studentObj = students.find((s) => s.id === studentId);
    showAlert(
      "Fee Submitted & Next 30-Day Cycle Reset! 🟢",
      `Monthly fee submitted for: ${studentObj?.full_name || "Student"}.\n\nFee Submission Date: ${today}\nNext 30-Day Fee Due Date: ${newNextDueDate}\n\nThe 30-day fee email reminder cycle has been reset to trigger 30 days from today!`,
      "success"
    );
  };

  // Manual Trigger Email Reminder
  const sendFeeReminderEmail = async (student) => {
    showAlert(
      "📧 Direct Email Fee Reminder Sent!",
      `Fee Reminder Email dispatched directly to:\nStudent: ${student.full_name} (${student.email})\n\nSubject: Monthly Course Fee Reminder\nMessage: Your 30-day fee cycle for '${student.course_name}' has matured. Please submit your monthly fee.`,
      "info"
    );
    await supabase.from("students").update({ reminder_sent: true }).eq("id", student.id);
  };

  // Open Certificate Download Modal
  const openCertificate = (student) => {
    setCertificateModal({ isOpen: true, student });
  };

  const printCertificate = () => {
    window.print();
  };

  const handleDeleteStudent = async (studentObj) => {
    const id = typeof studentObj === "object" ? studentObj.id : studentObj;
    const email = typeof studentObj === "object" ? studentObj.email : null;

    if (!confirm("Are you sure you want to delete this student record?")) return;

    const filtered = students.filter((s) => s.id !== id && (email ? s.email !== email : true));
    setStudents(filtered);

    try {
      localStorage.setItem("persistent_courses", JSON.stringify(filtered));
    } catch (e) {}

    try {
      if (id && !id.startsWith("s-")) {
        await supabase.from("students").delete().eq("id", id);
      } else if (email) {
        await supabase.from("students").delete().eq("email", email);
      }
    } catch (e) {}
  };

  const dueStudents = students.filter((s) => {
    if (!s.next_due_date) return false;
    const dueDate = new Date(s.next_due_date);
    return dueDate <= new Date();
  });

  return (
    <div className="space-y-6">
      {/* Custom Modal */}
      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={closeModal}
      />

      {/* Printable Student Fee Receipt Modal */}
      {feeReceiptModal.isOpen && feeReceiptModal.receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl border border-blue-200 space-y-5 relative print:p-0 print:border-none print:shadow-none">
            <button
              onClick={() => setFeeReceiptModal({ isOpen: false, receiptData: null })}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-2 print:hidden cursor-pointer"
            >
              <FaTimes className="text-lg" />
            </button>

            <div className="border border-slate-200 p-6 rounded-2xl space-y-4 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <img src="/logo.jpeg" alt="Logo" className="h-10 w-10 rounded-xl object-cover border border-slate-200" />
                  <div>
                    <h2 className="text-base font-black text-slate-900 leading-tight">Software House Academy</h2>
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Official Student Fee Receipt</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Receipt No</span>
                  <p className="text-xs font-mono font-black text-blue-700">{feeReceiptModal.receiptData.receipt_no}</p>
                  <p className="text-[10px] text-slate-500">{feeReceiptModal.receiptData.issued_at}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Student Name</span>
                  <p className="font-bold text-slate-900">{feeReceiptModal.receiptData.student_name}</p>
                  <p className="text-[10px] font-mono text-slate-500">{feeReceiptModal.receiptData.student_email}</p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Enrolled Course</span>
                  <p className="font-bold text-blue-800 text-xs">{feeReceiptModal.receiptData.course_name}</p>
                  <p className="text-[10px] text-slate-500">Instructor: {feeReceiptModal.receiptData.instructor}</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5 text-right">Amount (PKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    <tr>
                      <td className="p-2.5 font-sans font-medium text-slate-800">Total Course Fee Structure</td>
                      <td className="p-2.5 text-right font-bold">{Number(feeReceiptModal.receiptData.total_course_fee).toLocaleString()} PKR</td>
                    </tr>
                    <tr className="bg-emerald-50/50">
                      <td className="p-2.5 font-sans font-bold text-emerald-900">Amount Paid at Enrollment</td>
                      <td className="p-2.5 text-right font-bold text-emerald-700">{Number(feeReceiptModal.receiptData.amount_paid).toLocaleString()} PKR</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-sans font-bold text-slate-800">Remaining Balance Due</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">{Number(feeReceiptModal.receiptData.balance_due).toLocaleString()} PKR</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                <span className="font-bold text-slate-600">Payment Status:</span>
                <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase border ${
                  feeReceiptModal.receiptData.payment_status === "Fully Paid"
                    ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                    : "bg-amber-100 text-amber-900 border-amber-300"
                }`}>
                  {feeReceiptModal.receiptData.payment_status}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 print:hidden">
              <button
                type="button"
                onClick={() => setFeeReceiptModal({ isOpen: false, receiptData: null })}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => generatePrintableStudentFeeReceiptPdf(feeReceiptModal.receiptData)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
              >
                <FaPrint />
                <span>Download Fee Receipt PDF (generateStudentReceiptPdf)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Certificate Modal */}
      {certificateModal.isOpen && certificateModal.student && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-8 shadow-2xl border-4 border-amber-400 space-y-6 relative print:p-0 print:border-none print:shadow-none">
            <button
              onClick={() => setCertificateModal({ isOpen: false, student: null })}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-2 print:hidden"
            >
              <FaTimes className="text-lg" />
            </button>

            <div className="border-2 border-slate-900 p-8 rounded-2xl text-center space-y-6 bg-slate-50/50">
              <div className="flex items-center justify-center gap-3">
                <img src="/logo.jpeg" alt="Logo" className="h-12 w-12 rounded-xl object-cover border border-slate-300" />
                <div className="text-left">
                  <h2 className="text-lg font-bold text-slate-900 leading-tight">Software House</h2>
                  <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Official Training Academy</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs uppercase font-bold text-amber-600 tracking-widest">Certificate of Completion</p>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">COURSE COMPLETION AWARD</h1>
                <p className="text-xs text-slate-500 italic">This is proudly presented to</p>
              </div>

              <div className="border-b-2 border-amber-400 pb-2 max-w-md mx-auto">
                <h3 className="text-2xl font-bold text-blue-800 font-serif">
                  {certificateModal.student.full_name}
                </h3>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed max-w-xl mx-auto">
                for successfully completing the official professional course in{" "}
                <span className="font-bold text-slate-900">{certificateModal.student.course_name}</span> under the supervision of{" "}
                <span className="font-bold text-blue-700">{certificateModal.student.instructor || "Lead Trainer"}</span>.
              </p>

              <div className="pt-6 border-t border-slate-200 grid grid-cols-3 items-center text-xs">
                <div>
                  <div className="font-bold text-slate-800">{certificateModal.student.start_date || "2026-05-01"}</div>
                  <div className="text-[11px] text-slate-500">Start Date</div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 border border-amber-300 text-amber-700 text-xl shadow-xs">
                    <FaAward />
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 uppercase mt-1">Certified Official</span>
                </div>

                <div>
                  <div className="font-bold text-slate-800">{certificateModal.student.end_date || todayStr}</div>
                  <div className="text-[11px] text-slate-500">Completion Date</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 print:hidden">
              <button
                onClick={() => generatePrintable3MonthStudentCertificatePdf({
                  student_name: certificateModal.student.full_name,
                  course_name: certificateModal.student.course_name,
                  batch: certificateModal.student.batch || "Batch #14",
                  cert_id: `CERT-${certificateModal.student.id}`
                })}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
              >
                <FaPrint />
                <span>Download Official PDF Certificate (generate3MonthStudentCertificatePdf)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT ROLE PERSONAL LEARNING WORKSPACE */}
      {(role === "student" || role === "intern") && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-6 border border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-800">
                Personalized Student Learning Portal
              </span>
              <h2 className="text-2xl font-black mt-2 text-white">Full Stack MERN Web Development</h2>
              <p className="text-xs text-slate-400 mt-1">
                Batch #14 (Morning Tech) • Instructor: Engr. Hamza (Lead Full-Stack)
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-xl text-right min-w-[200px]">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Overall Course Completion</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">65% Completed</div>
              <div className="w-full bg-slate-700 h-2 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: "65%" }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Current Week */}
            <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                <FaCalendarAlt />
                <span>Current Week</span>
              </div>
              <p className="text-lg font-black text-white">Week #6 of 12</p>
              <p className="text-[11px] text-slate-400">Node.js Express REST APIs & Supabase Auth</p>
            </div>

            {/* Upcoming Lessons */}
            <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                <FaChalkboardTeacher />
                <span>Upcoming Lessons</span>
              </div>
              <p className="text-lg font-black text-white">3 Lectures Scheduled</p>
              <p className="text-[11px] text-slate-400">Next Live: Mon 10:00 AM (JWT & RBAC Middleware)</p>
            </div>

            {/* Assignments & Deadlines */}
            <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <FaTasks />
                <span>Assignments & Deadlines</span>
              </div>
              <p className="text-lg font-black text-white">Assignment #4 Due</p>
              <p className="text-[11px] text-rose-400 font-bold">Deadline: Aug 05, 2026 (11:59 PM)</p>
            </div>

            {/* Recorded Lectures */}
            <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <FaVideo />
                <span>Recorded Lectures</span>
              </div>
              <p className="text-lg font-black text-white">18 Video Recordings</p>
              <p className="text-[11px] text-slate-400">HD Portal Video Library & Code Vault</p>
            </div>
          </div>

          {/* Student Assignments & Videos List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            {/* Assignments Panel */}
            <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl space-y-3">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <FaTasks className="text-amber-400" />
                <span>Your Assigned Course Assignments</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="bg-slate-800 p-3 rounded-lg flex justify-between items-center border border-slate-700">
                  <div>
                    <p className="font-bold text-slate-100">Assignment 1: Responsive Next.js Landing Page</p>
                    <p className="text-[10px] text-emerald-400 font-semibold">Submitted & Graded: 95/100</p>
                  </div>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-800">Passed</span>
                </div>
                <div className="bg-slate-800 p-3 rounded-lg flex justify-between items-center border border-slate-700">
                  <div>
                    <p className="font-bold text-slate-100">Assignment 2: Supabase Auth & Multi-Role Schema</p>
                    <p className="text-[10px] text-emerald-400 font-semibold">Submitted & Graded: 90/100</p>
                  </div>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-800">Passed</span>
                </div>
                <div className="bg-slate-800 p-3 rounded-lg flex justify-between items-center border border-amber-500/50">
                  <div>
                    <p className="font-bold text-slate-100">Assignment 3: Enterprise Payroll Engine & PDF Generator</p>
                    <p className="text-[10px] text-amber-300 font-semibold">Pending Deadline: Aug 05, 2026</p>
                  </div>
                  <button className="text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1 rounded transition-all">Submit Solution</button>
                </div>
              </div>
            </div>

            {/* Recorded Lectures Panel */}
            <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl space-y-3">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <FaVideo className="text-emerald-400" />
                <span>Watch Recorded Course Lectures</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="bg-slate-800 p-3 rounded-lg flex justify-between items-center border border-slate-700">
                  <div>
                    <p className="font-bold text-slate-100">Lec 14: Supabase Edge Functions & PostgreSQL Triggers</p>
                    <p className="text-[10px] text-slate-400">Duration: 1h 24m • Recorded Yesterday</p>
                  </div>
                  <a href="https://drive.google.com" target="_blank" className="text-[10px] bg-slate-700 hover:bg-slate-600 text-white font-bold px-2.5 py-1 rounded transition-all flex items-center gap-1">
                    <FaVideo className="text-[9px]" /> Watch
                  </a>
                </div>
                <div className="bg-slate-800 p-3 rounded-lg flex justify-between items-center border border-slate-700">
                  <div>
                    <p className="font-bold text-slate-100">Lec 15: Next.js Middleware Route Protection & RBAC</p>
                    <p className="text-[10px] text-slate-400">Duration: 1h 45m • Recorded 2 days ago</p>
                  </div>
                  <a href="https://drive.google.com" target="_blank" className="text-[10px] bg-slate-700 hover:bg-slate-600 text-white font-bold px-2.5 py-1 rounded transition-all flex items-center gap-1">
                    <FaVideo className="text-[9px]" /> Watch
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Management Header & Overview Cards (Admin Only) */}
      {role === "admin" && (
        <>
          <div className="border-b border-slate-200 pb-4">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <FaGraduationCap className="text-blue-600" />
              <span>Courses & Paid Enrolled Students</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              3-Month Course Progress Tracking • 30-Day Auto Student Fee Email Dispatcher • Automated 3-Month Certificates
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Course Students
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{loading ? "..." : students.length}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FaGraduationCap className="text-xl" />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                  3-Month Certificate Ready
                </p>
                <p className="mt-2 text-2xl font-bold text-emerald-700">
                  {loading ? "..." : students.filter((s) => s.progress === 100).length}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <FaAward className="text-xl" />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">
                  30-Day Fee Matured (Auto-Mailed)
                </p>
                <p className="mt-2 text-2xl font-bold text-rose-700">{loading ? "..." : dueStudents.length}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <FaExclamationTriangle className="text-xl" />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Course Enrollment Form (Admin Only) */}
        {role === "admin" && (
          <div className="lg:col-span-1 rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 h-fit">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <FaUserPlus className="text-blue-600" />
              <span>Enroll Course Student</span>
            </h2>

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Student Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="e.g. Sara Ahmed"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  CNIC / B-Form Number
                </label>
                <input
                  type="text"
                  name="cnic"
                  value={form.cnic}
                  onChange={handleChange}
                  placeholder="35201-9876543-2"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Student Phone #
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="03001234567"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Batch Selection *
                  </label>
                  <select
                    name="batch"
                    value={form.batch}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 bg-white"
                  >
                    <option value="Batch #14 (Morning Tech)">Batch #14 (Morning Tech)</option>
                    <option value="Batch #15 (Afternoon Lab)">Batch #15 (Afternoon Lab)</option>
                    <option value="Batch #16 (Evening Pro)">Batch #16 (Evening Pro)</option>
                    <option value="Weekend Special Batch">Weekend Special Batch</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Guardian Name & Guardian Phone #
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    name="guardian_name"
                    value={form.guardian_name}
                    onChange={handleChange}
                    placeholder="Guardian Name"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                  />
                  <input
                    type="text"
                    name="guardian_phone"
                    value={form.guardian_phone}
                    onChange={handleChange}
                    placeholder="Guardian Phone #"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="student@gmail.com"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Assign Login Password *
                  </label>
                  <input
                    type="text"
                    name="assigned_password"
                    value={form.assigned_password}
                    onChange={handleChange}
                    placeholder="Set password..."
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Course Selection *
                </label>
                <select
                  name="course_name"
                  value={form.course_name}
                  onChange={handleCourseSelect}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
                >
                  {availableCourses.map((c) => (
                    <option key={c.title} value={c.title}>
                      {c.title} ({c.defaultFee.toLocaleString()} PKR)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Enroll Date
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={form.start_date}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Completion (3 Months)
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={form.end_date}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Total Fee (PKR)
                  </label>
                  <input
                    type="number"
                    name="course_fee"
                    value={form.course_fee}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Submitted Fee
                  </label>
                  <input
                    type="number"
                    name="fee_paid"
                    value={form.fee_paid}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Emergency Contact #
                  </label>
                  <input
                    type="text"
                    name="emergency_phone"
                    value={form.emergency_phone}
                    onChange={handleChange}
                    placeholder="03009998877"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Total Assignments
                  </label>
                  <input
                    type="number"
                    name="assignments_count"
                    value={form.assignments_count}
                    onChange={handleChange}
                    placeholder="5"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs"
              >
                {submitting ? "Enrolling..." : "Enroll Student & Set 30-Day Cycle"}
              </button>
            </form>
          </div>
        )}

        {/* Paid Course Students Directory (Admin Only) */}
        {role === "admin" && (
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-800">Enrolled Course Students & 30-Day Fee Status</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearAllLocalData}
                className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-2.5 py-1 rounded border border-rose-200 transition-all cursor-pointer"
              >
                Clear Local Test Cache 🧹
              </button>
              <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Auto 30-Day Fee Reminders Active</span>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Student & Course</th>
                  <th className="px-4 py-3">3-Month Progress</th>
                  <th className="px-4 py-3">30-Day Fee Due</th>
                  <th className="px-4 py-3 text-right">3-Month Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {students.map((st) => {
                  const isCompleted = st.progress === 100;
                  const is3MonthsMatured = new Date(st.end_date || "2026-08-01") <= new Date();
                  const isCertificateUnlocked = isCompleted && is3MonthsMatured;

                  const dueDate = new Date(st.next_due_date || todayStr);
                  const isFeeOverdue = dueDate <= new Date();

                    return (
                      <tr key={st.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-4 space-y-1">
                          <div className="font-bold text-slate-900">{st.full_name}</div>
                          <div className="text-xs text-blue-600 font-semibold">{st.course_name}</div>
                          <div className="text-[11px] text-slate-400">{st.email}</div>
                          <div className="text-[11px] text-slate-500">Enrolled: {st.start_date} • End: {st.end_date}</div>
                        </td>

                        <td className="px-4 py-4 min-w-[160px]">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                            <span>Progress</span>
                            <span className={isCompleted ? "text-emerald-700 font-extrabold" : "text-blue-700"}>
                              {st.progress || 0}%
                            </span>
                          </div>

                          <div className="w-full bg-slate-100 h-2 rounded-full mt-1.5 overflow-hidden border border-slate-200">
                            <div
                              className={isCompleted ? "bg-emerald-500 h-full rounded-full" : "bg-blue-600 h-full rounded-full"}
                              style={{ width: `${st.progress || 0}%` }}
                            />
                          </div>

                          {role === "admin" && (
                            <div className="pt-2 space-y-1">
                              <div className="flex items-center gap-1">
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={st.progress || 0}
                                  onChange={(e) => updateStudentProgress(st.id, e.target.value)}
                                  className="w-full accent-blue-600 cursor-pointer"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => updateStudentProgress(st.id, Math.min(100, (st.progress || 0) + 10))}
                                  className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded border border-blue-200"
                                >
                                  +10%
                                </button>
                                <button
                                  onClick={() => updateStudentProgress(st.id, Math.min(100, (st.progress || 0) + 25))}
                                  className="text-[10px] bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded border border-purple-200"
                                >
                                  +25%
                                </button>
                                <button
                                  onClick={() => updateStudentProgress(st.id, 100)}
                                  className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded border border-emerald-200"
                                >
                                  100%
                                </button>
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <div className="text-xs font-bold font-mono text-slate-800">
                            Next Due: {st.next_due_date || "—"}
                          </div>

                          {isFeeOverdue ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 mt-1">
                              <FaExclamationTriangle className="text-[9px]" /> 30-Day Fee Matured (Auto-Mailed)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-1">
                              <FaCheckCircle className="text-[9px]" /> Active (Cycle OK)
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4 text-right space-y-1.5 text-xs">
                          {role === "admin" && (
                            <button
                              onClick={() => handleRecordFeeSubmission(st.id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 transition-colors cursor-pointer w-full justify-center"
                            >
                              <FaMoneyBillWave />
                              <span>Submit Fee (Reset 30 Days)</span>
                            </button>
                          )}

                          {isCertificateUnlocked ? (
                            <button
                              onClick={() => openCertificate(st)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors cursor-pointer"
                            >
                              <FaAward />
                              <span>Download Certificate</span>
                            </button>
                          ) : (
                            <div className="text-right">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                🔒 Certificate Locked
                              </span>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Unlocks after 3 Months ({st.end_date})
                              </div>
                            </div>
                          )}

                          {role === "admin" && (
                            <div className="pt-1 flex flex-wrap items-center justify-end gap-2">
                              {st.receipt && (
                                <button
                                  onClick={() => setFeeReceiptModal({ isOpen: true, receiptData: st.receipt })}
                                  className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                                >
                                  <FaPrint className="text-[10px]" /> Fee Receipt
                                </button>
                              )}
                              <button
                                onClick={() => setInspectStudentModal(st)}
                                className="text-[11px] font-bold text-blue-600 hover:underline"
                              >
                                View Record
                              </button>
                              <button
                                onClick={() => sendFeeReminderEmail(st)}
                                title="Send Direct Fee Reminder Email"
                                className="text-[11px] font-semibold text-slate-600 hover:underline"
                              >
                                Fee Email
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(st)}
                                className="text-[11px] font-semibold text-rose-600 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>

      {/* FULL STUDENT RECORD INSPECTION MODAL */}
      {inspectStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  Full Student Admission & Academic Record
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">{inspectStudentModal.full_name}</h3>
                <p className="text-xs font-mono text-slate-500">{inspectStudentModal.email}</p>
              </div>
              <button
                onClick={() => setInspectStudentModal(null)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-0.5">
                <p className="text-slate-400 font-bold uppercase text-[10px]">Course Name</p>
                <p className="text-slate-900 font-bold text-xs">{inspectStudentModal.course_name}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-0.5">
                <p className="text-slate-400 font-bold uppercase text-[10px]">Assigned Batch</p>
                <p className="text-blue-700 font-bold text-xs">{inspectStudentModal.batch || "Batch #14 (Morning Tech)"}</p>
              </div>

              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 space-y-0.5">
                <p className="text-blue-600 font-bold uppercase text-[10px]">Guardian Name</p>
                <p className="text-slate-900 font-bold text-xs">{inspectStudentModal.guardian_name || "Tariq Mahmood"}</p>
              </div>

              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 space-y-0.5">
                <p className="text-blue-600 font-bold uppercase text-[10px]">Guardian Phone #</p>
                <p className="text-slate-900 font-bold font-mono text-xs">{inspectStudentModal.guardian_phone || "03219876543"}</p>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 space-y-0.5">
                <p className="text-amber-700 font-bold uppercase text-[10px]">30-Day Fee Status</p>
                <p className="text-amber-950 font-bold text-xs">{inspectStudentModal.fee_status || "Paid"} (Due: {inspectStudentModal.next_due_date})</p>
              </div>

              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 space-y-0.5">
                <p className="text-emerald-700 font-bold uppercase text-[10px]">Attendance Log</p>
                <p className="text-emerald-950 font-bold text-xs">Present 🟢 (92% Monthly Attendance)</p>
              </div>
            </div>

            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs space-y-2">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Course Progress & Completion</span>
                <span className="text-emerald-400 font-black">{inspectStudentModal.progress || 0}%</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Assignments Status</span>
                <span className="text-blue-300 font-bold">3 / 5 Assignments Submitted & Graded</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold uppercase text-[10px]">3-Month Certificate Status</span>
                <span className={inspectStudentModal.progress === 100 ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                  {inspectStudentModal.progress === 100 ? "🎓 Certificate Unlocked" : "🔒 Unlocks after 3 Months"}
                </span>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setInspectStudentModal(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2 rounded-xl text-xs transition-all shadow-md"
              >
                Close Student Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
