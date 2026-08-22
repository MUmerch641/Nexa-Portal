"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { dbFetch, dbSaveRecord } from "@/lib/dbPersistence";
import { logActivity } from "@/lib/activityUtils";
import Modal from "@/components/Modal";
import { showToast } from "@/components/Toast";
import {
  FaCheck,
  FaTimes,
  FaCalendarPlus,
  FaUserClock,
  FaShieldAlt,
  FaInfoCircle,
  FaCalendarCheck,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaArrowRight,
  FaEllipsisV,
  FaTrashAlt,
  FaFileAlt
} from "react-icons/fa";

const StatusBadge = ({ status }) => {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1.5 bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/20 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
        <FaCheckCircle className="text-xs text-[#2563EB]" /> Approved (Salary Exempt)
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 bg-[#FEE2E2] text-[#991B1B] border border-[#EF4444]/20 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
        <FaTimesCircle className="text-xs text-[#991B1B]" /> Rejected (Salary Cut)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/20 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
      <FaClock className="text-xs text-[#92400E]" /> Pending HR Review
    </span>
  );
};

export default function LeavesPage() {
  const [role, setRole] = useState("employee");
  const [user, setUser] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const formFirstInputRef = useRef(null);

  const [form, setForm] = useState({
    applicantName: "",
    type: "Emergency Leave",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    reason: ""
  });
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info" });
  const [loading, setLoading] = useState(true);
  const [activeKebabId, setActiveKebabId] = useState(null);

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

  useEffect(() => {
    const storedRole = localStorage.getItem("user_role") || "admin";
    setRole(storedRole);

    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setForm(prev => ({
        ...prev,
        applicantName: session?.user?.user_metadata?.full_name || localStorage.getItem("current_user_name") || ""
      }));
    };
    fetchSession();
  }, []);

  const fetchLeaves = async () => {
    try {
      const mergedLeaves = await dbFetch("leaves", initialDemoLeaves);
      setLeaves(mergedLeaves);
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
      showToast("Missing Info ⚠️", "Please select start date, end date, and reason for leave.", "warning");
      return;
    }

    const currentEmail = localStorage.getItem("current_user_email") || "";
    const newLeave = {
      id: `leave-${Date.now()}`,
      employee_id: user?.id || "local-user",
      employee_name: form.applicantName || (role === "student" ? "Student Applicant" : "Employee Applicant"),
      applicant_email: currentEmail.toLowerCase().trim(),
      type: form.type,
      start_date: form.startDate,
      end_date: form.endDate,
      reason: form.reason,
      status: "pending",
      salary_cut: false,
      created_at: new Date().toISOString()
    };

    try {
      await dbSaveRecord("leaves", newLeave);
    } catch(e) {}

    const updated = [newLeave, ...leaves];
    setLeaves(updated);
    localStorage.setItem("software_house_leaves", JSON.stringify(updated));

    showToast("Application Submitted ⏳", "Your leave request has been submitted for HR review.", "success");
    setForm(prev => ({ ...prev, reason: "" }));
  };

  const handleApprove = async (id) => {
    const targetLeave = leaves.find(l => l.id === id);
    const updatedLeave = targetLeave ? { ...targetLeave, status: "Approved", salary_cut: false } : { id, status: "Approved", salary_cut: false };
    try {
      await dbSaveRecord("leaves", updatedLeave);
    } catch(e) {}

    const updated = leaves.map(l => l.id === id ? { ...l, status: "Approved", salary_cut: false } : l);
    setLeaves(updated);
    localStorage.setItem("software_house_leaves", JSON.stringify(updated));

    // Auto-mark attendance log as On Leave (Approved)
    const applicantName = targetLeave?.employee_name || targetLeave?.applicant_name || "Applicant";
    const todayStr = new Date().toISOString().split("T")[0];
    const leaveDate = targetLeave?.start_date || todayStr;
    const leaveAttRecord = {
      id: `att-leave-${Date.now()}`,
      user_id: applicantName,
      user_name: applicantName,
      user_role: targetLeave?.role || "student",
      attendance_status: "On Leave (Approved)",
      type: "check_in",
      total_work_hours: "Leave Authorized",
      attendance_date: leaveDate,
      check_in_time: "Leave Approved",
      public_ip: "Leave / Off-Site",
      created_at: new Date().toISOString()
    };

    try {
      const savedAttLogs = JSON.parse(localStorage.getItem("software_house_master_attendance_logs") || "[]");
      const filteredLogs = savedAttLogs.filter(a => !(a.user_name === applicantName && a.attendance_date === leaveDate));
      const newAttLogs = [leaveAttRecord, ...filteredLogs];
      localStorage.setItem("software_house_master_attendance_logs", JSON.stringify(newAttLogs));
      
      const userEmailKey = (targetLeave?.applicant_email || targetLeave?.email || "").trim().toLowerCase();
      if (userEmailKey) {
        localStorage.setItem(`today_attendance_${userEmailKey}`, JSON.stringify([leaveAttRecord]));
      }

      await dbSaveRecord("attendance", leaveAttRecord).catch(() => {});
      window.dispatchEvent(new Event("storage"));
    } catch (e) {}

    showToast("Leave Approved 🟢", "Approved by Admin. Attendance marked as 'On Leave' (Not Absent).", "success");
  };

  const handleReject = async (id) => {
    const targetLeave = leaves.find(l => l.id === id);
    const updatedLeave = targetLeave ? { ...targetLeave, status: "Rejected", salary_cut: true } : { id, status: "Rejected", salary_cut: true };
    try {
      await dbSaveRecord("leaves", updatedLeave);
    } catch(e) {}

    const updated = leaves.map(l => l.id === id ? { ...l, status: "Rejected", salary_cut: true } : l);
    setLeaves(updated);
    localStorage.setItem("software_house_leaves", JSON.stringify(updated));

    showToast("Leave Rejected 🔴", "Leave request rejected.", "info");
  };

  const focusForm = () => {
    if (formFirstInputRef.current) {
      formFirstInputRef.current.focus();
      formFirstInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const visibleLeaves = leaves.filter(l => {
    if (role === "admin" || role === "hr" || role === "manager") return true;
    const currentEmail = (localStorage.getItem("current_user_email") || "").toLowerCase().trim();
    return l.applicant_email ? l.applicant_email.toLowerCase() === currentEmail : true;
  });

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-3 text-[#0F172A]">
        <div className="w-8 h-8 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-[#64748B]">Loading Leave Management Desk...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* HEADER BANNER */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-full border border-[#2563EB]/20">
              Leave & HR Approvals
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#0F172A] mt-1.5 flex items-center gap-2.5">
            <FaUserClock className="text-[#2563EB]" />
            <span>Leave Management & Approvals</span>
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Submit leave requests with detailed reasons. HR approves (Salary Exempt) or rejects (Salary Cut Policy).
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#EFF6FF] border border-[#2563EB]/20 text-[#2563EB] px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0">
          <FaShieldAlt className="text-sm" />
          <span>Viewing Mode: <strong>{role.toUpperCase()}</strong></span>
        </div>
      </div>

      {/* 1. TOP SUMMARY STATUS CARDS (Requirement #1 - Improved Vertical Padding & Flex Alignment) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Approved */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/20 flex items-center justify-center text-xs shrink-0">
              <FaCheckCircle />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">Approved Leave Status</p>
              <h3 className="text-sm font-bold text-[#0F172A]">Salary Exempt (No Cut)</h3>
            </div>
          </div>
          <p className="text-xs text-[#64748B] leading-relaxed pt-1">
            Approved leaves incur 0 salary deduction according to software house HR policy.
          </p>
        </div>

        {/* Card 2: Rejected */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FEE2E2] text-[#991B1B] border border-[#EF4444]/20 flex items-center justify-center text-xs shrink-0">
              <FaTimesCircle />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#991B1B]">Rejected Leave Status</p>
              <h3 className="text-sm font-bold text-[#0F172A]">Salary Cut Applied</h3>
            </div>
          </div>
          <p className="text-xs text-[#64748B] leading-relaxed pt-1">
            Unapproved or rejected absences incur standard daily salary deduction.
          </p>
        </div>

        {/* Card 3: Pending */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/20 flex items-center justify-center text-xs shrink-0">
              <FaClock />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#92400E]">Pending Review</p>
              <h3 className="text-sm font-bold text-[#0F172A]">Awaiting HR Decision</h3>
            </div>
          </div>
          <p className="text-xs text-[#64748B] leading-relaxed pt-1">
            Requests currently under evaluation by the Admin/HR approval committee.
          </p>
        </div>
      </div>

      {/* 2. APPLY FOR LEAVE FORM (Requirement #2 - Fixed Textarea Min-Height & Right-Aligned Prominent CTA) */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm space-y-5">
        <div className="border-b border-[#E2E8F0] pb-3">
          <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
            <FaCalendarPlus className="text-[#2563EB]" />
            <span>Apply for Leave Request</span>
          </h2>
          <p className="text-xs text-[#64748B]">Fill in the leave application details for approval.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] uppercase mb-1">Applicant Name *</label>
              <input
                ref={formFirstInputRef}
                type="text"
                name="applicantName"
                value={form.applicantName}
                onChange={handleInputChange}
                required
                placeholder="Enter your full name"
                className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] font-medium bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] uppercase mb-1">Leave Type *</label>
              <select
                name="type"
                value={form.type}
                onChange={handleInputChange}
                required
                className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] font-medium bg-white"
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
              <label className="block text-xs font-semibold text-[#0F172A] uppercase mb-1">Start Date *</label>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleInputChange}
                required
                className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] font-medium bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] uppercase mb-1">End Date *</label>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleInputChange}
                required
                className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] font-medium bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] uppercase mb-1">Reason & Details *</label>
            <textarea
              name="reason"
              value={form.reason}
              onChange={handleInputChange}
              required
              rows={3}
              placeholder="State the detailed reason for your leave request..."
              className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] font-medium bg-white min-h-[100px] resize-y"
            />
          </div>

          {/* Right-Aligned Prominent Primary CTA Button */}
          <div className="flex justify-end pt-2 border-t border-[#E2E8F0]">
            <button
              type="submit"
              className="w-full sm:w-auto bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-6 py-3 rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Submit Leave Request</span>
              <FaArrowRight className="text-xs" />
            </button>
          </div>
        </form>
      </div>

      {/* 3. LEAVE APPLICATIONS TABLE & MODERN EMPTY STATE (Requirement #3) */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
            <FaFileAlt className="text-[#2563EB]" />
            <span>Leave Applications & Approval Status</span>
          </h2>
          <span className="text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] px-3 py-1 rounded-full border border-[#2563EB]/20">
            Total Requests: {visibleLeaves.length}
          </span>
        </div>

        {visibleLeaves.length === 0 ? (
          /* MODERN CENTERED EMPTY STATE CARD (Requirement #3) */
          <div className="py-12 px-4 text-center flex flex-col items-center justify-center space-y-3 bg-[#F8FAFC] rounded-xl border border-dashed border-[#E2E8F0]">
            <div className="w-12 h-12 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center text-xl border border-[#2563EB]/20">
              <FaCalendarCheck />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">No Pending Leave Requests</h3>
              <p className="text-xs text-[#64748B] mt-0.5 max-w-sm">
                You're all caught up! Submitted leave requests will appear here once they are created.
              </p>
            </div>
            <button
              type="button"
              onClick={focusForm}
              className="mt-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <FaCalendarPlus className="text-xs" />
              <span>Apply for Leave</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold uppercase text-[10px] tracking-wider border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-3 px-4 whitespace-nowrap">Applicant Name</th>
                  <th className="py-3 px-4 whitespace-nowrap">Type & Dates</th>
                  <th className="py-3 px-4 min-w-[200px]">Reason & Details</th>
                  <th className="py-3 px-4 whitespace-nowrap">Approval Status</th>
                  {(role === "admin" || role === "hr" || role === "manager") && (
                    <th className="py-3 px-4 text-right whitespace-nowrap">Admin Action</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {visibleLeaves.map((l, idx) => (
                  <tr key={`leave-row-${l.id || 'rec'}-${idx}`} className="hover:bg-[#F8FAFC] transition-colors align-middle">
                    <td className="py-3.5 px-4 font-semibold text-[#0F172A] whitespace-nowrap">
                      {l.employee_name || "Staff / Student"}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-bold text-[#0F172A]">{l.type}</p>
                      <p className="text-[11px] text-[#64748B] font-mono">{l.start_date} to {l.end_date}</p>
                    </td>

                    <td className="py-3.5 px-4 text-[#64748B] text-xs">
                      {l.reason}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={l.status} />
                    </td>

                    {(role === "admin" || role === "hr" || role === "manager") && (
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleApprove(l.id)}
                            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <FaCheck /> Approve (No Cut)
                          </button>

                          <button
                            type="button"
                            onClick={() => handleReject(l.id)}
                            className="bg-white hover:bg-rose-50 text-rose-600 border border-[#E2E8F0] hover:border-rose-200 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <FaTimes /> Reject (Salary Cut)
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
