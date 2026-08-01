"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Modal from "@/components/Modal";
import { FaCheck, FaTimes, FaCalendarPlus, FaUserClock, FaShieldAlt, FaInfoCircle } from "react-icons/fa";
import "@/app/dashboard/leaves/leaves.css";

export default function LeavesPage() {
  const [role, setRole] = useState("employee");
  const [user, setUser] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [form, setForm] = useState({
    applicantName: "",
    type: "Emergency Leave",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    reason: ""
  });
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info" });
  const [loading, setLoading] = useState(true);

  // Initial demo data fallback
  const initialDemoLeaves = [
    {
      id: "1",
      employee_name: "Muhammad Rahim Bugti",
      type: "Emergency Leave",
      start_date: "2026-08-01",
      end_date: "2026-08-01",
      reason: "Family emergency medical checkup",
      status: "pending",
      salary_cut: false
    },
    {
      id: "2",
      employee_name: "Ali Hassan (Student)",
      type: "Sick Leave",
      start_date: "2026-07-31",
      end_date: "2026-07-31",
      reason: "Severe fever and flu doctor advice rest",
      status: "approved",
      salary_cut: false
    },
    {
      id: "3",
      employee_name: "Sara Ahmed (Intern)",
      type: "Annual Leave",
      start_date: "2026-07-30",
      end_date: "2026-08-07",
      reason: "Personal travel and university exams",
      status: "rejected",
      salary_cut: true
    }
  ];

  // Load role and user
  useEffect(() => {
    const storedRole = localStorage.getItem("user_role") || "admin";
    setRole(storedRole);

    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setForm(prev => ({
        ...prev,
        applicantName: session?.user?.user_metadata?.full_name || (storedRole === "admin" ? "Admin User" : "Employee / Student")
      }));
    };
    fetchSession();
  }, []);

  // Fetch leaves from Supabase or LocalStorage demo
  const fetchLeaves = async () => {
    try {
      let query = supabase.from("leaves").select("*");
      const { data, error } = await query.order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        setLeaves(data);
      } else {
        // Fallback to local storage or demo
        const saved = localStorage.getItem("software_house_leaves");
        if (saved) {
          try { setLeaves(JSON.parse(saved)); } catch(e) { setLeaves(initialDemoLeaves); }
        } else {
          setLeaves(initialDemoLeaves);
          localStorage.setItem("software_house_leaves", JSON.stringify(initialDemoLeaves));
        }
      }
    } catch (e) {
      setLeaves(initialDemoLeaves);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [role]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.reason || !form.startDate || !form.endDate) {
      setModal({ isOpen: true, title: "Missing Information", message: "Please enter start date, end date, and reason for leave.", type: "warning" });
      return;
    }

    const newLeave = {
      id: Date.now().toString(),
      employee_id: user?.id || "local-user",
      employee_name: form.applicantName || (role === "student" ? "Student Applicant" : "Employee Applicant"),
      type: form.type,
      start_date: form.startDate,
      end_date: form.endDate,
      reason: form.reason,
      status: "pending",
      salary_cut: false,
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from("leaves").insert(newLeave);
    } catch(e) {
      // Local fallback
    }

    const updated = [newLeave, ...leaves];
    setLeaves(updated);
    localStorage.setItem("software_house_leaves", JSON.stringify(updated));

    setModal({
      isOpen: true,
      title: "Leave Application Submitted ⏳",
      message: "Your leave request has been submitted to Admin/HR. Status is currently Pending Review.",
      type: "success"
    });
    setForm(prev => ({ ...prev, reason: "" }));
  };

  const handleApprove = async (id) => {
    try {
      await supabase.from("leaves").update({ status: "approved", salary_cut: false }).eq("id", id);
    } catch(e) {}

    const updated = leaves.map(l => l.id === id ? { ...l, status: "approved", salary_cut: false } : l);
    setLeaves(updated);
    localStorage.setItem("software_house_leaves", JSON.stringify(updated));
    setModal({ isOpen: true, title: "Leave Approved 🟢", message: "Leave approved by Admin. Salary WILL NOT be cut (Exempt).", type: "success" });
  };

  const handleReject = async (id) => {
    try {
      await supabase.from("leaves").update({ status: "rejected", salary_cut: true }).eq("id", id);
    } catch(e) {}

    const updated = leaves.map(l => l.id === id ? { ...l, status: "rejected", salary_cut: true } : l);
    setLeaves(updated);
    localStorage.setItem("software_house_leaves", JSON.stringify(updated));
    setModal({ isOpen: true, title: "Leave Rejected 🔴", message: "Leave rejected by Admin. Salary cut policy applied.", type: "error" });
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading Leave Management Portal...</div>;

  const StatusBadge = ({ status }) => {
    if (status === "approved") {
      return <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full text-xs font-bold">🟢 Approved (Salary NOT Cut)</span>;
    }
    if (status === "rejected") {
      return <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 border border-rose-300 px-3 py-1 rounded-full text-xs font-bold">🔴 Rejected (Salary Cut Applied)</span>;
    }
    return <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1 rounded-full text-xs font-bold">⏳ Pending Admin Review</span>;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FaUserClock className="text-blue-600" />
            <span>Leave Management & Approvals</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Apply for leave with reason. Admin approves (No Salary Cut) or rejects (Salary Cut Applied).
          </p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 px-3.5 py-1.5 rounded-xl text-xs font-bold self-start md:self-auto">
          <FaShieldAlt className="text-blue-600 text-sm" />
          <span>Viewing as: <strong className="capitalize">{role} Portal View Mode</strong></span>
        </div>
      </div>

      {/* Rules Notice */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-900">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Approved Leave Status</p>
          <p className="text-base font-bold mt-1">🟢 Salary NOT Cut (Exempt)</p>
          <p className="text-xs text-emerald-700/80 mt-0.5">Admin approved requests incur 0 salary deduction.</p>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-900">
          <p className="text-xs font-bold uppercase tracking-wider text-rose-700">Rejected Leave Status</p>
          <p className="text-base font-bold mt-1">🔴 Salary WILL Be Cut</p>
          <p className="text-xs text-rose-700/80 mt-0.5">Unapproved absences incur policy salary cut.</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending Review</p>
          <p className="text-base font-bold mt-1">⏳ Awaiting HR Decision</p>
          <p className="text-xs text-amber-700/80 mt-0.5">Awaiting review from Admin/HR portal.</p>
        </div>
      </div>

      {/* Apply for Leave Form (Available to all users) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <FaCalendarPlus className="text-blue-600" />
          <span>Apply for Leave</span>
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Applicant Name *</label>
              <input
                type="text"
                name="applicantName"
                value={form.applicantName}
                onChange={handleInputChange}
                required
                placeholder="Enter your full name"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Leave Type *</label>
              <select
                name="type"
                value={form.type}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 bg-white"
              >
                <option value="Emergency Leave">Emergency Leave</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Annual Leave">Annual Leave</option>
                <option value="Casual Leave">Casual Leave</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Start Date *</label>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">End Date *</label>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Reason / Details *</label>
            <textarea
              name="reason"
              value={form.reason}
              onChange={handleInputChange}
              required
              rows="3"
              placeholder="State the detailed reason for your leave request..."
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
            />
          </div>

          <button
            type="submit"
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
          >
            <FaCalendarPlus />
            <span>Submit Leave Request</span>
          </button>
        </form>
      </div>

      {/* Leave Applications & Approval Status Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <h2 className="text-lg font-bold text-slate-900">Leave Applications & Approval Status</h2>
          <span className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-lg text-slate-700">
            Total Requests: {leaves.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-500">
                <th className="p-3">Applicant Name</th>
                <th className="p-3">Type & Dates</th>
                <th className="p-3">Reason / Details</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Admin Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-slate-400 text-xs">
                    No leave requests found. Submit a request using the form above.
                  </td>
                </tr>
              ) : (
                leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 font-semibold text-slate-900">
                      {l.employee_name || "Staff / Student"}
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-slate-800">{l.type}</p>
                      <p className="text-xs text-slate-500">{l.start_date} to {l.end_date}</p>
                    </td>
                    <td className="p-3 text-slate-600 text-xs max-w-xs">
                      {l.reason}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={l.status} />
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(l.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <FaCheck /> Approve (No Cut)
                        </button>
                        <button
                          onClick={() => handleReject(l.id)}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <FaTimes /> Reject (Salary Cut)
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={() => setModal({ ...modal, isOpen: false })}
      />
    </div>
  );
}