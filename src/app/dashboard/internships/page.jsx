"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { dbFetch, dbSaveRecord, dbDeleteRecord } from "@/lib/dbPersistence";
import Modal from "@/components/Modal";
import ScrollableTabs from "@/components/ScrollableTabs";
import Link from "next/link";
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
} from "react-icons/fa";

export default function InternshipsPage() {
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterMode, setFilterMode] = useState("All");
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
    intern: null,
  });

  // Daily Progress Log Input State
  const [dailyLogText, setDailyLogText] = useState("");
  const [selectedInternId, setSelectedInternId] = useState(null);

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
      mentor: "Engr. Hamza (Lead Full-Stack)",
      resources: "https://github.com/softwarehouse/mern-internship-tasks",
    },
    {
      title: "Python & AI Data Science",
      mentor: "Dr. Bilal Ahmed (AI Specialist)",
      resources: "https://drive.google.com/drive/folders/ai-internship-labs",
    },
    {
      title: "UI/UX Graphic & Product Design",
      mentor: "Ayesha Malik (Senior Designer)",
      resources: "https://figma.com/@softwarehouse-interns",
    },
    {
      title: "Flutter Mobile App Development",
      mentor: "Usman Raza (Mobile Apps Lead)",
      resources: "https://github.com/softwarehouse/flutter-internship-tasks",
    },
  ];

  // Internship Registration Form State
  const [form, setForm] = useState({
    full_name: "",
    cnic: "",
    email: "",
    phone: "",
    internship_mode: "On-Site / Offline", // 'On-Site / Offline' or 'Remote (Work From Home)'
    course_name: "Full Stack MERN Web Development",
    instructor: "Engr. Hamza (Lead Full-Stack)",
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

  // Fetch 3-Month Free Interns with Permanent Local Storage Sync
  const fetchInterns = async () => {
    setLoading(true);
    const demoData = [
      {
        id: "i-101",
        full_name: "Muhammad Ali",
        cnic: "35202-1234567-1",
        email: "ali.intern@gmail.com",
        phone: "03001234567",
        internship_mode: "On-Site / Offline",
        enrollment_type: "3-Month Free Internship",
        course_name: "Full Stack MERN Web Development",
        instructor: "Engr. Hamza (Lead Full-Stack)",
        resources_url: "https://github.com/softwarehouse/mern-internship-tasks",
        screen_access_url: "",
        start_date: "2026-05-01",
        end_date: "2026-08-01",
        progress: 100,
        course_fee: 0,
        fee_paid: 0,
        daily_logs: [
          {
            id: "l-1",
            date: "2026-07-31 15:00",
            author: "Muhammad Ali (On-Site Intern)",
            task: "Completed Redux Store Toolkit integration and Supabase Row Level Security policies.",
          },
        ],
      },
      {
        id: "i-102",
        full_name: "Bilal Hassan",
        cnic: "35201-8888888-3",
        email: "bilal.remote@gmail.com",
        phone: "03217778899",
        internship_mode: "Remote (Work From Home)",
        enrollment_type: "3-Month Free Internship",
        course_name: "Python & AI Data Science",
        instructor: "Dr. Bilal Ahmed (AI Specialist)",
        resources_url: "https://drive.google.com/drive/folders/ai-internship-labs",
        screen_access_url: "https://meet.google.com/abc-defg-hij",
        start_date: "2026-06-01",
        end_date: "2026-09-01",
        progress: 50,
        course_fee: 0,
        fee_paid: 0,
        daily_logs: [
          {
            id: "l-2",
            date: "2026-07-31 17:30",
            author: "Bilal Hassan (Remote Intern)",
            task: "Trained PyTorch Data Model and shared screen stream for mentor inspection.",
          },
        ],
      },
    ];

    // Read blacklisted deleted IDs/emails/names
    let deletedIds = [];
    try {
      const d = localStorage.getItem("deleted_intern_ids");
      if (d) deletedIds = JSON.parse(d);
    } catch (e) {}

    const isDeleted = (item) => {
      if (!item) return true;
      const itemId = String(item.id || "").toLowerCase().trim();
      const itemEmail = String(item.email || "").toLowerCase().trim();
      const itemName = String(item.full_name || item.name || "").toLowerCase().trim();

      if (deletedIds.some(d => {
        const del = String(d).toLowerCase().trim();
        if (!del) return false;
        return (itemId && itemId === del) || (itemEmail && itemEmail === del) || (itemName && itemName === del) || (itemName && del && itemName.includes(del));
      })) {
        return true;
      }
      return false;
    };

    // Read stored items from localStorage (Single Source of Truth)
    let stored = null;
    try {
      const s = localStorage.getItem("persistent_interns");
      if (s !== null) stored = JSON.parse(s);
    } catch (e) {}

    let finalList = [];
    if (stored !== null) {
      // User has persistent_interns stored! Use stored list directly so DELETED items STAY DELETED!
      finalList = stored.filter(i => !isDeleted(i));
    } else {
      // First time initialization ONLY
      finalList = demoData.filter(i => !isDeleted(i));
      localStorage.setItem("persistent_interns", JSON.stringify(finalList));
    }

    setInterns(finalList);
    setLoading(false);
  };

  useEffect(() => {
    fetchInterns();
  }, []);

  // Open Internship Certificate Modal & Print Handler
  const openCertificate = (intern) => {
    setCertificateModal({ isOpen: true, intern });
  };

  const printCertificate = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // Register 3-Month Free Intern (On-Site vs Remote)
  const handleAddIntern = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.email) {
      showAlert("Missing Fields", "Please enter Intern Name and Email.", "warning");
      return;
    }

    setSubmitting(true);

    const isRemoteMode = form.internship_mode.includes("Remote");

    const newInternObj = {
      id: `i-${Date.now()}`,
      full_name: form.full_name,
      cnic: form.cnic,
      email: form.email,
      phone: form.phone,
      internship_mode: form.internship_mode,
      is_remote: isRemoteMode,
      work_mode: form.internship_mode,
      enrollment_type: "3-Month Free Internship",
      course_name: form.course_name,
      instructor: form.instructor,
      resources_url: form.resources_url,
      screen_access_url: form.screen_access_url,
      start_date: form.start_date,
      end_date: form.end_date,
      progress: Number(form.progress || 0),
      course_fee: 0,
      fee_paid: 0,
      daily_logs: [
        {
          id: `l-${Date.now()}`,
          date: new Date().toLocaleString(),
          author: `${form.full_name} (${isRemoteMode ? "Remote Intern" : "On-Site Intern"})`,
          task: `Enrolled in ${form.internship_mode} 3-Month Free Internship for ${form.course_name}. Training started.`,
        },
      ],
    };

    // Save to Permanent LocalStorage immediately
    const currentList = [newInternObj, ...interns];
    setInterns(currentList);
    try {
      localStorage.setItem("persistent_interns", JSON.stringify(currentList));
    } catch (e) {}

    // Save to PostgreSQL / Supabase Database via Persistence Engine Proxy
    try {
      await dbSaveRecord("students", newInternObj);
    } catch (dbErr) {
      console.warn("Database save notice:", dbErr);
    }

    // Auto-save credentials & user profile for registered remote intern
    const userCredentials = {
      fullName: form.full_name,
      email: form.email,
      password: "internpassword", // Default access password provided by Admin
      role: "employee",
      department: form.course_name,
      is_remote: isRemoteMode,
      work_mode: form.internship_mode,
    };

    try {
      const saved = localStorage.getItem("registered_system_users");
      const existing = saved ? JSON.parse(saved) : [];
      const updated = [...existing.filter(u => u.email.toLowerCase() !== form.email.toLowerCase()), userCredentials];
      localStorage.setItem("registered_system_users", JSON.stringify(updated));
    } catch(e) {}

    // Dispatch global dataChanged event to sync Remote Monitoring Portal
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("dataChanged"));
    }

    setSubmitting(false);

    showAlert(
      "Free Intern Enrolled & Login Credentials Created! 🟢",
      `Intern: ${form.full_name}\nEmail: ${form.email}\nDefault Password: internpassword\n\nLogin credentials created! The intern can now log in at /login with their registered email to view their attendance, leaves, and progress.`,
      "success"
    );

    setForm({
      full_name: "",
      cnic: "",
      email: "",
      phone: "",
      internship_mode: "On-Site / Offline",
      course_name: "Full Stack MERN Web Development",
      instructor: "Engr. Hamza (Lead Full-Stack)",
      resources_url: "https://github.com/softwarehouse/mern-internship-tasks",
      screen_access_url: "https://meet.google.com/abc-defg-hij",
      start_date: todayStr,
      end_date: threeMonthsLaterStr,
      progress: 0,
    });
  };

  // Post Daily Work Progress Log
  const postDailyLog = (internId) => {
    if (!dailyLogText) {
      showAlert("Empty Work Log", "Please type your daily task work progress details.", "warning");
      return;
    }

    const updated = interns.map((i) => {
      if (i.id === internId) {
        const newLog = {
          id: `l-${Date.now()}`,
          date: new Date().toLocaleString(),
          author: `${i.full_name} (${i.internship_mode?.includes("Remote") ? "Remote Intern" : "On-Site Intern"})`,
          task: dailyLogText,
        };
        const currentLogs = i.daily_logs || [];
        return {
          ...i,
          daily_logs: [newLog, ...currentLogs],
        };
      }
      return i;
    });

    setInterns(updated);
    try {
      localStorage.setItem("persistent_interns", JSON.stringify(updated));
    } catch (e) {}

    setDailyLogText("");
    setSelectedInternId(null);
    showAlert("Daily Progress Logged!", "Work progress update has been saved to your timeline log!", "success");
  };

  // Update Progress (0-100%)
  const updateInternProgress = async (id, newProgress) => {
    const pVal = Number(newProgress);
    const updated = interns.map((i) => (i.id === id ? { ...i, progress: pVal } : i));
    setInterns(updated);
    const targetIntern = updated.find(i => i.id === id);
    if (targetIntern) dbSaveRecord("students", targetIntern).catch(() => {});
  };

  // Delete Single Intern
  const handleDeleteIntern = async (id) => {
    if (!confirm("Are you sure you want to delete this intern record?")) return;
    const target = interns.find(i => i.id === id);
    const targetEmail = (target?.email || "").toLowerCase().trim();
    const targetName = (target?.full_name || target?.name || "").toLowerCase().trim();

    const updated = interns.filter((i) => {
      const iId = String(i.id || "").toLowerCase().trim();
      const iEmail = String(i.email || "").toLowerCase().trim();
      const iName = String(i.full_name || i.name || "").toLowerCase().trim();
      if (id && iId === String(id).toLowerCase().trim()) return false;
      if (targetEmail && iEmail === targetEmail) return false;
      if (targetName && iName === targetName) return false;
      return true;
    });
    setInterns(updated);

    // 1. Update persistent_interns
    try {
      localStorage.setItem("persistent_interns", JSON.stringify(updated));
    } catch(e) {}

    // 2. Remove from persistent_courses
    try {
      const savedCourses = localStorage.getItem("persistent_courses");
      if (savedCourses) {
        const currentCourses = JSON.parse(savedCourses);
        const filteredCourses = currentCourses.filter(c => c.id !== id && (c.email || "").toLowerCase().trim() !== targetEmail);
        localStorage.setItem("persistent_courses", JSON.stringify(filteredCourses));
      }
    } catch(e) {}

    // 3. Remove from registered_system_users
    try {
      const savedUsers = localStorage.getItem("registered_system_users");
      if (savedUsers) {
        const currentUsers = JSON.parse(savedUsers);
        const filteredUsers = currentUsers.filter(u => (u.email || "").toLowerCase().trim() !== targetEmail);
        localStorage.setItem("registered_system_users", JSON.stringify(filteredUsers));
      }
    } catch(e) {}

    // 4. Add target ID, email, and name to permanent blacklist
    try {
      const savedDeleted = localStorage.getItem("deleted_intern_ids");
      let deletedList = savedDeleted ? JSON.parse(savedDeleted) : [];
      if (id && !deletedList.includes(String(id))) {
        deletedList.push(String(id));
      }
      if (targetEmail && !deletedList.includes(targetEmail)) {
        deletedList.push(targetEmail);
      }
      if (targetName && !deletedList.includes(targetName)) {
        deletedList.push(targetName);
      }
      localStorage.setItem("deleted_intern_ids", JSON.stringify(deletedList));
    } catch(e) {}

    // 5. Delete from DB & sync dataChanged event
    await dbDeleteRecord("students", id, targetEmail).catch(() => {});
    await dbDeleteRecord("interns", id, targetEmail).catch(() => {});
  };

  // 1-Click Clear ALL Interns
  const handleClearAllInterns = async () => {
    if (!confirm("⚠️ Are you sure you want to CLEAR ALL INTERN RECORDS? This will delete all intern entries permanently!")) return;

    try {
      const savedDeleted = localStorage.getItem("deleted_intern_ids");
      let deletedList = savedDeleted ? JSON.parse(savedDeleted) : [];

      interns.forEach(i => {
        if (i.id) deletedList.push(String(i.id).toLowerCase());
        if (i.email) deletedList.push(i.email.toLowerCase().trim());
        if (i.full_name) deletedList.push(i.full_name.toLowerCase().trim());
      });

      localStorage.setItem("deleted_intern_ids", JSON.stringify(deletedList));
      localStorage.setItem("persistent_interns", JSON.stringify([]));

      // Also clean persistent_courses
      const savedCourses = localStorage.getItem("persistent_courses");
      if (savedCourses) {
        const currentCourses = JSON.parse(savedCourses);
        const filteredCourses = currentCourses.filter(c => c.enrollment_type !== "3-Month Free Internship");
        localStorage.setItem("persistent_courses", JSON.stringify(filteredCourses));
      }
    } catch(e) {}

    setInterns([]);

    try {
      await supabase.from("students").delete().eq("enrollment_type", "3-Month Free Internship").catch(() => {});
    } catch(e) {}

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("dataChanged"));
    }

    showAlert("Intern Directory Cleared 🗑️", "All intern records have been wiped clean permanently.", "info");
  };

  const currentUserEmail = typeof window !== "undefined" ? localStorage.getItem("current_user_email") || "" : "";

  const filteredInterns = interns.filter((i) => {
    // Non-admin isolation: User only sees their OWN internship record!
    if (role !== "admin") {
      if (currentUserEmail) {
        const userPrefix = currentUserEmail.split("@")[0].toLowerCase();
        const internEmail = (i.email || "").toLowerCase();
        const internName = (i.full_name || "").toLowerCase();
        if (!internEmail.includes(userPrefix) && !internName.includes(userPrefix)) {
          return false;
        }
      }
    }

    if (filterMode === "All") return true;
    if (filterMode === "On-Site") return !i.internship_mode?.includes("Remote");
    if (filterMode === "Remote") return i.internship_mode?.includes("Remote");
    return true;
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
      {certificateModal.isOpen && certificateModal.intern && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-8 shadow-2xl border-4 border-amber-400 space-y-6 relative print:p-0 print:border-none print:shadow-none">
            <button
              onClick={() => setCertificateModal({ isOpen: false, intern: null })}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-2 print:hidden"
            >
              <FaTimes className="text-lg" />
            </button>

            <div className="border-2 border-slate-900 p-8 rounded-2xl text-center space-y-6 bg-slate-50/50">
              <div className="flex items-center justify-center gap-3">
                <img src="/logo.jpeg" alt="Logo" className="h-12 w-12 rounded-xl object-cover border border-slate-300" />
                <div className="text-left">
                  <h2 className="text-lg font-bold text-slate-900 leading-tight">Software House</h2>
                  <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">
                    Official Internship & Experience Academy
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs uppercase font-bold text-amber-600 tracking-widest">
                  3-Month Internship & Work Experience Award
                </p>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  INTERNSHIP EXPERIENCE CERTIFICATE
                </h1>
                <p className="text-xs text-slate-500 italic">This is proudly presented to</p>
              </div>

              <div className="border-b-2 border-amber-400 pb-2 max-w-md mx-auto">
                <h3 className="text-2xl font-bold text-blue-800 font-serif">
                  {certificateModal.intern.full_name}
                </h3>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed max-w-xl mx-auto">
                for successfully completing the official{" "}
                <span className="font-bold text-slate-900">
                  3-Month Professional {certificateModal.intern.internship_mode?.includes("Remote") ? "Remote (Work From Home)" : "Practical On-Site"} Internship
                </span>{" "}
                in <span className="font-bold text-slate-900">{certificateModal.intern.course_name}</span> under the supervision of{" "}
                <span className="font-bold text-blue-700">{certificateModal.intern.instructor || "Lead Mentor"}</span>.
              </p>

              <div className="pt-6 border-t border-slate-200 grid grid-cols-3 items-center text-xs">
                <div>
                  <div className="font-bold text-slate-800">{certificateModal.intern.start_date || "2026-05-01"}</div>
                  <div className="text-[11px] text-slate-500">Start Date</div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 border border-amber-300 text-amber-700 text-xl shadow-xs">
                    <FaAward />
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 uppercase mt-1">Certified Official</span>
                </div>

                <div>
                  <div className="font-bold text-slate-800">{certificateModal.intern.end_date || todayStr}</div>
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
          <FaLaptopCode className="text-blue-600" />
          <span>3-Month Free Internships (On-Site & Remote Screen Stream)</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Support for On-Site (Office IP) vs Remote (Live Screen Access Stream Link) Internships
        </p>
      </div>

      {/* Quick Actions Navigation Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/dashboard/attendance"
          className="rounded-xl border border-blue-200 bg-blue-50/80 p-4 flex items-center gap-3.5 hover:bg-blue-100/80 transition-all shadow-xs group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
            <FaWifi className="text-lg" />
          </div>
          <div>
            <div className="text-xs font-bold text-blue-900 group-hover:text-blue-700">Office IP Attendance</div>
            <div className="text-[11px] text-blue-700">For On-Site Interns (Office Wi-Fi IP)</div>
          </div>
        </Link>

        <div className="rounded-xl border border-indigo-200 bg-indigo-50/80 p-4 flex items-center gap-3.5 shadow-xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold">
            <FaDesktop className="text-lg" />
          </div>
          <div>
            <div className="text-xs font-bold text-indigo-900">Remote Screen Access Stream</div>
            <div className="text-[11px] text-indigo-700">Inspect remote interns live working screen</div>
          </div>
        </div>

        <Link
          href="/dashboard/leaves"
          className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 flex items-center gap-3.5 hover:bg-amber-100/80 transition-all shadow-xs group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-600 text-white font-bold">
            <FaUserClock className="text-lg" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-900 group-hover:text-amber-700">Apply for Leave</div>
            <div className="text-[11px] text-amber-700">Submit emergency leave requests</div>
          </div>
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Registration Form (Admin Only) */}
        {role === "admin" && (
          <div className="lg:col-span-1 rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 h-fit">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <FaUserPlus className="text-blue-600" />
              <span>Enroll Free Intern (On-Site / Remote)</span>
            </h2>

            {/* Mode Switcher Buttons */}
            <ScrollableTabs>
              <button
                type="button"
                onClick={() => setForm({ ...form, internship_mode: "On-Site / Offline" })}
                className={`flex-1 py-2 px-4 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  form.internship_mode === "On-Site / Offline"
                    ? "bg-blue-600 text-white shadow-xs border border-blue-500"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200"
                }`}
              >
                <FaBuilding className="text-xs" /> On-Site
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, internship_mode: "Remote (Work From Home)" })}
                className={`flex-1 py-2 px-4 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  form.internship_mode === "Remote (Work From Home)"
                    ? "bg-indigo-600 text-white shadow-xs border border-indigo-500"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200"
                }`}
              >
                <FaHome className="text-xs" /> Remote
              </button>
            </ScrollableTabs>

            <form onSubmit={handleAddIntern} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Intern Full Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="e.g. Muhammad Ali"
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
                  placeholder="35202-1234567-1"
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
                    placeholder="intern@gmail.com"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="03001234567"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Screen Access Stream Link (For Remote Interns) */}
              {form.internship_mode.includes("Remote") && (
                <div>
                  <label className="block text-xs font-semibold uppercase text-indigo-700 mb-1 flex items-center gap-1">
                    <FaDesktop /> Remote Screen Access Link / Meet URL *
                  </label>
                  <input
                    type="text"
                    name="screen_access_url"
                    value={form.screen_access_url}
                    onChange={handleChange}
                    placeholder="https://meet.google.com/abc-defg-hij or AnyDesk ID"
                    required={form.internship_mode.includes("Remote")}
                    className="w-full rounded-lg border border-indigo-300 bg-indigo-50/50 px-3.5 py-2 text-xs text-indigo-900 font-mono outline-none focus:border-indigo-600"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Internship Tech Domain *
                </label>
                <select
                  name="course_name"
                  value={form.course_name}
                  onChange={handleDomainSelect}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
                >
                  {availableDomains.map((d) => (
                    <option key={d.title} value={d.title}>
                      {d.title} (FREE 3-Month Internship)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Start Date
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
                    End Date (3 Months)
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

              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-bold flex items-center gap-2">
                <FaCheckCircle className="text-emerald-600 text-base" />
                <span>100% FREE 3-Month Internship (0 PKR Fee)</span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
              >
                {submitting ? "Enrolling..." : `Enroll ${form.internship_mode.includes("Remote") ? "Remote" : "On-Site"} Intern`}
              </button>
            </form>
          </div>
        )}

        {/* Interns Directory */}
        <div className={role === "admin" ? "lg:col-span-2 space-y-5" : "lg:col-span-3 space-y-5"}>
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FaLaptopCode className="text-blue-600" />
              <span>3-Month Free Interns Directory</span>
            </h2>

            <div className="flex items-center gap-2 shrink-0">
              {role === "admin" && (
                <button
                  type="button"
                  onClick={handleClearAllInterns}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold px-3 py-1.5 rounded-lg border border-rose-200 text-xs transition-all flex items-center gap-1 cursor-pointer"
                  title="Clear all intern entries from database"
                >
                  <FaTrash className="text-xs" /> <span>Clear All Records 🗑️</span>
                </button>
              )}

              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 outline-none bg-white focus:border-blue-600 font-medium"
              >
                <option value="All">All Internship Modes</option>
                <option value="On-Site">On-Site (Office IP) Only</option>
                <option value="Remote">Remote (Screen Stream Shared) Only</option>
              </select>
            </div>
          </div>

          {filteredInterns.length > 0 ? (
            filteredInterns.map((st) => {
              const isRemote = st.internship_mode?.includes("Remote");
              const isCompleted = st.progress === 100;
              const is3MonthsMatured = new Date(st.end_date || "2026-08-01") <= new Date();
              const isCertificateUnlocked = isCompleted && is3MonthsMatured;
              const dailyLogs = st.daily_logs || [];

              return (
                <div key={st.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">{st.full_name}</h3>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-0.5 rounded-md border ${
                            isRemote
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {isRemote ? <FaHome /> : <FaBuilding />}
                          <span>{isRemote ? "Remote (Work From Home)" : "On-Site (Office IP)"}</span>
                        </span>
                      </div>

                      <div className="text-xs text-blue-600 font-bold mt-0.5">{st.course_name}</div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>Email: {st.email}</span>
                        {st.cnic && <span className="font-mono text-slate-700">CNIC: {st.cnic}</span>}
                        <span className="font-semibold text-slate-700">Mentor: {st.instructor || "Lead Mentor"}</span>
                        <span>Duration: {st.start_date} to {st.end_date}</span>
                      </div>
                    </div>

                    {/* Actions & Certificate */}
                    <div className="text-right flex flex-col items-end gap-2">
                      {/* Live Screen Access Stream Link for Remote Interns */}
                      {isRemote && st.screen_access_url && (
                        <a
                          href={st.screen_access_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors"
                          title="Inspect Remote Intern's Live Working Screen Stream"
                        >
                          <FaDesktop />
                          <span>Inspect Live Screen Stream</span>
                          <FaExternalLinkAlt className="text-[10px]" />
                        </a>
                      )}

                      {isCertificateUnlocked ? (
                        <button
                          onClick={() => openCertificate(st)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors cursor-pointer"
                        >
                          <FaAward />
                          <span>Download Certificate</span>
                        </button>
                      ) : (
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                            🔒 Certificate Locked
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Unlocks after 3 Months ({st.end_date})
                          </div>
                        </div>
                      )}

                      {role === "admin" && (
                        <button
                          onClick={() => handleDeleteIntern(st.id)}
                          className="text-[11px] font-semibold text-rose-600 hover:underline"
                        >
                          Delete Intern Record
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span>3-Month Internship Completion Progress</span>
                      <span className={isCompleted ? "text-emerald-700 font-extrabold" : "text-blue-700 font-bold"}>
                        {st.progress || 0}% Complete
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className={isCompleted ? "bg-emerald-500 h-full rounded-full transition-all duration-300" : "bg-blue-600 h-full rounded-full transition-all duration-300"}
                        style={{ width: `${st.progress || 0}%` }}
                      />
                    </div>

                    {role === "admin" && (
                      <div className="pt-1 flex items-center gap-3">
                        <span className="text-xs text-slate-500 font-semibold">Update Progress %:</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={st.progress || 0}
                          onChange={(e) => updateInternProgress(st.id, e.target.value)}
                          className="w-48 accent-blue-600 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>

                  {/* Daily Progress Logger */}
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-3">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <FaPaperPlane className="text-blue-600" />
                      <span>Post Daily Work Progress Update ({isRemote ? "Remote Log" : "On-Site Log"})</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={selectedInternId === st.id ? dailyLogText : ""}
                        onChange={(e) => {
                          setSelectedInternId(st.id);
                          setDailyLogText(e.target.value);
                        }}
                        placeholder="Type today's work completed (e.g. Day 22: Built Supabase Auth & responsive UI)..."
                        className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 bg-white"
                      />
                      <button
                        onClick={() => postDailyLog(st.id)}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-xs"
                      >
                        Post Log
                      </button>
                    </div>
                  </div>

                  {/* Daily Progress Feed */}
                  <div className="space-y-3 pt-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <FaHistory className="text-blue-600" />
                      <span>Daily Work Progress History Feed</span>
                    </h4>

                    <div className="space-y-2">
                      {dailyLogs.length > 0 ? (
                        dailyLogs.map((log) => (
                          <div key={log.id} className="rounded-lg bg-slate-50/70 p-3 border border-slate-200 text-xs space-y-1">
                            <div className="flex items-center justify-between font-bold text-slate-800">
                              <span>{log.author}</span>
                              <span className="text-[11px] font-mono text-slate-400">{log.date}</span>
                            </div>
                            <p className="text-slate-600 leading-relaxed">{log.task}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-400 italic py-1">
                          No daily work progress logs recorded yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400 text-xs">
              No 3-Month Free Interns enrolled matching selected mode filter.
            </div>
          )}
        </div>
      </div>

      {/* OFFICIAL 3-MONTH INTERNSHIP CERTIFICATE MODAL */}
      {certificateModal.isOpen && certificateModal.intern && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-8 shadow-2xl space-y-6 border-4 border-amber-500 text-slate-900 relative">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-amber-700 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                  Official Completion Certificate
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Verified & Issued
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={printCertificate}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                >
                  <FaPrint /> <span>Print / Save PDF Certificate</span>
                </button>
                <button
                  onClick={() => setCertificateModal({ isOpen: false, intern: null })}
                  className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* CERTIFICATE CANVAS TEMPLATE */}
            <div className="p-8 border-8 border-double border-amber-600 bg-amber-50/30 rounded-2xl text-center space-y-6 shadow-inner print:p-0 print:border-none print:bg-white">
              <div className="flex items-center justify-center gap-3">
                <img src="/logo.jpeg" alt="Company Logo" className="h-14 w-14 rounded-xl border border-slate-300 shadow-md object-cover" />
                <div className="text-left">
                  <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">Nexa Innovation and Technology</h2>
                  <p className="text-xs text-slate-600 font-extrabold uppercase tracking-widest">Official Certificate of Internship Completion</p>
                </div>
              </div>

              <div className="space-y-2 py-4">
                <p className="text-xs font-serif italic text-slate-600">This is to proudly certify that</p>
                <h1 className="text-3xl font-black text-amber-950 underline decoration-amber-500 decoration-2 underline-offset-8">
                  {certificateModal.intern.full_name}
                </h1>
                <p className="text-xs text-slate-600 font-mono mt-1">CNIC / ID: {certificateModal.intern.cnic || "31202-9876543-1"}</p>
              </div>

              <p className="text-sm text-slate-800 leading-relaxed max-w-xl mx-auto font-medium">
                has successfully completed the <strong>3-Month Free Professional Internship</strong> in{" "}
                <span className="font-extrabold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">{certificateModal.intern.course_name}</span>{" "}
                ({certificateModal.intern.internship_mode || "On-Site"}) with outstanding performance, practical project contributions, and software development standards.
              </p>

              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-amber-200 text-xs">
                <div>
                  <p className="text-slate-500 text-[10px] font-bold uppercase">Internship Period</p>
                  <p className="font-bold text-slate-900">{certificateModal.intern.start_date} to {certificateModal.intern.end_date}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] font-bold uppercase">Instructor / Supervisor</p>
                  <p className="font-bold text-slate-900">{certificateModal.intern.instructor || "Software House Lead"}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] font-bold uppercase">Certificate ID</p>
                  <p className="font-mono font-bold text-amber-800">NEXA-INT-2026-{(certificateModal.intern.id || "").replace(/[^0-9]/g, "") || "8921"}</p>
                </div>
              </div>

              <div className="pt-4 flex justify-between items-end border-t border-slate-300 text-xs">
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-400">ISSUING AUTHORITY</p>
                  <p className="font-extrabold text-slate-900">Director of Engineering & Technology</p>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-300 font-extrabold text-xs">
                  <FaAward className="text-emerald-700 text-base" /> Verified Authentic Certificate
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
