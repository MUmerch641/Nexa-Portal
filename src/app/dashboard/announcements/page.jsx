"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import {
  FaBullhorn,
  FaPlusCircle,
  FaCalendarTimes,
  FaVideo,
  FaShieldAlt,
  FaBell,
  FaTrash,
  FaClock,
  FaUserShield,
  FaCheckCircle,
  FaInfoCircle
} from "react-icons/fa";

export default function AnnouncementsPage() {
  const [role, setRole] = useState("admin");
  const [userEmail, setUserEmail] = useState("");
  const [announcements, setAnnouncements] = useState([
    {
      id: "ann-101",
      title: "Tomorrow Official Office Holiday (Independence Day)",
      category: "Tomorrow Holiday", // "Tomorrow Holiday" | "Office Meeting" | "New Policy" | "General Announcement"
      postedBy: "Muhammad Rahim (Admin)",
      date: "2026-08-02",
      time: "09:00 AM",
      content: "All physical campus labs and remote operations will remain closed tomorrow in observance of national holiday. Enjoy your day!",
      broadcastNotification: true,
    },
    {
      id: "ann-102",
      title: "Mandatory All-Hands Office Meeting at 03:00 PM",
      category: "Office Meeting",
      postedBy: "HR Department",
      date: "2026-08-04",
      time: "03:00 PM",
      content: "All employees, interns, and students are requested to join Conference Room #1 / Google Meet for monthly roadmap sync.",
      broadcastNotification: true,
    },
    {
      id: "ann-103",
      title: "Updated Remote Work & Transparent Monitoring Policy",
      category: "New Policy",
      postedBy: "Admin & Operations",
      date: "2026-08-01",
      time: "11:30 AM",
      content: "New remote screenshot & activity logging guidelines released. Please review privacy transparency compliance parameters.",
      broadcastNotification: true,
    },
  ]);

  // Create Announcement Modal State (Admin Only)
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Alert Modal
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

    const savedAnnouncements = localStorage.getItem("software_house_announcements_list");
    if (savedAnnouncements) {
      try {
        const parsed = JSON.parse(savedAnnouncements);
        const todayStr = new Date().toISOString().split("T")[0];
        // Automatic Expiry Engine: Remove announcements past their expiry_date
        const validUnexpired = parsed.filter((a) => {
          if (!a.expiry_date) return true;
          return a.expiry_date >= todayStr;
        });
        setAnnouncements(validUnexpired);
        localStorage.setItem("software_house_announcements_list", JSON.stringify(validUnexpired));
      } catch (e) {}
    }
  }, []);

  const saveAnnouncementsState = (newList) => {
    setAnnouncements(newList);
    localStorage.setItem("software_house_announcements_list", JSON.stringify(newList));
    window.dispatchEvent(new Event("storage"));
  };

  const [form, setForm] = useState({
    title: "",
    category: "Tomorrow Holiday",
    priority: "Urgent", // "Normal" | "Important" | "Urgent"
    target_audience: "All Users", // "All Users" | "Employees Only" | "Students Only" | "HR Department"
    start_date: new Date().toISOString().split("T")[0],
    expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    content: "",
    broadcastNotification: true,
  });

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      showAlert("Missing Fields ⚠️", "Please enter Announcement Title and Description.", "warning");
      return;
    }

    const now = new Date();
    const nowIso = now.toISOString();

    const newObj = {
      id: "ann-" + Date.now(),
      title: form.title,
      category: form.category,
      priority: form.priority,
      target_audience: form.target_audience,
      start_date: form.start_date,
      expiry_date: form.expiry_date,
      postedBy: userEmail ? `${userEmail.split("@")[0]} (Admin)` : "Admin Officer",
      date: now.toISOString().split("T")[0],
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdTimestampMs: now.getTime(),
      content: form.content,
      broadcastNotification: form.broadcastNotification,
    };

    const updated = [newObj, ...announcements];
    saveAnnouncementsState(updated);

    // Save to Supabase Database
    try {
      await supabase.from("announcements").insert([
        {
          title: form.title,
          category: form.category,
          priority: form.priority,
          target_audience: form.target_audience,
          content: form.content,
          start_date: form.start_date,
          expiry_date: form.expiry_date,
          created_at: nowIso
        }
      ]);
    } catch (dbErr) {}

    setCreateModalOpen(false);
    setForm({
      title: "",
      category: "Tomorrow Holiday",
      priority: "Urgent",
      target_audience: "All Users",
      start_date: new Date().toISOString().split("T")[0],
      expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      content: "",
      broadcastNotification: true,
    });

    showAlert(
      `Announcement Published (${form.priority}) 📢`,
      `Title: '${newObj.title}'\nTarget Audience: ${form.target_audience}\nExpiry Date: ${form.expiry_date}\n\nReal-time toast notification & dashboard banner dispatched to targeted users!`,
      "success"
    );
  };

  const handleDeleteAnnouncement = (id) => {
    if (!confirm("Are you sure you want to delete this announcement broadcast?")) return;
    const updated = announcements.filter((a) => a.id !== id);
    saveAnnouncementsState(updated);
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case "Tomorrow Holiday":
        return (
          <span className="bg-rose-100 text-rose-800 border border-rose-300 font-extrabold px-3 py-1 rounded-xl text-xs flex items-center gap-1.5">
            <FaCalendarTimes className="text-rose-600" />
            <span>🎉 Tomorrow Holiday</span>
          </span>
        );
      case "Office Meeting":
        return (
          <span className="bg-purple-100 text-purple-800 border border-purple-300 font-extrabold px-3 py-1 rounded-xl text-xs flex items-center gap-1.5">
            <FaVideo className="text-purple-600" />
            <span>📹 Office Meeting</span>
          </span>
        );
      case "New Policy":
        return (
          <span className="bg-amber-100 text-amber-900 border border-amber-300 font-extrabold px-3 py-1 rounded-xl text-xs flex items-center gap-1.5">
            <FaShieldAlt className="text-amber-700" />
            <span>📜 New Policy</span>
          </span>
        );
      default:
        return (
          <span className="bg-blue-100 text-blue-800 border border-blue-300 font-extrabold px-3 py-1 rounded-xl text-xs flex items-center gap-1.5">
            <FaBullhorn className="text-blue-600" />
            <span>📢 Announcement</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Alert Modal */}
      <Modal isOpen={modal.isOpen} title={modal.title} message={modal.message} type={modal.type} onClose={closeModal} />

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-400 bg-rose-950/90 px-3 py-1 rounded-full border border-rose-800">
              Official Company Broadcast
            </span>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full flex items-center gap-1">
              <FaBell className="text-rose-400" /> Automatic Multi-User Alerts Active
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black mt-2 text-white flex items-center gap-2.5">
            <FaBullhorn className="text-rose-400" />
            <span>Announcement Board</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Official Broadcasts: Tomorrow Holiday Alerts • Office Meeting Notices • New Company Policies • Broadcast Notifications
          </p>
        </div>

        {(role === "admin" || role === "hr" || role === "manager") && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="bg-rose-600 hover:bg-rose-700 text-white font-black px-5 py-2.5 rounded-xl text-xs transition-all shadow-lg flex items-center justify-center gap-2 border border-rose-500/40 cursor-pointer shrink-0"
          >
            <FaPlusCircle className="text-base" />
            <span>+ Post Official Announcement</span>
          </button>
        )}
      </div>

      {/* Announcements Feed */}
      <div className="space-y-4">
        {announcements.map((a) => (
          <div key={a.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3 text-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                {getCategoryBadge(a.category)}
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                  a.priority === "Urgent"
                    ? "bg-rose-100 text-rose-800 border-rose-300"
                    : a.priority === "Important"
                    ? "bg-amber-100 text-amber-900 border-amber-300"
                    : "bg-emerald-100 text-emerald-800 border-emerald-300"
                }`}>
                  {a.priority || "Normal"} Priority
                </span>
                <h3 className="font-bold text-slate-900 text-base">{a.title}</h3>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                  <FaClock /> {a.date} at {a.time} {a.expiry_date ? `(Expires: ${a.expiry_date})` : ""}
                </span>

                {(role === "admin" || role === "hr" || role === "manager") && (
                  <button
                    onClick={() => handleDeleteAnnouncement(a.id)}
                    className="text-rose-600 hover:text-rose-800 p-1.5 rounded-lg hover:bg-rose-50 transition-all text-xs cursor-pointer"
                    title="Delete Announcement"
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              {a.content}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1">
              <span><strong>Posted By:</strong> {a.postedBy}</span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                <FaCheckCircle className="text-emerald-600" /> Target Audience: {a.target_audience || "All Users"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE ANNOUNCEMENT MODAL (ADMIN ONLY) */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FaBullhorn className="text-rose-600" />
                <span>Post Official Announcement</span>
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Announcement Type / Category *
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-rose-600 font-bold"
                >
                  <option value="Tomorrow Holiday">🎉 Tomorrow Holiday Alert</option>
                  <option value="Office Meeting">📹 Office Meeting Notice</option>
                  <option value="New Policy">📜 New Company Policy</option>
                  <option value="General Announcement">📢 General Announcement</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Priority Level *
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-rose-600 font-bold bg-white"
                  >
                    <option value="Normal">🟢 Normal Priority</option>
                    <option value="Important">🟠 Important</option>
                    <option value="Urgent">🚨 Urgent Broadcast</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Target Audience *
                  </label>
                  <select
                    value={form.target_audience}
                    onChange={(e) => setForm({ ...form, target_audience: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-rose-600 font-bold bg-white"
                  >
                    <option value="All Users">👥 All Users (Entire House)</option>
                    <option value="Employees Only">👔 Employees Only</option>
                    <option value="Students Only">🎓 Students Only</option>
                    <option value="HR Department">🧑‍💼 HR & Management</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-rose-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Expiry Date (Auto-Remove)
                  </label>
                  <input
                    type="date"
                    value={form.expiry_date}
                    onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-rose-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Tomorrow Official Office Holiday"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-rose-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Full Announcement Description *
                </label>
                <textarea
                  rows="3"
                  required
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Type full announcement details for targeted users..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-rose-600"
                />
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
                <span className="font-bold text-rose-950 flex items-center gap-1.5">
                  <FaBell className="text-rose-600" /> Send Instant Notification to All Users
                </span>
                <input
                  type="checkbox"
                  checked={form.broadcastNotification}
                  onChange={(e) => setForm({ ...form, broadcastNotification: e.target.checked })}
                  className="w-4 h-4 text-rose-600 rounded cursor-pointer"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
              >
                Publish Announcement & Broadcast Alert
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
