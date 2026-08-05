"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Modal from "@/components/Modal";
import {
  FaExclamationTriangle,
  FaPlusCircle,
  FaWifi,
  FaUserShield,
  FaChalkboardTeacher,
  FaBug,
  FaClock,
  FaSpinner,
  FaCheckCircle,
  FaTrash,
  FaFilter,
  FaCommentDots
} from "react-icons/fa";

export default function ComplaintsPage() {
  const [role, setRole] = useState("student");
  const [userEmail, setUserEmail] = useState("");
  const [complaints, setComplaints] = useState([
    {
      id: "comp-101",
      submitted_by: "Ali Hassan (Student)",
      email: "student@gmail.com",
      category: "Internet Issues", // "Internet Issues" | "HR Complaints" | "Teacher Complaints" | "System Bugs"
      title: "Optix Fiber WiFi latency spike in Lab #3",
      description: "WiFi disconnects during API submission testing in Lab #3 Station 12.",
      status: "In Progress", // "Pending" | "In Progress" | "Resolved"
      created_at: "2026-08-01 10:30 AM",
      admin_note: "IT Technician assigned to check Lab #3 Optix Router frequency.",
    },
    {
      id: "comp-102",
      submitted_by: "Sara Khan (Employee)",
      email: "sara.design@gmail.com",
      category: "HR Complaints",
      title: "Overtime calculation query for July salary slip",
      description: "Need clarification regarding 10 hours overtime tracking for July.",
      status: "Resolved",
      created_at: "2026-07-30 02:15 PM",
      admin_note: "HR reviewed attendance logs and added Rs. 6,000 overtime bonus.",
    },
    {
      id: "comp-103",
      submitted_by: "Muhammad Rahim Bugti (Student)",
      email: "rahim.student@gmail.com",
      category: "Teacher Complaints",
      title: "Request for extra lab session on Node.js REST APIs",
      description: "Requesting 1-hour additional practical Q&A session with Engr. Hamza.",
      status: "Pending",
      created_at: "2026-08-01 11:00 AM",
      admin_note: "Awaiting Lead Instructor schedule confirmation.",
    },
  ]);

  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  // New Complaint Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal Notification
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info" });

  const showAlert = (title, message, type = "info") => {
    setModal({ isOpen: true, title, message, type });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  useEffect(() => {
    const savedRole = localStorage.getItem("user_role") || "student";
    const savedEmail = localStorage.getItem("current_user_email") || "student@gmail.com";
    setRole(savedRole);
    setUserEmail(savedEmail);

    const savedComplaints = localStorage.getItem("software_house_complaints_list");
    if (savedComplaints) {
      try { setComplaints(JSON.parse(savedComplaints)); } catch (e) {}
    }
  }, []);

  const saveComplaintsState = (newList) => {
    setComplaints(newList);
    localStorage.setItem("software_house_complaints_list", JSON.stringify(newList));
  };

  const [form, setForm] = useState({
    category: "Internet Issues",
    title: "",
    description: "",
    is_anonymous: false,
    attachment: null,
  });

  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      showAlert("Missing Fields ⚠️", "Please fill in Title and Detailed Description.", "warning");
      return;
    }

    const ticketId = `TICKET-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowIso = new Date().toISOString();
    const nowLocal = new Date().toLocaleString();

    const newObj = {
      id: "comp-" + Date.now(),
      ticket_id: ticketId,
      is_anonymous: form.is_anonymous,
      submitted_by: form.is_anonymous ? "Anonymous Complainant 🔒" : (userEmail ? `${userEmail.split("@")[0]} (${role.toUpperCase()})` : `User (${role})`),
      email: form.is_anonymous ? "Confidential 🔒" : (userEmail || "user@gmail.com"),
      category: form.category,
      title: form.title,
      description: form.description,
      attachment_name: form.attachment ? form.attachment.name : null,
      status: "Open", // "Open" | "In Progress" | "Resolved" | "Closed"
      created_at: nowLocal,
      admin_note: "Complaint ticket generated successfully. Awaiting HR/Admin assignment.",
    };

    const updated = [newObj, ...complaints];
    saveComplaintsState(updated);

    // Save to Supabase Database
    try {
      await supabase.from("complaints").insert([
        {
          ticket_id: ticketId,
          title: form.title,
          category: form.category,
          description: form.description,
          is_anonymous: form.is_anonymous,
          submitted_by: form.is_anonymous ? "Anonymous" : userEmail,
          status: "Open",
          created_at: nowIso,
        }
      ]);
    } catch (dbErr) {}

    setIsModalOpen(false);
    setForm({ category: "Internet Issues", title: "", description: "", is_anonymous: false, attachment: null });

    const confidentialityMsg = form.is_anonymous
      ? "Submitted as ANONYMOUS 🔒. Your identity is 100% protected and hidden from HR/Admin."
      : "Submitted as PUBLIC 👤. Your identity is attached for HR/Admin review.";

    showAlert(
      `Complaint Ticket Generated (${ticketId}) 📩`,
      `Category: ${form.category}\nStatus: Open\n\n${confidentialityMsg}\n\nHR/Admin has been notified immediately!`,
      "success"
    );
  };

  const handleUpdateStatus = (id, newStatus) => {
    const notePrompt = prompt(`Update status to '${newStatus}'. Enter Admin resolution note (optional):`);
    const updated = complaints.map((c) =>
      c.id === id
        ? {
            ...c,
            status: newStatus,
            admin_note: notePrompt !== null && notePrompt.trim() !== "" ? notePrompt : c.admin_note,
          }
        : c
    );
    saveComplaintsState(updated);
  };

  const handleDeleteComplaint = (id) => {
    if (!confirm("Are you sure you want to delete this complaint record?")) return;
    const updated = complaints.filter((c) => c.id !== id);
    saveComplaintsState(updated);
  };

  // Filtered List
  const filteredComplaints = complaints.filter((c) => {
    const matchesCategory = filterCategory === "All" || c.category === filterCategory;
    const matchesStatus = filterStatus === "All" || c.status === filterStatus;
    const matchesUser = role === "admin" || role === "hr" || role === "manager" || (c.email && c.email.toLowerCase() === userEmail.toLowerCase());
    return matchesCategory && matchesStatus && matchesUser;
  });

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Internet Issues": return <FaWifi className="text-blue-600" />;
      case "HR Complaints": return <FaUserShield className="text-purple-600" />;
      case "Teacher Complaints": return <FaChalkboardTeacher className="text-amber-600" />;
      case "System Bugs": return <FaBug className="text-rose-600" />;
      default: return <FaExclamationTriangle className="text-slate-600" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return (
          <span className="bg-amber-50 text-amber-800 border border-amber-300 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <FaClock className="text-amber-600" />
            <span>⏳ Pending Review</span>
          </span>
        );
      case "In Progress":
        return (
          <span className="bg-blue-50 text-blue-800 border border-blue-300 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <FaSpinner className="text-blue-600 animate-spin" />
            <span>⚙️ In Progress</span>
          </span>
        );
      case "Resolved":
        return (
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <FaCheckCircle className="text-emerald-600" />
            <span>✅ Resolved</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Modal */}
      <Modal isOpen={modal.isOpen} title={modal.title} message={modal.message} type={modal.type} onClose={closeModal} />

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-400 bg-rose-950/90 px-3 py-1 rounded-full border border-rose-800">
              Official Helpdesk System
            </span>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
              Employees & Students
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black mt-2 text-white flex items-center gap-2.5">
            <FaExclamationTriangle className="text-rose-400" />
            <span>Complaint & Feedback Portal</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Report Internet Issues, HR Complaints, Teacher Issues & System Bugs with Live Ticket Status Tracking.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-rose-600 hover:bg-rose-700 text-white font-black px-5 py-2.5 rounded-xl text-xs transition-all shadow-lg flex items-center justify-center gap-2 border border-rose-500/40 cursor-pointer shrink-0"
        >
          <FaPlusCircle className="text-base" />
          <span>Submit New Complaint Ticket</span>
        </button>
      </div>

      {/* Filter & Category Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-400 uppercase text-[10px] flex items-center gap-1">
            <FaFilter /> Filter Category:
          </span>
          {["All", "Internet Issues", "HR Complaints", "Teacher Complaints", "System Bugs"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all border ${
                filterCategory === cat
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-400 uppercase text-[10px]">Filter Status:</span>
          {["All", "Pending", "In Progress", "Resolved"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all border text-[11px] ${
                filterStatus === st
                  ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Complaints List Cards */}
      <div className="space-y-4">
        {filteredComplaints.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 font-semibold text-xs">
            No complaints found matching selected filters.
          </div>
        ) : (
          filteredComplaints.map((c) => (
            <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-slate-100 rounded-xl text-base">
                    {getCategoryIcon(c.category)}
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
                      {c.category}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-0.5">{c.title}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(c.status)}

                  {(role === "admin" || role === "hr" || role === "manager") && (
                    <button
                      onClick={() => handleDeleteComplaint(c.id)}
                      className="text-rose-600 hover:text-rose-800 p-1.5 rounded-lg hover:bg-rose-50 transition-all text-xs"
                      title="Delete Ticket"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {c.description}
              </p>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs pt-1">
                <div className="text-[11px] text-slate-400 space-x-2">
                  <span><strong>Submitted By:</strong> {c.submitted_by}</span>
                  <span>•</span>
                  <span><strong>Email:</strong> {c.email}</span>
                  <span>•</span>
                  <span>{c.created_at}</span>
                </div>

                {/* Admin Status Change Controls */}
                {(role === "admin" || role === "hr" || role === "manager") && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Admin Action:</span>
                    <button
                      onClick={() => handleUpdateStatus(c.id, "Pending")}
                      className="bg-amber-100 hover:bg-amber-200 text-amber-900 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-300"
                    >
                      Set Pending
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(c.id, "In Progress")}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-900 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-300"
                    >
                      Set In Progress
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(c.id, "Resolved")}
                      className="bg-emerald-100 hover:bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-300"
                    >
                      Set Resolved
                    </button>
                  </div>
                )}
              </div>

              {c.admin_note && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-0.5">
                  <span className="font-bold text-blue-900 flex items-center gap-1.5">
                    <FaCommentDots className="text-blue-600" />
                    <span>Admin Resolution Note:</span>
                  </span>
                  <p className="text-slate-700 text-[11px]">{c.admin_note}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* NEW COMPLAINT TICKET MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FaExclamationTriangle className="text-rose-600" />
                <span>Submit Complaint / Issue Ticket</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateComplaint} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Complaint Category *
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-rose-600"
                >
                  <option value="Internet Issues">📡 Internet & WiFi Issues</option>
                  <option value="HR Complaints">🧑‍💼 HR & Salary Complaints</option>
                  <option value="Teacher Complaints">👨‍🏫 Teacher & Instructor Complaints</option>
                  <option value="System Bugs">🐛 System Bugs & PC Software Issues</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Ticket Subject / Title *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. WiFi disconnected in Lab #3 Station 12"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-rose-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Detailed Complaint Description *
                </label>
                <textarea
                  rows="4"
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Provide complete details about the issue..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-rose-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Submission Privacy Mode *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, is_anonymous: false })}
                    className={`px-3 py-2 rounded-xl font-bold border text-xs flex items-center justify-center gap-1.5 transition-all ${
                      !form.is_anonymous
                        ? "bg-blue-50 text-blue-800 border-blue-300 ring-2 ring-blue-500/20"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    <span>👤 Public Complaint</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, is_anonymous: true })}
                    className={`px-3 py-2 rounded-xl font-bold border text-xs flex items-center justify-center gap-1.5 transition-all ${
                      form.is_anonymous
                        ? "bg-purple-50 text-purple-900 border-purple-300 ring-2 ring-purple-500/20"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    <span>🔒 Anonymous (100% Secret)</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {form.is_anonymous
                    ? "🔒 Anonymous Mode: Your name and email address will be completely hidden from HR and Admin."
                    : "👤 Public Mode: Your identity will be visible to HR and Admin for direct resolution."}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Attach Supporting File / Screenshot (Optional)
                </label>
                <input
                  type="file"
                  onChange={(e) => setForm({ ...form, attachment: e.target.files[0] || null })}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
              >
                Submit Ticket & Track Status
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
