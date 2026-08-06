"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { dbFetch, dbDeleteRecord } from "@/lib/dbPersistence";
import { FaCalendarAlt, FaHistory, FaUndo, FaTrashAlt, FaEdit, FaUserCheck } from "react-icons/fa";

export default function AttendanceHistory() {
  const router = useRouter();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  // Date Range Filters State
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const getAttendance = async () => {
    setLoading(true);
    const data = await dbFetch("attendance");
    setAttendance(data);
    setLoading(false);
  };

  useEffect(() => {
    getAttendance();
  }, []);

  const deleteAttendance = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this attendance record?");
    if (!confirmDelete) return;

    try {
      await supabase.from("attendance").delete().eq("id", id);
      const updated = attendance.filter(item => (item.id !== id && item.attendance_id !== id));
      setAttendance(updated);

      try {
        localStorage.setItem("software_house_master_attendance_logs", JSON.stringify(updated));
      } catch (e) {}
    } catch (e) {
      alert("Failed to delete record.");
    }
  };

  const handleResetFilters = () => {
    setFromDate("");
    setToDate("");
  };

  // Filter attendance records by From Date and To Date
  const filteredAttendance = attendance.filter((item) => {
    const itemDateStr = item.attendance_date || item.date || (item.timestamp ? item.timestamp.split("T")[0] : "");
    if (!itemDateStr) return true;

    if (fromDate && itemDateStr < fromDate) return false;
    if (toDate && itemDateStr > toDate) return false;
    return true;
  });

  const getStatusBadge = (statusStr, lightStatus) => {
    const s = (statusStr || lightStatus || "Present").toLowerCase();
    if (s.includes("late") || lightStatus === "orange") {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
          Late
        </span>
      );
    }
    if (s.includes("absent") || s.includes("deduction") || lightStatus === "red") {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
          Absent
        </span>
      );
    }
    if (s.includes("half") || s.includes("part")) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300">
          Half Day
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
        Present
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FaHistory className="text-blue-600" />
            <span>Attendance History & Date Filter</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            View detailed employee & student check-in/out logs for any date range
          </p>
        </div>

        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 w-fit">
          Records Found: <strong>{filteredAttendance.length}</strong> {fromDate || toDate ? `(of ${attendance.length})` : ""}
        </span>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-end gap-4">
        <div className="w-full sm:w-auto flex-1">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
            <FaCalendarAlt className="text-blue-600" /> From Date
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 bg-white"
          />
        </div>

        <div className="w-full sm:w-auto flex-1">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
            <FaCalendarAlt className="text-blue-600" /> To Date
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 bg-white"
          />
        </div>

        {(fromDate || toDate) && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs transition-all border border-slate-300 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FaUndo className="text-xs" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* History Table */}
      <div className="overflow-x-auto rounded-xl bg-white border border-slate-200 shadow-2xs">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b border-slate-200">
            <tr>
              <th className="p-3.5">Employee / User</th>
              <th className="p-3.5">Role</th>
              <th className="p-3.5">Date</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Clock In</th>
              <th className="p-3.5">Clock Out</th>
              <th className="p-3.5">Total Duration</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 font-mono">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400 font-sans font-semibold">
                  Loading attendance records...
                </td>
              </tr>
            ) : filteredAttendance.length > 0 ? (
              filteredAttendance.map((item, idx) => {
                const userName = item.user_name || item.employees?.full_name || item.user_email || item.user_id || "Employee";
                const dateStr = item.attendance_date || item.date || (item.timestamp ? item.timestamp.split("T")[0] : "N/A");
                const clockIn = item.check_in_time || item.check_in || "N/A";
                const clockOut = item.check_out_time || item.check_out || "Not Checked Out";
                const workHours = item.total_work_hours || "In Progress";
                const roleLabel = item.user_role === "student" || item.user_role === "course_student" ? "Student" : "Employee";

                return (
                  <tr key={item.id || idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 font-sans">
                      {userName}
                    </td>

                    <td className="p-3.5 font-sans">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase ${
                        roleLabel === "Student" ? "bg-amber-50 text-amber-900 border-amber-200" : "bg-blue-50 text-blue-900 border-blue-200"
                      }`}>
                        {roleLabel}
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-800 font-bold">
                      {dateStr}
                    </td>

                    <td className="p-3.5 font-sans">
                      {getStatusBadge(item.attendance_status || item.status, item.light_status)}
                    </td>

                    <td className="p-3.5 text-emerald-700 font-bold">
                      {clockIn}
                    </td>

                    <td className="p-3.5 text-slate-600">
                      {clockOut}
                    </td>

                    <td className="p-3.5 font-bold text-indigo-700 font-sans">
                      {workHours}
                    </td>

                    <td className="p-3.5 text-right font-sans">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/dashboard/attendance/edit/${item.id || item.attendance_id}`)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <FaEdit className="text-[10px]" /> Edit
                        </button>

                        <button
                          onClick={() => deleteAttendance(item.id || item.attendance_id)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <FaTrashAlt className="text-[10px]" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="p-12 text-center text-slate-500 font-sans">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <span className="text-3xl">📅</span>
                    <p className="font-bold text-slate-700">No attendance records found.</p>
                    {(fromDate || toDate) && (
                      <p className="text-slate-400 text-xs">
                        No records match the selected date range ({fromDate || "..."} to {toDate || "..."}).
                      </p>
                    )}
                    {(fromDate || toDate) && (
                      <button
                        onClick={handleResetFilters}
                        className="mt-1 px-3 py-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs transition-colors"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}