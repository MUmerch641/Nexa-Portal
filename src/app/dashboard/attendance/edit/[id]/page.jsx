"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { showToast } from "@/components/Toast";
import { FaCalendarCheck, FaArrowLeft } from "react-icons/fa";

export default function EditAttendance() {
  const { id } = useParams();
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    employee_id: "",
    date: "",
    status: "Present",
    check_in: "",
    check_out: "",
  });

  const getEmployees = async () => {
    const { data, error } = await supabase.from("employees").select("id, full_name");
    if (!error && data) setEmployees(data);
  };

  const getAttendance = async () => {
    const { data, error } = await supabase.from("attendance").select("*").eq("id", id).single();
    if (!error && data) setForm(data);
    setLoading(false);
  };

  useEffect(() => {
    const role = localStorage.getItem("user_role") || "employee";
    const email = (localStorage.getItem("current_user_email") || "").toLowerCase().trim();
    const adminCheck = role === "admin" || email.includes("admin") || email.includes("owner");

    if (!adminCheck) {
      showToast("Access Restricted 🔒", "Attendance editing is reserved for Admins only.", "warning");
      router.replace(role === "student" ? "/dashboard/student" : "/dashboard/employee");
      return;
    }

    if (id) {
      Promise.all([getEmployees(), getAttendance()]);
    }
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const updateAttendance = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from("attendance").update(form).eq("id", id);
      if (error) {
        showToast("Update Failed 🛑", error.message, "error");
        return;
      }
      showToast("Attendance Updated ✅", "Record saved successfully.", "success");
      setTimeout(() => router.push("/dashboard/attendance/history"), 800);
    } catch (e) {
      showToast("Error", "An unexpected error occurred.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-[#64748B]">Loading Attendance Record...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-full border border-[#2563EB]/20">
            Attendance Management
          </span>
          <h1 className="text-xl font-bold text-[#0F172A] mt-1.5 flex items-center gap-2.5">
            <FaCalendarCheck className="text-[#2563EB]" />
            <span>Edit Attendance Record</span>
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">Update check-in, check-out, and attendance status.</p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/dashboard/attendance/history")}
          className="bg-white hover:bg-[#F8FAFC] text-[#2563EB] border border-[#E2E8F0] font-semibold px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 self-start"
        >
          <FaArrowLeft className="text-xs" />
          <span>Back to History</span>
        </button>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6">
        <form onSubmit={updateAttendance} className="space-y-5 text-xs">

          {/* Row 1: Employee & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block font-semibold text-[#0F172A] uppercase tracking-wide">
                Select Employee *
              </label>
              <select
                name="employee_id"
                value={form.employee_id}
                onChange={handleChange}
                className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] bg-white font-medium"
              >
                <option value="">— Select Employee —</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-[#0F172A] uppercase tracking-wide">
                Attendance Status *
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] bg-white font-medium"
              >
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Leave">Leave</option>
                <option value="Late">Late</option>
                <option value="Half Day">Half Day</option>
              </select>
            </div>
          </div>

          {/* Row 2: Date & Check-In */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block font-semibold text-[#0F172A] uppercase tracking-wide">
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={form.date || ""}
                onChange={handleChange}
                className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] bg-white font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-[#0F172A] uppercase tracking-wide">
                Check-In Time
              </label>
              <input
                type="time"
                name="check_in"
                value={form.check_in || ""}
                onChange={handleChange}
                className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] bg-white font-medium"
              />
            </div>
          </div>

          {/* Row 3: Check-Out */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block font-semibold text-[#0F172A] uppercase tracking-wide">
                Check-Out Time
              </label>
              <input
                type="time"
                name="check_out"
                value={form.check_out || ""}
                onChange={handleChange}
                className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] bg-white font-medium"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 border-t border-[#E2E8F0]">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white font-bold py-3 rounded-xl text-xs transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              {saving ? "Saving Changes..." : "Save Attendance Changes →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
