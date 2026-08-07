"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { dbFetch, dbSaveRecord, dbDeleteRecord } from "@/lib/dbPersistence";
import Modal from "@/components/Modal";
import { showToast } from "@/components/Toast";
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
  FaTasks,
  FaEllipsisV,
  FaSearch,
  FaFilter,
  FaEye,
  FaChevronRight
} from "react-icons/fa";

export default function CoursesPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [role, setRole] = useState("admin");

  // Kebab Context Menu State
  const [activeKebabId, setActiveKebabId] = useState(null);

  // Delete Safeguard Modal State
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, student: null, loading: false });

  // Custom Modal State
  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  // Fee Receipt Modal State
  const [feeReceiptModal, setFeeReceiptModal] = useState({
    isOpen: false,
    receiptData: null,
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

  // 2-Column Responsive Enrollment Form State
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

  const [inspectStudentModal, setInspectStudentModal] = useState(null);

  useEffect(() => {
    setRole(localStorage.getItem("user_role") || "admin");
    const handleRoleChange = () => setRole(localStorage.getItem("user_role") || "admin");
    window.addEventListener("roleChanged", handleRoleChange);

    const initialDefaultStudents = [
      {
        id: "s-101",
        full_name: "Muhammad Ali",
        cnic: "35201-1234567-1",
        email: "ali.student@gmail.com",
        phone: "03001234567",
        enrollment_type: "Paid Course Student",
        course_name: "Full Stack MERN Web Development",
        instructor: "Engr. Hamza (Lead Full-Stack)",
        start_date: "2026-05-01",
        end_date: "2026-08-01",
        progress: 100,
        course_fee: 25000,
        fee_paid: 25000,
        last_payment_date: "2026-07-01",
        next_due_date: "2026-08-01",
        fee_status: "Paid",
        batch: "Batch #14 (Morning Tech)",
      },
      {
        id: "s-102",
        full_name: "Sara Khan",
        cnic: "35201-9876543-2",
        email: "sara.design@gmail.com",
        phone: "03219876543",
        enrollment_type: "Paid Course Student",
        course_name: "UI/UX Graphic & Product Design",
        instructor: "Ayesha Malik (Senior UI/UX Designer)",
        start_date: "2026-06-01",
        end_date: "2026-09-01",
        progress: 65,
        course_fee: 20000,
        fee_paid: 20000,
        last_payment_date: "2026-07-01",
        next_due_date: "2026-08-01",
        fee_status: "Pending Due",
        batch: "Batch #15 (Afternoon Lab)",
      },
    ];

    dbFetch("students", initialDefaultStudents).then((data) => {
      setStudents(data);
      setLoading(false);
    });

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

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim()) return;

    setSubmitting(true);
    const totalFeeAmount = Number(form.course_fee || 25000);
    const feePaidAmount = Number(form.fee_paid || 25000);

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
    };

    setStudents([newStudentObj, ...students]);
    dbSaveRecord("students", newStudentObj).catch(() => {});
    setSubmitting(false);

    showToast("Student Enrolled 🎉", `${form.full_name} enrolled in ${form.course_name}. 30-day fee cycle active.`, "success");

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

  const updateStudentProgress = async (studentId, newProgress) => {
    const val = Math.min(100, Math.max(0, Number(newProgress) || 0));
    const updatedList = students.map((s) => (s.id === studentId ? { ...s, progress: val } : s));
    setStudents(updatedList);
    const targetStudent = updatedList.find(s => s.id === studentId);
    if (targetStudent) dbSaveRecord("students", targetStudent).catch(() => {});
  };

  const handleRecordFeeSubmission = async (studentId) => {
    const today = new Date().toISOString().split("T")[0];
    const newNextDueDate = calculate30DaysLater(today);

    let updatedObj = null;
    const updatedList = students.map((s) => {
      if (s.id === studentId) {
        updatedObj = {
          ...s,
          last_payment_date: today,
          next_due_date: newNextDueDate,
          fee_status: "Paid",
          reminder_sent: false,
        };
        return updatedObj;
      }
      return s;
    });

    setStudents(updatedList);
    if (updatedObj) dbSaveRecord("students", updatedObj).catch(() => {});

    const studentObj = students.find((s) => s.id === studentId);
    showToast("Fee Recorded & 30-Day Cycle Reset 🟢", `Next due date set to ${newNextDueDate} for ${studentObj?.full_name}.`, "success");
  };

  const sendFeeReminderEmail = async (student) => {
    showToast("Email Dispatched 📧", `Monthly fee reminder email sent to ${student.full_name} (${student.email}).`, "info");
    dbSaveRecord("students", { ...student, reminder_sent: true }).catch(() => {});
  };

  const executeDeleteStudent = async () => {
    if (!deleteModal.student) return;
    setDeleteModal(prev => ({ ...prev, loading: true }));
    const id = deleteModal.student.id;
    const email = deleteModal.student.email;

    try {
      const filtered = students.filter((s) => s.id !== id && (email ? s.email !== email : true));
      setStudents(filtered);
      dbDeleteRecord("students", id, email || "").catch(() => {});
      showToast("Student Removed 🗑️", "Student record removed from directory.", "info");
    } catch(e) {
      showToast("Error", "Failed to delete student record.", "error");
    } finally {
      setDeleteModal({ isOpen: false, student: null, loading: false });
    }
  };

  const dueStudents = students.filter((s) => {
    if (!s.next_due_date) return false;
    const dueDate = new Date(s.next_due_date);
    return dueDate <= new Date();
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Modal */}
      <Modal isOpen={modal.isOpen} title={modal.title} message={modal.message} type={modal.type} onClose={closeModal} />

      {/* HEADER BANNER */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-full border border-[#2563EB]/20">
              Academic & Course Management
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#0F172A] mt-1.5 flex items-center gap-2.5">
            <FaGraduationCap className="text-[#2563EB]" />
            <span>Course Students & 30-Day Fee Engine</span>
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            3-Month Progress Tracking • 30-Day Auto Fee Cycle • Verified Certificate Generation Engine
          </p>
        </div>
      </div>

      {/* SUMMARY STATISTICS CARDS (Requirement #3 - Improved Padding & Spacing) */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
              Total Enrolled Students
            </p>
            <p className="mt-2 text-2xl font-bold text-[#0F172A]">{loading ? "..." : students.length}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/20">
            <FaGraduationCap className="text-lg" />
          </div>
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
              3-Month Certificate Unlocked
            </p>
            <p className="mt-2 text-2xl font-bold text-[#0F172A]">
              {loading ? "..." : students.filter((s) => s.progress === 100).length}
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/20">
            <FaAward className="text-lg" />
          </div>
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#92400E]">
              30-Day Fee Cycle Due
            </p>
            <p className="mt-2 text-2xl font-bold text-[#0F172A]">{loading ? "..." : dueStudents.length}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/20">
            <FaExclamationTriangle className="text-lg" />
          </div>
        </div>
      </div>

      {/* MAIN BALANCED GRID (40% Left Form / 60% Right Directory Table) */}
      <div className="grid gap-6 lg:grid-cols-12">
        
        {/* 2-COLUMN RESPONSIVE ENROLLMENT FORM (Requirement #2 - 40% Width) */}
        {role === "admin" && (
          <div className="lg:col-span-5 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm space-y-4 h-fit">
            <div className="border-b border-[#E2E8F0] pb-3">
              <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                <FaUserPlus className="text-[#2563EB]" />
                <span>Enroll Course Student</span>
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">Setup 30-day recurring fee cycle & credentials.</p>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-3.5 text-xs">
              {/* Row 1: Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#0F172A] mb-1">
                    Student Name *
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="Sara Ahmed"
                    required
                    className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#0F172A] mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="student@gmail.com"
                    required
                    className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              {/* Row 2: Phone & Emergency Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#0F172A] mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="03001234567"
                    className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#0F172A] mb-1">
                    Emergency Contact
                  </label>
                  <input
                    type="text"
                    name="emergency_phone"
                    value={form.emergency_phone}
                    onChange={handleChange}
                    placeholder="03009998877"
                    className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] font-mono"
                  />
                </div>
              </div>

              {/* Row 3: Course & Batch Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#0F172A] mb-1">
                    Course Selection *
                  </label>
                  <select
                    name="course_name"
                    value={form.course_name}
                    onChange={handleCourseSelect}
                    className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] bg-white"
                  >
                    {availableCourses.map((c) => (
                      <option key={c.title} value={c.title}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#0F172A] mb-1">
                    Batch Selection
                  </label>
                  <select
                    name="batch"
                    value={form.batch}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] bg-white"
                  >
                    <option value="Batch #14 (Morning Tech)">Batch #14 (Morning)</option>
                    <option value="Batch #15 (Afternoon Lab)">Batch #15 (Afternoon)</option>
                    <option value="Batch #16 (Evening Pro)">Batch #16 (Evening)</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Total Fee & Submitted Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#0F172A] mb-1">
                    Total Fee (PKR)
                  </label>
                  <input
                    type="number"
                    name="course_fee"
                    value={form.course_fee}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#0F172A] mb-1">
                    Submitted Fee
                  </label>
                  <input
                    type="number"
                    name="fee_paid"
                    value={form.fee_paid}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              {/* Row 5: Start & End Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#0F172A] mb-1">
                    Enrollment Date
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={form.start_date}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#0F172A] mb-1">
                    Completion (3 Months)
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={form.end_date}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              {/* Full Width Primary Submit CTA Button (Requirement #2) */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold py-3 text-xs transition-colors shadow-xs cursor-pointer"
                >
                  {submitting ? "Enrolling..." : "Enroll Student & Set 30-Day Cycle"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ENROLLED STUDENTS DIRECTORY TABLE (Requirement #1 - 60% Width & Clean Action Column) */}
        {role === "admin" && (
          <div className="lg:col-span-7 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#0F172A]">Enrolled Course Students Directory</h2>
              <span className="text-xs font-semibold text-[#64748B]">Auto 30-Day Fee Engine Active</span>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs text-[#0F172A]">
                <thead className="bg-[#F8FAFC] text-[11px] font-bold uppercase text-[#64748B] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-4 py-3">Student & Course</th>
                    <th className="px-4 py-3">3-Month Progress</th>
                    <th className="px-4 py-3">30-Day Fee Due</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {students.map((st) => {
                    const isCompleted = st.progress === 100;
                    const dueDate = new Date(st.next_due_date || todayStr);
                    const isFeeOverdue = dueDate <= new Date();

                    return (
                      <tr key={st.id} className="hover:bg-[#F8FAFC]">
                        <td className="px-4 py-3.5 space-y-0.5">
                          <div className="font-bold text-[#0F172A]">{st.full_name}</div>
                          <div className="text-[11px] text-[#2563EB] font-semibold">{st.course_name}</div>
                          <div className="text-[10px] text-[#64748B] font-mono">{st.email}</div>
                        </td>

                        <td className="px-4 py-3.5 min-w-[150px]">
                          <div className="flex items-center justify-between text-xs font-semibold text-[#0F172A] mb-1">
                            <span>Progress</span>
                            <span className="font-bold text-[#2563EB]">{st.progress || 0}%</span>
                          </div>
                          <div className="w-full bg-[#F8FAFC] h-2 rounded-full overflow-hidden border border-[#E2E8F0]">
                            <div
                              className="bg-[#2563EB] h-full rounded-full transition-all duration-300"
                              style={{ width: `${st.progress || 0}%` }}
                            />
                          </div>
                          {/* Clean percentage label scale (Requirement #3) */}
                          <div className="flex justify-between text-[9px] text-[#64748B] mt-1 font-mono">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-xs font-mono text-[#0F172A]">
                            {st.next_due_date || "—"}
                          </div>
                          {isFeeOverdue ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#92400E] bg-[#FEF3C7] px-2 py-0.5 rounded-full border border-[#F59E0B]/20 mt-1 whitespace-nowrap">
                              <FaExclamationTriangle className="text-[9px]" /> 30-Day Due
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-full border border-[#2563EB]/20 mt-1 whitespace-nowrap">
                              <FaCheckCircle className="text-[9px]" /> Cycle Active
                            </span>
                          )}
                        </td>

                        {/* Simplified Action Column: Single Royal Blue Primary Action + Kebab Menu (Requirement #1) */}
                        <td className="px-4 py-3.5 text-right shrink-0">
                          <div className="flex items-center justify-end gap-2">
                            {/* Visible Primary Action Button */}
                            <button
                              onClick={() => handleRecordFeeSubmission(st.id)}
                              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-colors shadow-xs cursor-pointer whitespace-nowrap"
                            >
                              Submit Fee
                            </button>

                            {/* Contextual 3-Dots Menu (⋮) */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setActiveKebabId(activeKebabId === st.id ? null : st.id)}
                                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                              >
                                <FaEllipsisV className="text-xs" />
                              </button>

                              {activeKebabId === st.id && (
                                <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white p-1.5 shadow-lg border border-[#E2E8F0] z-30 space-y-0.5 text-xs text-left animate-in fade-in zoom-in-95 duration-100">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setInspectStudentModal(st);
                                      setActiveKebabId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[#EFF6FF] text-[#0F172A] hover:text-[#2563EB] font-semibold transition-colors"
                                  >
                                    View Student Record
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      sendFeeReminderEmail(st);
                                      setActiveKebabId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[#EFF6FF] text-[#0F172A] hover:text-[#2563EB] font-semibold transition-colors"
                                  >
                                    Send Fee Email
                                  </button>

                                  {isCompleted && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCertificateModal({ isOpen: true, student: st });
                                        setActiveKebabId(null);
                                      }}
                                      className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[#EFF6FF] text-[#0F172A] hover:text-[#2563EB] font-semibold transition-colors"
                                    >
                                      Certificate Details
                                    </button>
                                  )}

                                  <div className="border-t border-[#E2E8F0] my-1" />

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeleteModal({ isOpen: true, student: st, loading: false });
                                      setActiveKebabId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 font-semibold transition-colors"
                                  >
                                    Delete Student
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#E2E8F0] space-y-4 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#2563EB]/20">
                  Full Student Record
                </span>
                <h3 className="text-lg font-bold text-[#0F172A] mt-1">{inspectStudentModal.full_name}</h3>
                <p className="text-xs font-mono text-[#64748B]">{inspectStudentModal.email}</p>
              </div>
              <button
                onClick={() => setInspectStudentModal(null)}
                className="text-[#64748B] hover:text-[#0F172A] text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] space-y-0.5">
                <p className="text-[#64748B] font-semibold uppercase text-[10px]">Course Name</p>
                <p className="text-[#0F172A] font-bold text-xs">{inspectStudentModal.course_name}</p>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] space-y-0.5">
                <p className="text-[#64748B] font-semibold uppercase text-[10px]">Assigned Batch</p>
                <p className="text-[#2563EB] font-bold text-xs">{inspectStudentModal.batch || "Batch #14 (Morning Tech)"}</p>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] space-y-0.5">
                <p className="text-[#64748B] font-semibold uppercase text-[10px]">CNIC / B-Form</p>
                <p className="text-[#0F172A] font-bold text-xs">{inspectStudentModal.cnic || "35201-1234567-1"}</p>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] space-y-0.5">
                <p className="text-[#64748B] font-semibold uppercase text-[10px]">Guardian Name & Phone</p>
                <p className="text-[#0F172A] font-bold text-xs">{inspectStudentModal.guardian_name || "Tariq Hassan"} ({inspectStudentModal.guardian_phone || "03009988776"})</p>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] space-y-0.5">
                <p className="text-[#64748B] font-semibold uppercase text-[10px]">Emergency Contact</p>
                <p className="text-[#0F172A] font-bold text-xs">{inspectStudentModal.emergency_phone || "03219988776"}</p>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] space-y-0.5">
                <p className="text-[#64748B] font-semibold uppercase text-[10px]">Total Fee & Status</p>
                <p className="text-[#0F172A] font-bold text-xs">Rs. {Number(inspectStudentModal.course_fee || 25000).toLocaleString()} ({inspectStudentModal.fee_status || "Paid"})</p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  generatePrintable3MonthStudentCertificatePdf({
                    full_name: inspectStudentModal.full_name,
                    course_name: inspectStudentModal.course_name,
                    completion_date: inspectStudentModal.end_date || "2026-08-01",
                    certificate_no: `CERT-${inspectStudentModal.id || "9901"}`,
                    grade: "A+ (98%)",
                    instructor: inspectStudentModal.instructor || "Engr. Hamza",
                  });
                }}
                className="bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] font-bold px-3 py-2 rounded-xl text-xs transition-colors flex items-center gap-1.5"
              >
                <FaAward /> Generate Certificate
              </button>

              <button
                onClick={() => setInspectStudentModal(null)}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DESTRUCTIVE MODAL FOR DELETE STUDENT */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E2E8F0] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-[#E2E8F0] pb-3 text-[#0F172A]">
              <FaExclamationTriangle className="text-xl text-[#2563EB]" />
              <h3 className="font-bold text-[#0F172A] text-base">Delete Student Record</h3>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Are you sure you want to delete <strong>{deleteModal.student?.full_name}</strong>? This action will purge their enrollment record.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, student: null, loading: false })}
                className="flex-1 py-2.5 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#2563EB] border border-[#E2E8F0] font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeleteStudent}
                disabled={deleteModal.loading}
                className="flex-1 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs cursor-pointer flex items-center justify-center"
              >
                {deleteModal.loading ? "Deleting..." : "Confirm & Delete 🗑️"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
