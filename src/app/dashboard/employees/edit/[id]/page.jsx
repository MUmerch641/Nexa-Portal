"use client";

import { useEffect, useState } from "react";
import { dbFetch, dbSaveRecord } from "@/lib/dbPersistence";
import { useParams, useRouter } from "next/navigation";
import { showToast } from "@/components/Toast";
import { FaUserEdit, FaArrowLeft, FaSave } from "react-icons/fa";

export default function EditEmployee() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    father_name: "",
    phone: "",
    email: "",
    address: "",
    department: "",
    designation: "",
    employment_type: "",
    joining_date: "",
    status: "active",
  });

  const getEmployee = async () => {
    setLoading(true);
    try {
      const all = await dbFetch("employees");
      const found = (all || []).find(
        (e) =>
          String(e.id) === String(id) ||
          String(e.email).toLowerCase() === String(id).toLowerCase()
      );
      if (found) setForm(found);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => {
    if (id) getEmployee();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const updateEmployee = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim()) {
      showToast("Missing Fields ⚠️", "Full Name and Email are required.", "warning");
      return;
    }
    setSaving(true);
    try {
      await dbSaveRecord("employees", form);
      showToast("Employee Updated ✅", `${form.full_name}'s profile saved successfully.`, "success");
      setTimeout(() => router.push("/dashboard/employees"), 800);
    } catch (err) {
      showToast("Error", "Failed to update employee. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-[#64748B]">Loading Employee Profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-full border border-[#2563EB]/20">
            Staff Directory
          </span>
          <h1 className="text-xl font-bold text-[#0F172A] mt-1.5 flex items-center gap-2.5">
            <FaUserEdit className="text-[#2563EB]" />
            <span>Edit Employee Profile</span>
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Update employee information and save changes to the directory.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/dashboard/employees")}
          className="bg-white hover:bg-[#F8FAFC] text-[#2563EB] border border-[#E2E8F0] font-semibold px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 self-start"
        >
          <FaArrowLeft className="text-xs" />
          <span>Back to Directory</span>
        </button>
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6">
        <form onSubmit={updateEmployee} className="space-y-5 text-xs">

          {/* Section: Personal Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#2563EB] border-b border-[#E2E8F0] pb-2">
              Personal Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-semibold text-[#0F172A] uppercase tracking-wide">Full Name *</label>
                <input
                  name="full_name"
                  value={form.full_name || ""}
                  onChange={handleChange}
                  placeholder="Ali Hassan"
                  required
                  className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] bg-white font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-semibold text-[#0F172A] uppercase tracking-wide">Father / Guardian Name</label>
                <input
                  name="father_name"
                  value={form.father_name || ""}
                  onChange={handleChange}
                  placeholder="Tariq Mahmood"
                  className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] bg-white font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-semibold text-[#0F172A] uppercase tracking-wide">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={form.email || ""}
                  onChange={handleChange}
                  placeholder="staff@gmail.com"
                  required
                  className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] bg-white font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-semibold text-[#0F172A] uppercase tracking-wide">Phone Number</label>
                <input
                  name="phone"
                  value={form.phone || ""}
                  onChange={handleChange}
                  placeholder="03001234567"
                  className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] bg-white font-mono"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block font-semibold text-[#0F172A] uppercase tracking-wide">Residential Address</label>
              <input
                name="address"
                value={form.address || ""}
                onChange={handleChange}
                placeholder="Street 5, Block B, Karachi"
                className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] bg-white font-medium"
              />
            </div>
          </div>

          {/* Section: Employment Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#2563EB] border-b border-[#E2E8F0] pb-2">
              Employment Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-semibold text-[#0F172A] uppercase tracking-wide">Department *</label>
                <select
                  name="department"
                  value={form.department || ""}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] bg-white font-medium"
                >
                  <option value="">— Select Department —</option>
                  {["Web Development", "UI/UX Design", "Engineering", "QA Testing", "DevOps", "Mobile Apps", "Management", "HR"].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block font-semibold text-[#0F172A] uppercase tracking-wide">Designation</label>
                <input
                  name="designation"
                  value={form.designation || ""}
                  onChange={handleChange}
                  placeholder="Senior Developer"
                  className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] bg-white font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-semibold text-[#0F172A] uppercase tracking-wide">Employment Type</label>
                <select
                  name="employment_type"
                  value={form.employment_type || ""}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] bg-white font-medium"
                >
                  <option value="">— Select Type —</option>
                  <option value="Paid Staff (Full Time)">Paid Staff (Full Time)</option>
                  <option value="Paid Staff (Part Time)">Paid Staff (Part Time)</option>
                  <option value="Contract-Based">Contract-Based</option>
                  <option value="Remote Staff">Remote Staff</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block font-semibold text-[#0F172A] uppercase tracking-wide">Joining Date</label>
                <input
                  type="date"
                  name="joining_date"
                  value={form.joining_date || ""}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] bg-white font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-semibold text-[#0F172A] uppercase tracking-wide">Account Status</label>
                <select
                  name="status"
                  value={form.status || "active"}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] bg-white font-medium"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive / Deactivated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard/employees")}
              className="w-full sm:w-auto bg-white hover:bg-[#F8FAFC] text-[#2563EB] border border-[#E2E8F0] font-semibold py-2.5 px-6 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <FaSave className="text-xs" />
              {saving ? "Saving Changes..." : "Save Employee Changes →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
