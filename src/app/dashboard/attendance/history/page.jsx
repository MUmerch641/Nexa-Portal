"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { dbFetch } from "@/lib/dbPersistence";
import { showToast } from "@/components/Toast";
import {
  FaCalendarAlt,
  FaHistory,
  FaUndo,
  FaTrashAlt,
  FaEdit,
  FaExclamationTriangle,
  FaSearch,
  FaUserCheck
} from "react-icons/fa";

const StatusBadge = ({ status, lightStatus }) => {
  const s = (status || lightStatus || "Present").toLowerCase();

  if (s.includes("late") || lightStatus === "orange") {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/20 whitespace-nowrap">
        Late
      </span>
    );
  }
  if (s.includes("absent") || s.includes("deduction") || lightStatus === "red") {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] whitespace-nowrap">
        Absent
      </span>
    );
  }
  if (s.includes("half") || s.includes("part")) {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/20 whitespace-nowrap">
        Half Day
      </span>
    );
  }
  if (s.includes("leave")) {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/20 whitespace-nowrap">
        On Leave
      </span>
    );
  }
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/20 whitespace-nowrap">
      Present
    </span>
  );
};

export default function AttendanceHistory() {
  const router = useRouter();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, record: null, loading: false });

  const getAttendance = async () => {
    setLoading(true);
    const data = await dbFetch("attendance");
    setAttendance(data || []);
    setLoading(false);
  };

  useEffect(() => {
    getAttendance();
  }, []);

  const confirmDelete = (record) => {
    setDeleteModal({ isOpen: true, record, loading: false });
  };

  const executeDelete = async () => {
    if (!deleteModal.record) return;
    setDeleteModal(prev => ({ ...prev, loading: true }));
    const id = deleteModal.record.id || deleteModal.record.attendance_id;
    try {
      await supabase.from("attendance").delete().eq("id", id);
      const updated = attendance.filter(item => item.id !== id && item.attendance_id !== id);
      setAttendance(updated);
      try {
        localStorage.setItem("software_house_master_attendance_logs", JSON.stringify(updated));
      } catch (e) {}
      showToast("Record Deleted 🗑️", "Attendance entry removed successfully.", "info");
    } catch (e) {
      showToast("Error", "Failed to delete record.", "error");
    } finally {
      setDeleteModal({ isOpen: false, record: null, loading: false });
    }
  };

  const handleResetFilters = () => {
    setFromDate("");
    setToDate("");
    setSearchQuery("");
  };

  const filteredAttendance = attendance.filter((item) => {
    const itemDateStr = item.attendance_date || item.date || (item.timestamp ? item.timestamp.split("T")[0] : "");
    if (fromDate && itemDateStr && itemDateStr < fromDate) return false;
    if (toDate && itemDateStr && itemDateStr > toDate) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (item.user_name || item.employees?.full_name || item.user_email || "").toLowerCase();
      const role = (item.user_role || "").toLowerCase();
      if (!name.includes(q) && !role.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-full border border-[#2563EB]/20">
            Attendance Records
          </span>
          <h1 className="text-xl font-bold text-[#0F172A] mt-1.5 flex items-center gap-2.5">
            <FaHistory className="text-[#2563EB]" />
            <span>Attendance History & Date Filter</span>
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Detailed check-in/out logs for employees and students across any date range.
          </p>
        </div>
        <span className="text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] px-3 py-1.5 rounded-xl border border-[#2563EB]/20 shrink-0 self-start">
          {filteredAttendance.length} Records {(fromDate || toDate || searchQuery) ? `of ${attendance.length}` : ""}
        </span>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm flex flex-col sm:flex-row flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-semibold uppercase tracking-wide text-[#64748B] mb-1 flex items-center gap-1.5">
            <FaCalendarAlt className="text-[#2563EB]" /> From Date
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] bg-white"
          />
        </div>

        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-semibold uppercase tracking-wide text-[#64748B] mb-1 flex items-center gap-1.5">
            <FaCalendarAlt className="text-[#2563EB]" /> To Date
          </label>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] bg-white"
          />
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold uppercase tracking-wide text-[#64748B] mb-1">Search</label>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-xs" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Name, email, role..."
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#E2E8F0] text-xs text-[#0F172A] outline-none focus:border-[#2563EB] bg-white"
            />
          </div>
        </div>

        {(fromDate || toDate || searchQuery) && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="bg-[#F8FAFC] hover:bg-[#EFF6FF] text-[#2563EB] border border-[#E2E8F0] font-semibold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <FaUndo className="text-xs" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold uppercase text-[10px] tracking-wider border-b border-[#E2E8F0] sticky top-0">
              <tr>
                <th className="py-3 px-4">Employee / User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Clock In</th>
                <th className="py-3 px-4">Clock Out</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#64748B] font-medium text-xs">
                    Loading attendance records...
                  </td>
                </tr>
              ) : filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center text-xl border border-[#2563EB]/20">
                        <FaUserCheck />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#0F172A]">No Attendance Records Found</p>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          {(fromDate || toDate || searchQuery) ? "No records match the selected filters." : "Attendance records will appear here once marked."}
                        </p>
                      </div>
                      {(fromDate || toDate || searchQuery) && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((item, idx) => {
                  const userName = item.user_name || item.employees?.full_name || item.user_email || item.user_id || "Employee";
                  const dateStr = item.attendance_date || item.date || (item.timestamp ? item.timestamp.split("T")[0] : "N/A");
                  const clockIn = item.check_in_time || item.check_in || "N/A";
                  const clockOut = item.check_out_time || item.check_out || "—";
                  const workHours = item.total_work_hours || "In Progress";
                  const roleLabel = (item.user_role === "student" || item.user_role === "course_student") ? "Student" : "Employee";
                  const recordId = item.id || item.attendance_id;

                  return (
                    <tr key={`att-history-${recordId || idx}`} className="hover:bg-[#F8FAFC] transition-colors align-middle">
                      <td className="py-3.5 px-4 font-semibold text-[#0F172A]">{userName}</td>

                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                          roleLabel === "Student"
                            ? "bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]/20"
                            : "bg-[#EFF6FF] text-[#2563EB] border-[#2563EB]/20"
                        }`}>
                          {roleLabel}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[#0F172A] font-semibold">{dateStr}</td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={item.attendance_status || item.status} lightStatus={item.light_status} />
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[#2563EB] font-semibold">{clockIn}</td>
                      <td className="py-3.5 px-4 font-mono text-[#64748B]">{clockOut}</td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#0F172A]">{workHours}</td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => router.push(`/dashboard/attendance/edit/${recordId}`)}
                            className="bg-[#EFF6FF] hover:bg-[#2563EB] hover:text-white text-[#2563EB] border border-[#2563EB]/20 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <FaEdit className="text-[10px]" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDelete(item)}
                            className="bg-[#F8FAFC] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-[#64748B] border border-[#E2E8F0] px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <FaTrashAlt className="text-[10px]" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Delete Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E2E8F0] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-[#E2E8F0] pb-3">
              <FaExclamationTriangle className="text-xl text-[#2563EB]" />
              <h3 className="font-bold text-[#0F172A] text-base">Delete Attendance Record</h3>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Are you sure you want to permanently delete this attendance entry? This action cannot be undone.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, record: null, loading: false })}
                className="flex-1 py-2.5 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#2563EB] border border-[#E2E8F0] font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDelete}
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
