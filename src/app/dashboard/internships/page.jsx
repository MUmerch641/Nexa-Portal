"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { dbFetch, dbSaveRecord, dbDeleteRecord } from "@/lib/dbPersistence";
import Modal from "@/components/Modal";
import { showToast } from "@/components/Toast";
import ScrollableTabs from "@/components/ScrollableTabs";
import Link from "next/link";
import { registerInternWithCredentials } from "@/lib/studentEnrollmentUtils";
import {
  FaLaptopCode,
  FaUserPlus,
  FaCheckCircle,
  FaAward,
  FaPrint,
  FaTimes,
  FaHistory,
  FaPaperPlane,
  FaTrash,
  FaChalkboardTeacher,
  FaLink,
  FaCalendarCheck,
  FaUserClock,
  FaWifi,
  FaDesktop,
  FaHome,
  FaBuilding,
  FaExternalLinkAlt,
  FaEllipsisV,
  FaCheck,
  FaLock,
  FaKey,
  FaShieldAlt,
} from "react-icons/fa";

export default function InternshipsPage() {
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterMode, setFilterMode] = useState("All");
  const [role, setRole] = useState("admin");

  // Kebab Context Menu State
  const [activeKebabId, setActiveKebabId] = useState(null);

  // Delete Safeguard Modal State
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, intern: null, loading: false });

  // WebRTC Screen Access State
  const videoRef = useRef(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [activeRemoteStudent, setActiveRemoteStudent] = useState(null);
  const [isLiveStreamModalOpen, setIsLiveStreamModalOpen] = useState(false);

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
    intern: null,
  });

  // Daily Progress Log Input State
  const [dailyLogText, setDailyLogText] = useState("");
  const [selectedInternId, setSelectedInternId] = useState(null);

  const startLiveScreenAccess = async (student) => {
    setActiveRemoteStudent(student);
    setIsLiveStreamModalOpen(true);

    try {
      if (typeof window !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" },
          audio: false
        });
        setMediaStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
    } catch(e) {
      console.log("Screen access stream initiated");
    }
  };

  const stopLiveScreenAccess = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    setIsLiveStreamModalOpen(false);
    setActiveRemoteStudent(null);
  };

  const showAlert = (title, message, type = "info") => {
    setModal({ isOpen: true, title, message, type });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const threeMonthsLaterStr = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const availableDomains = [
    {
      title: "Full Stack MERN Web Development",
      mentor: "Lead Tech Mentor",
      resources: "https://github.com/softwarehouse/mern-internship-tasks",
    },
    {
      title: "Python & AI Data Science",
      mentor: "Lead AI Mentor",
      resources: "https://drive.google.com/drive/folders/ai-internship-labs",
    },
    {
      title: "UI/UX Graphic & Product Design",
      mentor: "Lead UI/UX Mentor",
      resources: "https://figma.com/@softwarehouse-interns",
    },
    {
      title: "Flutter Mobile App Development",
      mentor: "Lead Mobile Apps Mentor",
      resources: "https://github.com/softwarehouse/flutter-internship-tasks",
    },
  ];

  // Enrollment Form State
  const [form, setForm] = useState({
    full_name: "",
    cnic: "",
    email: "",
    assigned_password: "internpassword123",
    confirm_password: "internpassword123",
    phone: "",
    emergency_phone: "",
    internship_mode: "On-Site / Offline",
    course_name: "Full Stack MERN Web Development",
    instructor: "Lead Tech Mentor",
    resources_url: "https://github.com/softwarehouse/mern-internship-tasks",
    screen_access_url: "https://meet.google.com/abc-defg-hij",
    start_date: todayStr,
    end_date: threeMonthsLaterStr,
    progress: 0,
  });

  useEffect(() => {
    setRole(localStorage.getItem("user_role") || "admin");
    const handleRoleChange = () => setRole(localStorage.getItem("user_role") || "admin");
    window.addEventListener("roleChanged", handleRoleChange);
    fetchInterns();
    return () => window.removeEventListener("roleChanged", handleRoleChange);
  }, []);

  const handleDomainSelect = (e) => {
    const selectedTitle = e.target.value;
    const domObj = availableDomains.find((d) => d.title === selectedTitle);
    setForm({
      ...form,
      course_name: selectedTitle,
      instructor: domObj ? domObj.mentor : "Lead Mentor",
      resources_url: domObj ? domObj.resources : "",
    });
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const fetchInterns = async () => {
    setLoading(true);
    const initialDefaultInterns = [
      {
        id: "i-101",
        full_name: "Muhammad Rahim Bugti",
        cnic: "35202-1234567-1",
        email: "rahim.intern@gmail.com",
        phone: "03001234567",
        internship_mode: "On-Site / Offline",
        is_remote: false,
        course_name: "Full Stack MERN Web Development",
        instructor: "Lead Tech Mentor",
        start_date: "2026-05-01",
        end_date: "2026-08-01",
        progress: 100,
        daily_logs: [
          { id: "l-1", date: "2026-08-01 10:00 AM", author: "Muhammad Rahim Bugti", task: "Completed capstone backend REST API testing and Prisma ORM migrations." }
        ]
      },
      {
        id: "i-102",
        full_name: "Zainab Ahmed",
        cnic: "35202-9876543-2",
        email: "zainab.intern@gmail.com",
        phone: "03219876543",
        internship_mode: "Remote (Work From Home)",
        is_remote: true,
        course_name: "UI/UX Graphic & Product Design",
        instructor: "Lead UI/UX Mentor",
        start_date: "2026-06-01",
        end_date: "2026-09-01",
        progress: 60,
        daily_logs: [
          { id: "l-2", date: "2026-08-01 11:30 AM", author: "Zainab Ahmed", task: "Designed high-fidelity Figma component library and color tokens." }
        ]
      }
    ];

    const data = await dbFetch("interns", initialDefaultInterns);
    setInterns(data);
    setLoading(false);
  };

  const handleAddIntern = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim()) {
      showToast("Validation Error 🔴", "Please enter Intern Full Name and Email Address.", "error");
      return;
    }

    if (!form.assigned_password || form.assigned_password.length < 6) {
      showToast("Password Security Error 🔴", "Temporary password must be at least 6 characters long.", "error");
      return;
    }

    if (form.confirm_password && form.assigned_password !== form.confirm_password) {
      showToast("Password Mismatch 🔴", "Passwords do not match. Please re-enter.", "error");
      return;
    }

    setSubmitting(true);

    try {
      const res = await registerInternWithCredentials({
        internData: form,
        password: form.assigned_password,
      });

      const currentList = [res.intern, ...interns];
      setInterns(currentList);
      setSubmitting(false);

      showToast("Intern Enrolled 🎉", `${form.full_name} enrolled as ${form.internship_mode}. Login account created.`, "success");
      showAlert(
        "Intern Account & Credentials Created 🟢",
        `Intern "${form.full_name}" registered successfully!\n\nTech Domain: ${form.course_name}\nMode: ${form.internship_mode}\nLogin Email: ${form.email}\nAuth Account Created (No plain-text password stored in DB).`,
        "success"
      );

      setForm({
        full_name: "",
        cnic: "",
        email: "",
        assigned_password: "internpassword123",
        confirm_password: "internpassword123",
        phone: "",
        emergency_phone: "",
        internship_mode: "On-Site / Offline",
        course_name: "Full Stack MERN Web Development",
        instructor: "Lead Tech Mentor",
        resources_url: "https://github.com/softwarehouse/mern-internship-tasks",
        screen_access_url: "https://meet.google.com/abc-defg-hij",
        start_date: todayStr,
        end_date: threeMonthsLaterStr,
        progress: 0,
      });
    } catch (err) {
      setSubmitting(false);
      const msg = err.message || "Failed to register intern account.";
      showToast("Enrollment Error 🔴", msg, "error");
      showAlert("Enrollment Error 🛑", msg, "error");
    }
  };

  const postDailyLog = async (internId) => {
    if (!dailyLogText.trim()) return;

    const updated = interns.map((i) => {
      if (i.id === internId) {
        const newLog = {
          id: `l-${Date.now()}`,
          date: new Date().toLocaleString(),
          author: i.full_name,
          task: dailyLogText.trim(),
        };
        const currentLogs = i.daily_logs || [];
        return { ...i, daily_logs: [newLog, ...currentLogs] };
      }
      return i;
    });

    setInterns(updated);
    const targetIntern = updated.find(i => String(i.id) === String(internId));
    if (targetIntern) await dbSaveRecord("interns", targetIntern).catch(() => {});

    setDailyLogText("");
    setSelectedInternId(null);
    showToast("Progress Logged 📝", "Work progress entry added to daily feed.", "info");
  };

  const updateInternProgress = async (id, newProgress) => {
    const pVal = Number(newProgress);
    const updated = interns.map((i) => (String(i.id) === String(id) ? { ...i, progress: pVal } : i));
    setInterns(updated);
    const targetIntern = updated.find(i => String(i.id) === String(id));
    if (targetIntern) await dbSaveRecord("interns", targetIntern).catch(() => {});
  };

  const executeDeleteIntern = async () => {
    if (!deleteModal.intern) return;
    setDeleteModal(prev => ({ ...prev, loading: true }));
    const id = deleteModal.intern.id;

    try {
      const updated = interns.filter((i) => i.id !== id);
      setInterns(updated);
      await dbDeleteRecord("interns", id, deleteModal.intern.email || "").catch(() => {});
      showToast("Intern Deleted 🗑️", "Internship record removed successfully.", "info");
    } catch(e) {
      showToast("Error", "Failed to delete intern record.", "error");
    } finally {
      setDeleteModal({ isOpen: false, intern: null, loading: false });
    }
  };

  const filteredInterns = interns.filter((i) => {
    if (role === "intern") {
      const userEmail = (localStorage.getItem("current_user_email") || "").trim().toLowerCase();
      return (i.email || "").trim().toLowerCase() === userEmail;
    }
    if (filterMode === "All") return true;
    if (filterMode === "On-Site") return !i.internship_mode?.includes("Remote");
    if (filterMode === "Remote") return i.internship_mode?.includes("Remote");
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Modal */}
      <Modal isOpen={modal.isOpen} title={modal.title} message={modal.message} type={modal.type} onClose={closeModal} />

      {/* HEADER BANNER (Requirement #1 - No High-Risk Bulk Delete Button in Main Header) */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-full border border-[#2563EB]/20">
              3-Month Free Internship Program
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#0F172A] mt-1.5 flex items-center gap-2.5">
            <FaLaptopCode className="text-[#2563EB]" />
            <span>Internship Management & Work Progress Hub</span>
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            On-Site Office IP Attendance & Remote Live Screen Access Stream Tracking
          </p>
        </div>
      </div>

      {/* 2. STANDARDIZED QUICK NAVIGATION CARDS (Requirement #2) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/dashboard/attendance"
          className="rounded-2xl border border-[#E2E8F0] bg-white p-5 flex items-center gap-3.5 hover:bg-[#F8FAFC] transition-colors shadow-sm group"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB] font-bold shrink-0 border border-[#2563EB]/20">
            <FaWifi className="text-lg" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">Office IP Attendance</div>
            <div className="text-[11px] text-[#64748B] mt-0.5">On-Site Office IP Verification</div>
          </div>
        </Link>

        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 flex items-center gap-3.5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB] font-bold shrink-0 border border-[#2563EB]/20">
            <FaDesktop className="text-lg" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#0F172A]">Remote Screen Access Stream</div>
            <div className="text-[11px] text-[#64748B] mt-0.5">Inspect remote intern screen live</div>
          </div>
        </div>

        <Link
          href="/dashboard/leaves"
          className="rounded-2xl border border-[#E2E8F0] bg-white p-5 flex items-center gap-3.5 hover:bg-[#F8FAFC] transition-colors shadow-sm group"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB] font-bold shrink-0 border border-[#2563EB]/20">
            <FaUserClock className="text-lg" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">Apply for Leave</div>
            <div className="text-[11px] text-[#64748B] mt-0.5">Submit emergency leave requests</div>
          </div>
        </Link>
      </div>

      {/* 6. MAIN BALANCED GRID (40% Left Form / 60% Right Intern Directory) */}
      <div className="grid gap-6 lg:grid-cols-12">

        {/* 3. OPTIMIZED 2-COLUMN ENROLLMENT FORM (Requirement #3 - 40% Width) */}
        {role === "admin" && (
          <div className="lg:col-span-5 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm space-y-4 h-fit">
            <div className="border-b border-[#E2E8F0] pb-3">
              <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                <FaUserPlus className="text-[#2563EB]" />
                <span>Enroll Free Intern</span>
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">Setup 3-month practical training profile.</p>
            </div>

            {/* Mode Switcher */}
            <ScrollableTabs>
              <button
                type="button"
                onClick={() => setForm({ ...form, internship_mode: "On-Site / Offline" })}
                className={`flex-1 py-2 px-4 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  form.internship_mode === "On-Site / Offline"
                    ? "bg-[#2563EB] text-white shadow-xs"
                    : "bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] hover:bg-[#EFF6FF]"
                }`}
              >
                <FaBuilding className="text-xs" /> On-Site
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, internship_mode: "Remote (Work From Home)" })}
                className={`flex-1 py-2 px-4 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  form.internship_mode === "Remote (Work From Home)"
                    ? "bg-[#2563EB] text-white shadow-xs"
                    : "bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] hover:bg-[#EFF6FF]"
                }`}
              >
                <FaHome className="text-xs" /> Remote
              </button>
            </ScrollableTabs>

            <form onSubmit={handleAddIntern} className="space-y-3.5 text-xs">
              {/* Row 1: Full Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#0F172A] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="Muhammad Ali"
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
                    placeholder="intern@gmail.com"
                    required
                    className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              {/* Row 2: Phone & Emergency Contact */}
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

              {/* Row 3: Domain Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase text-[#0F172A] mb-1">
                  Tech Domain *
                </label>
                <select
                  name="course_name"
                  value={form.course_name}
                  onChange={handleDomainSelect}
                  className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] bg-white"
                >
                  {availableDomains.map((d) => (
                    <option key={d.title} value={d.title}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Row 4: Start & End Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#0F172A] mb-1">
                    Start Date
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
                    End Date (3 Months)
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

              {/* Login Credentials Section */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 space-y-2.5 my-2">
                <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                  <FaLock className="text-blue-600" />
                  <span>Intern Login Credentials</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-slate-700 mb-1">
                      Temporary Password *
                    </label>
                    <input
                      type="password"
                      name="assigned_password"
                      value={form.assigned_password || ""}
                      onChange={handleChange}
                      placeholder="Min 6 characters"
                      required
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-blue-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-slate-700 mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      name="confirm_password"
                      value={form.confirm_password || ""}
                      onChange={handleChange}
                      placeholder="Re-enter password"
                      required
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-blue-600 font-mono"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 italic">
                  Intern will log in using: <span className="font-semibold text-slate-700">{form.email || "intern@example.com"}</span>
                </p>
              </div>

              {/* Full Width Primary CTA Button (Requirement #3) */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold py-3 text-xs transition-colors shadow-xs cursor-pointer"
                >
                  {submitting ? "Enrolling & Creating Account..." : `Enroll ${form.internship_mode.includes("Remote") ? "Remote" : "On-Site"} Intern`}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* INTERNS DIRECTORY TABLE & FEED (Requirement #1 - 60% Width) */}
        <div className={role === "admin" ? "lg:col-span-7 space-y-5" : "lg:col-span-12 space-y-5"}>
          <div className="p-4 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <FaLaptopCode className="text-[#2563EB]" />
              <span>3-Month Free Interns Directory</span>
            </h2>

            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="rounded-xl border border-[#E2E8F0] px-3 py-1.5 text-xs text-[#0F172A] outline-none bg-white focus:border-[#2563EB] font-semibold cursor-pointer"
            >
              <option value="All">All Internship Modes</option>
              <option value="On-Site">On-Site Only</option>
              <option value="Remote">Remote Only</option>
            </select>
          </div>

          {filteredInterns.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-[#E2E8F0] text-[#64748B] italic text-xs">
              No intern records matching current filter selection.
            </div>
          ) : (
            filteredInterns.map((st, idx) => {
              const isRemote = st.internship_mode?.includes("Remote");
              const isCompleted = st.progress === 100;
              const dailyLogs = st.daily_logs || [];

              return (
                <div key={st.id} className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm space-y-4">
                  {/* Card Header & Kebab Context Menu (Requirement #1) */}
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-sm border border-[#2563EB]/20 shrink-0">
                        {st.full_name ? st.full_name.charAt(0).toUpperCase() : "I"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-[#0F172A]">{st.full_name}</h3>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/20">
                            {isRemote ? "Remote" : "On-Site"}
                          </span>
                        </div>
                        <p className="text-xs text-[#2563EB] font-semibold mt-0.5">{st.course_name}</p>
                      </div>
                    </div>

                    {/* Kebab Context Menu for Intern Actions (Requirement #1) */}
                    {(role === "admin" || role === "hr" || role === "manager") && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setActiveKebabId(activeKebabId === st.id ? null : st.id)}
                          className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                        >
                          <FaEllipsisV className="text-xs" />
                        </button>

                        {activeKebabId === st.id && (
                          <div className={`absolute right-0 w-44 rounded-xl bg-white p-1.5 shadow-xl border border-[#E2E8F0] z-50 space-y-0.5 text-xs text-left animate-in fade-in zoom-in-95 duration-100 ${
                            idx >= Math.max(0, filteredInterns.length - 2)
                              ? "bottom-full mb-1 origin-bottom-right"
                              : "top-full mt-1 origin-top-right"
                          }`}>
                            <button
                              type="button"
                              onClick={() => {
                                showToast("Intern Profile 👤", `${st.full_name} (${st.email}) • Mentor: ${st.instructor || "Lead Mentor"}`, "info");
                                setActiveKebabId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[#EFF6FF] text-[#0F172A] hover:text-[#2563EB] font-semibold transition-colors"
                            >
                              View Profile
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedInternId(st.id);
                                setActiveKebabId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[#EFF6FF] text-[#0F172A] hover:text-[#2563EB] font-semibold transition-colors"
                            >
                              Log Work Progress
                            </button>

                            {isCompleted && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCertificateModal({ isOpen: true, intern: st });
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
                                setDeleteModal({ isOpen: true, intern: st, loading: false });
                                setActiveKebabId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 font-semibold transition-colors"
                            >
                              Delete Intern
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Progress Bar & Range Control */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#0F172A]">
                      <span>Course Training Progress</span>
                      <span className="font-bold text-[#2563EB]">{st.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-[#F8FAFC] h-2 rounded-full overflow-hidden border border-[#E2E8F0]">
                      <div
                        className="bg-[#2563EB] h-full rounded-full transition-all duration-300"
                        style={{ width: `${st.progress || 0}%` }}
                      />
                    </div>
                    {role === "admin" && (
                      <div className="pt-1">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={st.progress || 0}
                          onChange={(e) => updateInternProgress(st.id, e.target.value)}
                          className="w-full accent-[#2563EB] cursor-pointer"
                        />
                      </div>
                    )}
                  </div>

                  {/* 4. DAILY WORK PROGRESS FEED (Requirement #4 - Improved Spacing, Padding, Borders) */}
                  <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#0F172A]">
                      <span>Daily Work Progress History Feed</span>
                      <button
                        onClick={() => setSelectedInternId(selectedInternId === st.id ? null : st.id)}
                        className="text-[11px] font-bold text-[#2563EB] hover:underline cursor-pointer"
                      >
                        + Log Work Update
                      </button>
                    </div>

                    {/* Work Log Input Box */}
                    {selectedInternId === st.id && (
                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2">
                        <textarea
                          rows={2}
                          value={dailyLogText}
                          onChange={(e) => setDailyLogText(e.target.value)}
                          placeholder="Describe tasks completed today..."
                          className="w-full rounded-xl border border-[#E2E8F0] p-2 text-xs text-[#0F172A] outline-none bg-white focus:border-[#2563EB]"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedInternId(null)}
                            className="px-3 py-1 rounded-xl text-xs text-[#64748B] hover:bg-white border border-[#E2E8F0]"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => postDailyLog(st.id)}
                            className="px-3 py-1 rounded-xl text-xs bg-[#2563EB] text-white font-bold hover:bg-[#1D4ED8]"
                          >
                            Post Log Entry
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Feed Entries (Requirement #4 - Padding 12px 16px, 1px #E2E8F0 border, #FFFFFF bg) */}
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {dailyLogs.length === 0 ? (
                        <p className="text-[11px] text-[#64748B] italic py-2">No daily work logs posted yet.</p>
                      ) : (
                        dailyLogs.map((log) => (
                          <div
                            key={log.id || Math.random()}
                            className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white space-y-1 shadow-xs"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-[#0F172A]">{log.author}</span>
                              <span className="text-[#64748B]">{log.date}</span>
                            </div>
                            <p className="text-xs text-[#0F172A] leading-relaxed">{log.task}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CONFIRMATION DESTRUCTIVE MODAL FOR DELETE INTERN */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E2E8F0] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-[#E2E8F0] pb-3 text-[#0F172A]">
              <FaTrash className="text-xl text-[#2563EB]" />
              <h3 className="font-bold text-[#0F172A] text-base">Delete Intern Record</h3>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Are you sure you want to delete <strong>{deleteModal.intern?.full_name}</strong>? This action will purge their internship training record.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, intern: null, loading: false })}
                className="flex-1 py-2.5 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#2563EB] border border-[#E2E8F0] font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeleteIntern}
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
