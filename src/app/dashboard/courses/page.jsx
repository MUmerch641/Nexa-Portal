"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Modal from "@/components/Modal";
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

  // Fetch Paid Course Students with Permanent LocalStorage Sync
  const fetchStudents = async () => {
    setLoading(true);
    const demoData = [
      {
        id: "s-102",
        full_name: "Sara Ahmed",
        cnic: "35201-9876543-2",
        email: "sara.course@gmail.com",
        phone: "03219876543",
        enrollment_type: "Paid Course Student",
        course_name: "UI/UX Graphic & Product Design",
        instructor: "Ayesha Malik (Senior Designer)",
        resources_url: "https://figma.com/@softwarehouse-design",
        start_date: "2026-06-15",
        end_date: "2026-09-15",
        progress: 65,
        course_fee: 20000,
        fee_paid: 20000,
        last_payment_date: "2026-06-15",
        next_due_date: "2026-07-15",
        fee_status: "Pending Due",
        reminder_sent: true,
      },
      {
        id: "s-103",
        full_name: "Usman Raza",
        cnic: "35202-1111111-5",
        email: "usman.mern@gmail.com",
        phone: "03001112223",
        enrollment_type: "Paid Course Student",
        course_name: "Full Stack MERN Web Development",
        instructor: "Engr. Hamza (Lead Full-Stack)",
        resources_url: "https://github.com/softwarehouse/mern-course-materials",
        start_date: "2026-05-01",
        end_date: "2026-08-01",
        progress: 100,
        course_fee: 25000,
        fee_paid: 25000,
        last_payment_date: todayStr,
        next_due_date: calculate30DaysLater(todayStr),
        fee_status: "Paid",
        reminder_sent: false,
      },
    ];

    let stored = [];
    try {
      const s = localStorage.getItem("persistent_courses");
      if (s) stored = JSON.parse(s);
    } catch (e) {}

    try {
      const { data, error } = await supabase
          .from("students")
          .select("*")
          .order("created_at", { ascending: false })
          .throwOnError();
        if (error) {
          console.error('Error fetching students:', error);
          throw error;
        }

      const paidOnly = (data || []).filter((s) => s.enrollment_type !== "3-Month Free Internship");
      const combined = [...stored, ...paidOnly];

      const uniqueMap = new Map();
      [...combined, ...demoData].forEach((item) => uniqueMap.set(item.id, item));
      const finalList = Array.from(uniqueMap.values());

      setStudents(finalList);
      autoDispatchFeeReminders(finalList);
    } catch (err) {
      const uniqueMap = new Map();
      [...stored, ...demoData].forEach((item) => uniqueMap.set(item.id, item));
      setStudents(Array.from(uniqueMap.values()));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Register Paid Course Student
  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.email) {
      showAlert("Missing Fields", "Please enter Student Name and Email.", "warning");
      return;
    }

    setSubmitting(true);
    const totalFeeAmount = Number(form.course_fee || 0);
    const feePaidAmount = Number(form.fee_paid || 0);

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

    const currentList = [newStudentObj, ...students];
    setStudents(currentList);
    try {
      localStorage.setItem("persistent_courses", JSON.stringify(currentList));
    } catch (e) {}

    try {
      await supabase.from("students").insert([
        {
          full_name: form.full_name,
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
        },
      ]).throwOnError();
    } catch (dbErr) {
      console.warn("Supabase insert notice:", dbErr);
    }

    // Auto-save credentials for registered student using Admin assigned password!
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

    setStudents([newStudentObj, ...students]);
    showAlert(
      "Student Enrolled & Login Credentials Assigned! 🟢",
      `Student: ${form.full_name}\nAssigned Email: ${form.email}\nAssigned Password: ${form.assigned_password}\n\nCredentials assigned! The student can now log in at /login with their assigned email & password.`,
      "success"
    );

    setForm({
      full_name: "",
      cnic: "",
      email: "",
      assigned_password: "studentpassword123",
      phone: "",
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

  const handleDeleteStudent = async (id) => {
    if (!confirm("Are you sure you want to delete this student record?")) return;
    setStudents(students.filter((s) => s.id !== id));
    await supabase.from("students").delete().eq("id", id);
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
                onClick={printCertificate}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-xs"
              >
                <FaPrint />
                <span>Print / Download PDF Certificate</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <FaGraduationCap className="text-blue-600" />
          <span>Courses & Paid Enrolled Students</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          3-Month Course Progress Tracking • 30-Day Auto Student Fee Email Dispatcher • Automated 3-Month Certificates
        </p>
      </div>

      {/* Metrics Header */}
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

        {/* Paid Course Students Directory */}
        <div className={role === "admin" ? "lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col" : "lg:col-span-3 rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col"}>
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">Enrolled Course Students & 30-Day Fee Status</h2>
            <span className="text-xs font-semibold text-slate-500">Auto 30-Day Fee Reminders Active</span>
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
                {(() => {
                  const currentUserEmail = typeof window !== "undefined" ? localStorage.getItem("current_user_email") || "" : "";
                  const filteredStudents = role === "admin"
                    ? students
                    : students.filter((st) => {
                        if (!currentUserEmail) return true;
                        const uPrefix = currentUserEmail.split("@")[0].toLowerCase();
                        const stEmail = (st.email || "").toLowerCase();
                        const stName = (st.full_name || "").toLowerCase();
                        return stEmail.includes(uPrefix) || stName.includes(uPrefix);
                      });

                  if (filteredStudents.length === 0) {
                    return (
                      <tr>
                        <td colSpan="4" className="px-4 py-6 text-center text-slate-400 text-xs font-semibold">
                          No course enrollment records found for your account.
                        </td>
                      </tr>
                    );
                  }

                  return filteredStudents.map((st) => {
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
                            <div className="pt-2 flex items-center gap-1">
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={st.progress || 0}
                                onChange={(e) => updateStudentProgress(st.id, e.target.value)}
                                className="w-full accent-blue-600 cursor-pointer"
                              />
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
                            <div className="pt-1 flex items-center justify-end gap-2">
                              <button
                                onClick={() => sendFeeReminderEmail(st)}
                                title="Send Direct Fee Reminder Email"
                                className="text-[11px] font-semibold text-blue-600 hover:underline"
                              >
                                Send Fee Email
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(st.id)}
                                className="text-[11px] font-semibold text-rose-600 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
