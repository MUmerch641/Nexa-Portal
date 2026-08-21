"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { showToast } from "@/components/Toast";
import {
  FaVideo,
  FaPlusCircle,
  FaCalendarAlt,
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaFileSignature,
  FaTasks,
  FaClock,
  FaUserCheck,
  FaUserTimes,
  FaStickyNote,
  FaTrash,
  FaLink,
  FaChalkboardTeacher,
  FaEllipsisV,
  FaExclamationTriangle
} from "react-icons/fa";

import { dbFetch, dbSaveList } from "@/lib/dbPersistence";

export default function MeetingsPage() {
  const [role, setRole] = useState("admin");
  const [userEmail, setUserEmail] = useState("");
  const initialMeetings = [];
  const [meetings, setMeetings] = useState([]);

  // Kebab Context Menu State
  const [activeKebabId, setActiveKebabId] = useState(null);

  // Delete Safeguard Modal State
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, meeting: null, loading: false });

  // Live Group Chat State
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInputText, setChatInputText] = useState("");
  
  // Invite Participant Modal State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmailInput, setInviteEmailInput] = useState("");

  // Create Meeting Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    host: "",
    date: new Date().toISOString().split("T")[0],
    time: "10:00 AM – 11:00 AM",
    platform: "Google Meet",
    attendee_type: "Both",
    location: "Google Meet / Online",
    meetUrl: "",
    invitedEmails: "",
    notes: "",
    actionItemsInput: "",
  });

  // Active Workspace Modal State
  const [activeMeetingModal, setActiveMeetingModal] = useState(null);
  const [newActionInput, setNewActionInput] = useState("");
  const [noteEditInput, setNoteEditInput] = useState("");

  // Custom Modal
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info" });

  const showAlert = (title, message, type = "info") => {
    setModal({ isOpen: true, title, message, type });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  useEffect(() => {
    const savedRole = localStorage.getItem("user_role") || "admin";
    const savedEmail = localStorage.getItem("current_user_email") || "";
    const savedName = localStorage.getItem("current_user_name") || savedEmail || "Lead Trainer";
    setRole(savedRole);
    setUserEmail(savedEmail);

    setForm((prev) => ({
      ...prev,
      host: prev.host || savedName,
    }));

    dbFetch("meetings", []).then(data => {
      // Filter out any stale demo meetings containing "Engr. Hamza" or demo IDs
      const cleanData = (data || []).filter(m =>
        m &&
        !m.host?.includes("Engr. Hamza") &&
        m.id !== "meet-101" &&
        m.id !== "meet-102"
      );
      setMeetings(cleanData);
      dbSaveList("meetings", cleanData);
    });
  }, []);

  const saveMeetingsState = (newList) => {
    setMeetings(newList);
    dbSaveList("meetings", newList);
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date || !form.time || !form.meetUrl.trim()) {
      showToast("Missing Fields ⚠️", "Please fill in Title, Date, Time, and Meeting Link.", "warning");
      return;
    }

    const todayZero = new Date();
    todayZero.setHours(0, 0, 0, 0);
    const selectedDate = new Date(form.date);
    if (selectedDate < todayZero) {
      showToast("Invalid Date 🛑", "Meeting date cannot be in the past.", "warning");
      return;
    }

    const isDuplicate = meetings.some(
      (m) =>
        m.title.trim().toLowerCase() === form.title.trim().toLowerCase() &&
        m.date === form.date &&
        m.time.trim().toLowerCase() === form.time.trim().toLowerCase()
    );

    if (isDuplicate) {
      showToast("Duplicate Error 🛑", "A meeting with identical title, date, and time already exists.", "error");
      return;
    }

    const emailList = form.invitedEmails.split(",").map((e) => e.trim()).filter(Boolean);
    const participantObjs = emailList.map((email) => ({
      name: email.split("@")[0],
      email: email,
      attendance: "Pending",
    }));

    const parsedActionItems = form.actionItemsInput
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((itemStr, idx) => ({
        id: `act-${Date.now()}-${idx}`,
        item: itemStr,
        assignedTo: emailList[0] || userEmail,
        status: "Pending",
      }));

    const newMeeting = {
      id: "meet-" + Date.now(),
      title: form.title,
      host: form.host || userEmail || "Lead Trainer",
      date: form.date,
      time: form.time,
      platform: form.platform || "Google Meet",
      location: `${form.platform || "Google Meet"} / Online`,
      meetUrl: form.meetUrl,
      attendee_type: form.attendee_type || "Both",
      participants: participantObjs.length > 0 ? participantObjs : [{ name: userEmail.split("@")[0], email: userEmail, attendance: "Present" }],
      notes: form.notes,
      actionItems: parsedActionItems,
      created_at: new Date().toISOString()
    };

    const updated = [newMeeting, ...meetings];
    saveMeetingsState(updated);

    setCreateModalOpen(false);
    setForm({
      title: "",
      host: userEmail || "Lead Trainer",
      date: new Date().toISOString().split("T")[0],
      time: "10:00 AM – 11:00 AM",
      platform: "Google Meet",
      attendee_type: "Both",
      location: "Google Meet / Online",
      meetUrl: "",
      invitedEmails: "",
      notes: "",
      actionItemsInput: "",
    });

    showToast("Meeting Scheduled 📅", `Meeting '${newMeeting.title}' created successfully.`, "success");
  };

  const executeDeleteMeeting = async () => {
    if (!deleteModal.meeting) return;
    setDeleteModal(prev => ({ ...prev, loading: true }));
    const id = deleteModal.meeting.id;

    try {
      const updated = meetings.filter((m) => m.id !== id);
      saveMeetingsState(updated);
      showToast("Meeting Deleted 🗑️", "Meeting session canceled successfully.", "info");
    } catch(e) {
      showToast("Error", "Failed to delete meeting.", "error");
    } finally {
      setDeleteModal({ isOpen: false, meeting: null, loading: false });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Modal */}
      <Modal isOpen={modal.isOpen} title={modal.title} message={modal.message} type={modal.type} onClose={closeModal} />

      {/* HEADER BANNER */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-full border border-[#2563EB]/20">
              Official Meeting Hub
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#0F172A] mt-1.5 flex items-center gap-2.5">
            <FaVideo className="text-[#2563EB]" />
            <span>Meeting Management System</span>
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Create Meetings • Attendance Tracking • Minutes of Meeting (MOM) • Action Items Engine
          </p>
        </div>

        {(role === "admin" || role === "hr" || role === "manager") && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <FaPlusCircle className="text-sm" />
            <span>+ Create New Meeting</span>
          </button>
        )}
      </div>

      {/* MEETINGS GRID (Requirement #7 - Responsive grid grid-cols-1 md:grid-cols-2 gap-4) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {meetings.length === 0 ? (
          <div className="md:col-span-2 bg-white p-12 text-center rounded-2xl border border-[#E2E8F0] text-[#64748B] italic text-xs">
            No scheduled meetings. Click "+ Create New Meeting" to schedule one.
          </div>
        ) : (
          meetings.map((m) => {
            const presentCount = m.participants.filter(p => p.attendance === "Present").length;
            const totalCount = m.participants.length;

            return (
              <div key={m.id} className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/20">
                        {m.date} • {m.time}
                      </span>
                      <h3 className="font-bold text-[#0F172A] text-base mt-1">{m.title}</h3>
                    </div>

                    {/* Kebab Context Menu for Delete Safeguard */}
                    {(role === "admin" || role === "hr" || role === "manager") && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setActiveKebabId(activeKebabId === m.id ? null : m.id)}
                          className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                        >
                          <FaEllipsisV className="text-xs" />
                        </button>

                        {activeKebabId === m.id && (
                          <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white p-1.5 shadow-lg border border-[#E2E8F0] z-30 space-y-0.5 text-xs text-left animate-in fade-in zoom-in-95 duration-100">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMeetingModal(m);
                                setNoteEditInput(m.notes || "");
                                setActiveKebabId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[#EFF6FF] text-[#0F172A] hover:text-[#2563EB] font-semibold transition-colors"
                            >
                              Open Workspace
                            </button>
                            <div className="border-t border-[#E2E8F0] my-1" />
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteModal({ isOpen: true, meeting: m, loading: false });
                                setActiveKebabId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 font-semibold transition-colors"
                            >
                              Delete Meeting
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 text-[#64748B]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="bg-[#EFF6FF] text-[#2563EB] font-semibold px-2.5 py-0.5 rounded-full border border-[#2563EB]/20 text-[10px]">
                        📹 {m.platform || "Google Meet"}
                      </span>
                      <span className="bg-[#EFF6FF] text-[#2563EB] font-semibold px-2.5 py-0.5 rounded-full border border-[#2563EB]/20 text-[10px]">
                        👥 {m.attendee_type || "Both Students & Staff"}
                      </span>
                    </div>
                    <p><strong>Host:</strong> <span className="text-[#0F172A]">{m.host}</span></p>
                    <p>
                      <strong>Meeting Link:</strong>{" "}
                      <a
                        href={m.meetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#2563EB] font-bold inline-flex items-center gap-1 hover:underline"
                      >
                        <FaLink className="text-[10px]" /> Open Meeting Link
                      </a>
                    </p>
                    <p>
                      <strong>Attendance:</strong>{" "}
                      <span className="font-semibold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-full border border-[#2563EB]/20">
                        {presentCount} / {totalCount} Present
                      </span>
                    </p>
                  </div>

                  {/* Notes Preview */}
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
                    <span className="font-bold text-[#0F172A] flex items-center gap-1.5 text-[11px]">
                      <FaStickyNote className="text-[#2563EB]" />
                      <span>Meeting Notes (Minutes of Meeting):</span>
                    </span>
                    <p className="text-[#64748B] text-[11px] line-clamp-2">{m.notes || "No notes recorded yet."}</p>
                  </div>
                </div>

                {/* Open Workspace Button */}
                <button
                  onClick={() => {
                    setActiveMeetingModal(m);
                    setNoteEditInput(m.notes || "");
                  }}
                  className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold py-2.5 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  <FaFileSignature />
                  <span>Open Meeting Workspace</span>
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE MEETING MODAL (2-Column Responsive Form) */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 border border-[#E2E8F0] text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="font-bold text-[#0F172A] text-base flex items-center gap-2">
                <FaVideo className="text-[#2563EB]" />
                <span>Create & Schedule New Meeting</span>
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-[#64748B] hover:text-[#0F172A] text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold uppercase text-[#0F172A] mb-1">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. MERN Architecture & Sprint Sync"
                  className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2 text-xs text-[#0F172A] outline-none focus:border-[#2563EB]"
                />
              </div>

              {/* 2-Column Responsive Grid for Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#0F172A] mb-1">
                    Meeting Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-[#0F172A] mb-1">
                    Time Slot *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    placeholder="11:00 AM – 12:00 PM"
                    className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#0F172A] mb-1">
                    Platform *
                  </label>
                  <select
                    value={form.platform}
                    onChange={(e) => setForm({ ...form, platform: e.target.value })}
                    className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] bg-white font-medium"
                  >
                    <option value="Google Meet">Google Meet</option>
                    <option value="Zoom Cloud">Zoom Cloud</option>
                    <option value="Microsoft Teams">Microsoft Teams</option>
                    <option value="Physical Boardroom">Physical Boardroom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-[#0F172A] mb-1">
                    Meeting Link URL *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.meetUrl}
                    onChange={(e) => setForm({ ...form, meetUrl: e.target.value })}
                    placeholder="https://meet.google.com/xyz-abc"
                    className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[#0F172A] mb-1">
                  Invited Attendee Emails (Comma Separated)
                </label>
                <input
                  type="text"
                  value={form.invitedEmails}
                  onChange={(e) => setForm({ ...form, invitedEmails: e.target.value })}
                  placeholder="student@gmail.com, staff@gmail.com"
                  className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold py-3 rounded-xl transition-colors shadow-xs cursor-pointer text-xs"
                >
                  Schedule Meeting & Dispatch Invites
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DESTRUCTIVE MODAL FOR DELETE MEETING */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E2E8F0] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-[#E2E8F0] pb-3 text-[#0F172A]">
              <FaExclamationTriangle className="text-xl text-[#2563EB]" />
              <h3 className="font-bold text-[#0F172A] text-base">Delete Meeting Session?</h3>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Are you sure you want to permanently cancel and delete <strong>{deleteModal.meeting?.title}</strong>? This action cannot be undone.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, meeting: null, loading: false })}
                className="flex-1 py-2.5 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#2563EB] border border-[#E2E8F0] font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeleteMeeting}
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
