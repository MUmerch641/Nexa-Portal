"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
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
  FaChalkboardTeacher
} from "react-icons/fa";

import { dbFetch, dbSaveList } from "@/lib/dbPersistence";

export default function MeetingsPage() {
  const [role, setRole] = useState("admin");
  const [userEmail, setUserEmail] = useState("");
  const initialMeetings = [
    {
      id: "meet-101",
      title: "Sprint Planning & MERN Architecture Sync",
      host: "Engr. Hamza (Lead Full-Stack)",
      date: "2026-08-03",
      time: "10:30 AM – 11:30 AM",
      location: "Conference Room #1 / Google Meet",
      meetUrl: "https://meet.google.com/xyz-abc-mno",
      participants: [
        { name: "Ali Hassan (Student)", email: "student@gmail.com", attendance: "Present" },
        { name: "Muhammad Rahim Bugti (Senior Dev)", email: "rahim.staff@gmail.com", attendance: "Present" },
        { name: "Sara Khan (UI/UX Lead)", email: "sara.design@gmail.com", attendance: "Absent" },
      ],
      notes: "Reviewed Supabase auth integration, foreign key relations, and PDF receipt generator edge cases.",
      actionItems: [
        { id: "act-1", item: "Ali Hassan: Finalize Next.js responsive flexbox layout", assignedTo: "student@gmail.com", status: "Done" },
        { id: "act-2", item: "Rahim: Deploy Prisma PostgreSQL migration scripts", assignedTo: "rahim.staff@gmail.com", status: "Pending" },
      ],
    },
    {
      id: "meet-102",
      title: "Weekly HR & Student Progress Review",
      host: "Admin Officer",
      date: "2026-08-05",
      time: "02:00 PM – 03:00 PM",
      location: "Main Boardroom (2nd Floor)",
      meetUrl: "https://meet.google.com/hr-review-session",
      participants: [
        { name: "Ali Hassan (Student)", email: "student@gmail.com", attendance: "Pending" },
        { name: "Sara Ahmed (Intern)", email: "sara.intern@gmail.com", attendance: "Pending" },
      ],
      notes: "Monthly fee proof verifications and 3-month certificate eligibility check.",
      actionItems: [
        { id: "act-3", item: "Admin: Verify student payment slips and issue official PDF receipts", assignedTo: "admin@gmail.com", status: "In Progress" },
      ],
    },
  ];
  const [meetings, setMeetings] = useState(initialMeetings);

  // Live Group Chat & Instant Message State per Meeting
  const [chatMessages, setChatMessages] = useState([
    { id: "c-1", sender: "Engr. Hamza", email: "hamza.instructor@gmail.com", text: "Welcome team! Please review the sprint deliverables.", time: "10:32 AM" },
    { id: "c-2", sender: "Ali Hassan", email: "student@gmail.com", text: "Working on Next.js auth layout right now.", time: "10:34 AM" },
    { id: "c-3", sender: "Muhammad Rahim Bugti", email: "rahim.staff@gmail.com", text: "Database schemas updated and ready for migration.", time: "10:35 AM" },
  ]);

  const [chatInputText, setChatInputText] = useState("");
  
  // Invite Participant Modal State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmailInput, setInviteEmailInput] = useState("");

  // Create Meeting Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    host: "Engr. Hamza (Lead Instructor)",
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    time: "11:00 AM – 12:00 PM",
    platform: "Google Meet",
    attendee_type: "Both",
    location: "Google Meet / Online",
    meetUrl: "https://meet.google.com/new-session-id",
    invitedEmails: "student@gmail.com, rahim.staff@gmail.com",
    notes: "Discussion on practical assignments and weekly deliverables.",
    actionItemsInput: "1. Finalize REST API endpoints\n2. Update database indexes",
  });

  // Modal Inspection / Edit Notes & Action Items State
  const [activeMeetingModal, setActiveMeetingModal] = useState(null);
  const [newActionInput, setNewActionInput] = useState("");
  const [noteEditInput, setNoteEditInput] = useState("");

  // Modal Alert
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info" });

  const showAlert = (title, message, type = "info") => {
    setModal({ isOpen: true, title, message, type });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  useEffect(() => {
    const savedRole = localStorage.getItem("user_role") || "admin";
    const savedEmail = localStorage.getItem("current_user_email") || "admin@gmail.com";
    setRole(savedRole);
    setUserEmail(savedEmail);

    dbFetch("meetings", initialMeetings).then(data => {
      setMeetings(data);
    });
  }, []);

  const saveMeetingsState = (newList) => {
    setMeetings(newList);
    dbSaveList("meetings", newList);
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date || !form.time || !form.meetUrl.trim()) {
      showAlert("Missing Required Fields ⚠️", "Please fill in Title, Date, Time, Platform, and Link.", "warning");
      return;
    }

    // Past Date Validation: Ensure date is not in the past
    const todayZero = new Date();
    todayZero.setHours(0, 0, 0, 0);
    const selectedDate = new Date(form.date);
    if (selectedDate < todayZero) {
      showAlert("Invalid Date 🛑", "Meeting date cannot be in the past. Please select today or a future date.", "warning");
      return;
    }

    // Duplicate Meeting Check: Title, Date, and Time
    const isDuplicate = meetings.some(
      (m) =>
        m.title.trim().toLowerCase() === form.title.trim().toLowerCase() &&
        m.date === form.date &&
        m.time.trim().toLowerCase() === form.time.trim().toLowerCase()
    );

    if (isDuplicate) {
      showAlert("Duplicate Meeting Error 🛑", `A meeting titled '${form.title}' is ALREADY scheduled on ${form.date} at ${form.time}.`, "error");
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
      host: form.host,
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

    // Save to Supabase Database safely
    try {
      await supabase.from("meetings").insert([
        {
          title: newMeeting.title,
          date: newMeeting.date,
          time: newMeeting.time,
          platform: newMeeting.platform,
          meet_url: newMeeting.meetUrl,
          attendee_type: newMeeting.attendee_type,
          created_at: newMeeting.created_at
        }
      ]);
    } catch (dbErr) {}

    setCreateModalOpen(false);
    setForm({
      title: "",
      host: "Engr. Hamza (Lead Instructor)",
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      time: "11:00 AM – 12:00 PM",
      platform: "Google Meet",
      attendee_type: "Both",
      location: "Google Meet / Online",
      meetUrl: "https://meet.google.com/new-session-id",
      invitedEmails: "student@gmail.com, rahim.staff@gmail.com",
      notes: "Discussion on practical assignments and weekly deliverables.",
      actionItemsInput: "1. Finalize REST API endpoints\n2. Update database indexes",
    });

    showAlert(
      "Meeting Scheduled & Notifications Dispatched! 📅",
      `Meeting '${newMeeting.title}' scheduled for ${newMeeting.date} at ${newMeeting.time} via ${newMeeting.platform}.\n\nNotifications sent to ${newMeeting.participants.length} attendee(s).`,
      "success"
    );
  };

  const handleToggleAttendance = (meetId, participantEmail, newAttendance) => {
    const updated = meetings.map(m => {
      if (m.id === meetId) {
        const updatedParts = m.participants.map(p =>
          p.email.toLowerCase() === participantEmail.toLowerCase() ? { ...p, attendance: newAttendance } : p
        );
        return { ...m, participants: updatedParts };
      }
      return m;
    });
    saveMeetingsState(updated);
    if (activeMeetingModal && activeMeetingModal.id === meetId) {
      setActiveMeetingModal(updated.find(m => m.id === meetId));
    }
  };

  const handleInviteParticipant = (meetId) => {
    if (!inviteEmailInput.trim()) return;
    const newParticipant = {
      name: inviteEmailInput.split("@")[0],
      email: inviteEmailInput.trim(),
      attendance: "Pending",
    };

    const updated = meetings.map(m => {
      if (m.id === meetId) {
        // Prevent duplicate invites
        const exists = m.participants.some(p => p.email.toLowerCase() === inviteEmailInput.trim().toLowerCase());
        if (exists) return m;
        return { ...m, participants: [...m.participants, newParticipant] };
      }
      return m;
    });

    saveMeetingsState(updated);
    if (activeMeetingModal && activeMeetingModal.id === meetId) {
      setActiveMeetingModal(updated.find(m => m.id === meetId));
    }
    setInviteEmailInput("");
    setInviteModalOpen(false);
    showAlert("Participant Invited ✉️", `Invitation link sent to ${inviteEmailInput}`, "success");
  };

  const handleSendGroupChatMessage = (e) => {
    e.preventDefault();
    if (!chatInputText.trim()) return;

    const newMsg = {
      id: "c-" + Date.now(),
      sender: userEmail ? userEmail.split("@")[0] : "User",
      email: userEmail || "user@gmail.com",
      text: chatInputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setChatInputText("");
  };

  const handleAddActionItem = (meetId) => {
    if (!newActionInput.trim()) return;
    const newItem = {
      id: `act-${Date.now()}`,
      item: newActionInput.trim(),
      assignedTo: userEmail,
      status: "Pending",
    };
    const updated = meetings.map(m => {
      if (m.id === meetId) {
        return { ...m, actionItems: [...(m.actionItems || []), newItem] };
      }
      return m;
    });
    saveMeetingsState(updated);
    setNewActionInput("");
    if (activeMeetingModal && activeMeetingModal.id === meetId) {
      setActiveMeetingModal(updated.find(m => m.id === meetId));
    }
  };

  const handleToggleActionStatus = (meetId, actionId) => {
    const updated = meetings.map(m => {
      if (m.id === meetId) {
        const updatedActions = (m.actionItems || []).map(a => {
          if (a.id === actionId) {
            const nextStatus = a.status === "Done" ? "Pending" : "Done";
            return { ...a, status: nextStatus };
          }
          return a;
        });
        return { ...m, actionItems: updatedActions };
      }
      return m;
    });
    saveMeetingsState(updated);
    if (activeMeetingModal && activeMeetingModal.id === meetId) {
      setActiveMeetingModal(updated.find(m => m.id === meetId));
    }
  };

  const handleDeleteMeeting = (meetId) => {
    if (!confirm("Are you sure you want to cancel and delete this meeting session?")) return;
    const updated = meetings.filter(m => m.id !== meetId);
    saveMeetingsState(updated);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Modal */}
      <Modal isOpen={modal.isOpen} title={modal.title} message={modal.message} type={modal.type} onClose={closeModal} />

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400 bg-purple-950/90 px-3 py-1 rounded-full border border-purple-800">
              Official Meeting Hub
            </span>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
              Participants & Action Items
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black mt-2 text-white flex items-center gap-2.5">
            <FaVideo className="text-purple-400" />
            <span>Meeting Management System</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Create Meetings • Invite Participants • Attendance Tracking • Meeting Notes (MOM) • Action Items Engine
          </p>
        </div>

        {(role === "admin" || role === "hr" || role === "manager") && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-black px-5 py-2.5 rounded-xl text-xs transition-all shadow-lg flex items-center justify-center gap-2 border border-purple-500/40 cursor-pointer shrink-0"
          >
            <FaPlusCircle className="text-base" />
            <span>+ Create New Meeting</span>
          </button>
        )}
      </div>

      {/* Meetings List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {meetings.map((m) => {
          const presentCount = m.participants.filter(p => p.attendance === "Present").length;
          const totalCount = m.participants.length;

          return (
            <div key={m.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-300">
                      {m.date} • {m.time}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-1">{m.title}</h3>
                  </div>

                  {(role === "admin" || role === "hr" || role === "manager") && (
                    <button
                      onClick={() => handleDeleteMeeting(m.id)}
                      className="text-rose-600 hover:text-rose-800 p-1.5 rounded-lg hover:bg-rose-50 transition-all text-xs"
                      title="Cancel Meeting"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>

                <div className="space-y-2 text-slate-600">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="bg-purple-50 text-purple-900 font-bold px-2 py-0.5 rounded border border-purple-200 text-[10px]">
                      📹 Platform: {m.platform || "Google Meet"}
                    </span>
                    <span className="bg-blue-50 text-blue-900 font-bold px-2 py-0.5 rounded border border-blue-200 text-[10px]">
                      👥 Attendees: {m.attendee_type || "Both (Students & Staff)"}
                    </span>
                  </div>
                  <p><strong>Host / Instructor:</strong> {m.host}</p>
                  <p>
                    <strong>Meeting Link:</strong>{" "}
                    <a
                      href={m.meetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline font-bold inline-flex items-center gap-1 hover:text-blue-800"
                    >
                      <FaLink className="text-[10px]" /> Open {m.platform || "Google Meet"} Link
                    </a>
                  </p>
                  <p>
                    <strong>Participant Attendance:</strong>{" "}
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {presentCount} / {totalCount} Present
                    </span>
                  </p>
                </div>

                {/* Meeting Notes (MOM Preview) */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px]">
                    <FaStickyNote className="text-purple-600" />
                    <span>Meeting Notes (Minutes of Meeting):</span>
                  </span>
                  <p className="text-slate-600 text-[11px] line-clamp-2">{m.notes || "No notes recorded yet."}</p>
                </div>

                {/* Action Items Counter */}
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-purple-950">
                    <span className="flex items-center gap-1">
                      <FaTasks className="text-purple-700" />
                      <span>Action Items ({m.actionItems?.length || 0})</span>
                    </span>
                    <span className="text-[10px] text-purple-800">
                      {(m.actionItems || []).filter(a => a.status === "Done").length} Completed
                    </span>
                  </div>
                  <ul className="space-y-1 text-[11px]">
                    {(m.actionItems || []).slice(0, 2).map((a) => (
                      <li key={a.id} className="flex items-center justify-between text-slate-700">
                        <span className={a.status === "Done" ? "line-through text-slate-400" : "font-medium"}>• {a.item}</span>
                        <span className={a.status === "Done" ? "text-emerald-700 font-bold text-[10px]" : "text-amber-700 font-bold text-[10px]"}>{a.status}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Manage Meeting & Attendance Button */}
              <button
                onClick={() => {
                  setActiveMeetingModal(m);
                  setNoteEditInput(m.notes || "");
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <FaFileSignature />
                <span>Open Meeting Workspace (Attendance, Notes & Action Items)</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* CREATE MEETING MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FaVideo className="text-purple-600" />
                <span>Create & Schedule New Meeting</span>
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. MERN Architecture & Sprint Sync"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Meeting Date
                  </label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Meeting Time
                  </label>
                  <input
                    type="text"
                    required
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    placeholder="e.g. 10:30 AM – 11:30 AM"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Meeting Platform *
                  </label>
                  <select
                    value={form.platform}
                    onChange={(e) => setForm({ ...form, platform: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-600 bg-white"
                  >
                    <option value="Google Meet">Google Meet</option>
                    <option value="Zoom">Zoom</option>
                    <option value="Microsoft Teams">Microsoft Teams</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Selected Attendees *
                  </label>
                  <select
                    value={form.attendee_type}
                    onChange={(e) => setForm({ ...form, attendee_type: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-600 bg-white"
                  >
                    <option value="Both">Both (Students & Employees)</option>
                    <option value="Students">Students Only</option>
                    <option value="Employees">Employees Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Online Meeting Link (Google Meet / Zoom URL) *
                </label>
                <input
                  type="url"
                  required
                  value={form.meetUrl}
                  onChange={(e) => setForm({ ...form, meetUrl: e.target.value })}
                  placeholder="https://meet.google.com/xyz-abc-mno"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Invite Participants (Comma Separated Emails) *
                </label>
                <input
                  type="text"
                  required
                  value={form.invitedEmails}
                  onChange={(e) => setForm({ ...form, invitedEmails: e.target.value })}
                  placeholder="student@gmail.com, rahim.staff@gmail.com"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Initial Agenda & Meeting Notes
                </label>
                <textarea
                  rows="2"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Initial Action Items (1 per line)
                </label>
                <textarea
                  rows="2"
                  value={form.actionItemsInput}
                  onChange={(e) => setForm({ ...form, actionItemsInput: e.target.value })}
                  placeholder="1. Task one&#10;2. Task two"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-600"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
              >
                Schedule Meeting & Send Participant Invites
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FULL MEETING WORKSPACE MODAL (ATTENDANCE, MOM NOTES & ACTION ITEMS) */}
      {activeMeetingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-300">
                  {activeMeetingModal.date} • {activeMeetingModal.time}
                </span>
                <h3 className="font-bold text-slate-900 text-lg mt-1">{activeMeetingModal.title}</h3>
              </div>
              <button onClick={() => setActiveMeetingModal(null)} className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1">✕</button>
            </div>

            {/* 1. Participant Attendance Tracking Table & Invite Button */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <FaUsers className="text-blue-600" />
                  <span>1. Participant Attendance Status ({activeMeetingModal.participants.length})</span>
                </h4>
                <button
                  onClick={() => setInviteModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] transition-all flex items-center gap-1 cursor-pointer"
                >
                  <FaPlusCircle />
                  <span>+ Invite New Person</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Participant</th>
                      <th className="p-2.5">Email</th>
                      <th className="p-2.5 text-right">Attendance Mark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {activeMeetingModal.participants.map((p) => (
                      <tr key={p.email} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">{p.name}</td>
                        <td className="p-2.5 font-mono text-slate-500 text-[11px]">{p.email}</td>
                        <td className="p-2.5 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleToggleAttendance(activeMeetingModal.id, p.email, "Present")}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                p.attendance === "Present"
                                  ? "bg-emerald-600 text-white border-emerald-600"
                                  : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                              }`}
                            >
                              Present
                            </button>
                            <button
                              onClick={() => handleToggleAttendance(activeMeetingModal.id, p.email, "Absent")}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                p.attendance === "Absent"
                                  ? "bg-rose-600 text-white border-rose-600"
                                  : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                              }`}
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Live Group Chat & Instant Messaging Box */}
            <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <FaVideo className="text-purple-600" />
                <span>2. Live Meeting Group Chat Box</span>
              </h4>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-white space-y-2 max-h-48 overflow-y-auto">
                {chatMessages.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No chat messages yet. Start group discussion!</p>
                ) : (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className="p-2 rounded-lg bg-slate-800/90 border border-slate-700 text-xs space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-400 text-[11px]">{msg.sender}</span>
                        <span className="text-[9px] text-slate-400">{msg.time}</span>
                      </div>
                      <p className="text-slate-200 text-[11px]">{msg.text}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendGroupChatMessage} className="flex gap-2">
                <input
                  type="text"
                  value={chatInputText}
                  onChange={(e) => setChatInputText(e.target.value)}
                  placeholder="Type a message to meeting group..."
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-purple-600"
                />
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition-all shadow-xs cursor-pointer"
                >
                  Send
                </button>
              </form>
            </div>

            {/* 3. Meeting Notes (MOM) Editor */}
            <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <FaStickyNote className="text-purple-600" />
                <span>3. Meeting Notes & Key Discussion (MOM)</span>
              </h4>
              <textarea
                rows="3"
                value={noteEditInput}
                onChange={(e) => setNoteEditInput(e.target.value)}
                placeholder="Type key discussion points and meeting minutes..."
                className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 outline-none focus:border-purple-600"
              />
              <button
                onClick={() => handleSaveMeetingNotes(activeMeetingModal.id)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all shadow-xs cursor-pointer"
              >
                Save Notes (MOM)
              </button>
            </div>

            {/* 4. Action Items Tracker */}
            <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <FaTasks className="text-amber-600" />
                <span>4. Assigned Action Items & Tasks</span>
              </h4>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newActionInput}
                  onChange={(e) => setNewActionInput(e.target.value)}
                  placeholder="Add new action item task..."
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 outline-none"
                />
                <button
                  onClick={() => handleAddActionItem(activeMeetingModal.id)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                >
                  + Add Action Item
                </button>
              </div>

              <div className="space-y-2">
                {(activeMeetingModal.actionItems || []).map((a) => (
                  <div key={a.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className={a.status === "Done" ? "font-bold text-slate-400 line-through" : "font-bold text-slate-900"}>
                        {a.item}
                      </p>
                      <span className="text-[10px] text-slate-400">Assigned To: {a.assignedTo}</span>
                    </div>

                    <button
                      onClick={() => handleToggleActionStatus(activeMeetingModal.id, a.id)}
                      className={`px-3 py-1 rounded-lg font-bold text-[10px] border cursor-pointer ${
                        a.status === "Done"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-amber-100 text-amber-800 border-amber-300"
                      }`}
                    >
                      {a.status === "Done" ? "✅ Completed" : "⏳ Pending (Mark Done)"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC INVITE PARTICIPANT MODAL */}
      {inviteModalOpen && activeMeetingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FaUsers className="text-blue-600" />
                <span>Invite New Participant to Meeting</span>
              </h3>
              <button onClick={() => setInviteModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Participant Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmailInput}
                  onChange={(e) => setInviteEmailInput(e.target.value)}
                  placeholder="e.g. sara.design@gmail.com"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 font-mono"
                />
              </div>

              <button
                onClick={() => handleInviteParticipant(activeMeetingModal.id)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
              >
                Send Invite Link & Add to Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
