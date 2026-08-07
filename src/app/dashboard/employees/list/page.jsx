"use client";

import { useEffect, useState } from "react";
import { dbFetch, dbDeleteRecord } from "@/lib/dbPersistence";
import Link from "next/link";
import { showToast } from "@/components/Toast";
import {
  FaUsers,
  FaEllipsisV,
  FaExclamationTriangle,
  FaUserPlus,
  FaSearch
} from "react-icons/fa";

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeKebabId, setActiveKebabId] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, emp: null, loading: false });

  const getEmployees = async () => {
    setLoading(true);
    const data = await dbFetch("employees");
    setEmployees(data || []);
    setLoading(false);
  };

  useEffect(() => {
    getEmployees();
  }, []);

  const confirmDelete = (emp) => {
    setDeleteModal({ isOpen: true, emp, loading: false });
    setActiveKebabId(null);
  };

  const executeDelete = async () => {
    if (!deleteModal.emp) return;
    setDeleteModal(prev => ({ ...prev, loading: true }));
    try {
      await dbDeleteRecord("employees", deleteModal.emp.id);
      await getEmployees();
      showToast("Employee Deleted 🗑️", `'${deleteModal.emp.full_name}' removed from directory.`, "info");
    } catch (e) {
      showToast("Error", "Failed to delete employee.", "error");
    } finally {
      setDeleteModal({ isOpen: false, emp: null, loading: false });
    }
  };

  const filteredEmployees = employees.filter(emp => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (emp.full_name || "").toLowerCase().includes(q) ||
      (emp.department || "").toLowerCase().includes(q) ||
      (emp.designation || "").toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-[#64748B]">Loading Employee Directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-full border border-[#2563EB]/20">
            Staff Directory
          </span>
          <h1 className="text-xl font-bold text-[#0F172A] mt-1.5 flex items-center gap-2.5">
            <FaUsers className="text-[#2563EB]" />
            <span>Employees</span>
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">View and manage all registered staff members.</p>
        </div>

        <Link
          href="/dashboard/employees"
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-sm shrink-0 self-start"
        >
          <FaUserPlus className="text-xs" />
          <span>+ Add Employee</span>
        </Link>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 space-y-4">

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#0F172A]">All Employees</span>
            <span className="text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] px-2.5 py-0.5 rounded-full border border-[#2563EB]/20">
              {filteredEmployees.length}
            </span>
          </div>
          <div className="relative w-full sm:w-72">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] text-xs" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search name, department, designation..."
              className="w-full pl-9 pr-3 py-1.5 text-xs text-[#0F172A] border border-[#E2E8F0] rounded-xl outline-none focus:border-[#2563EB] bg-white font-medium"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold uppercase text-[10px] tracking-wider border-b border-[#E2E8F0] sticky top-0">
              <tr>
                <th className="py-3 px-4">Employee Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center text-xl border border-[#2563EB]/20">
                        <FaUsers />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#0F172A]">No Employees Found</p>
                        <p className="text-xs text-[#64748B] mt-0.5">Add staff members to populate this directory.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const isInactive = emp.status === "inactive" || emp.status === "deactivated";
                  return (
                    <tr key={emp.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-xl bg-[#EFF6FF] text-[#2563EB] font-bold flex items-center justify-center text-xs shrink-0 border border-[#2563EB]/20">
                            {(emp.full_name || "EM").slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-semibold text-[#0F172A]">{emp.full_name || "Unknown"}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#64748B] font-medium">{emp.department || "—"}</td>
                      <td className="py-3.5 px-4 text-[#64748B] font-medium">{emp.designation || "—"}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          isInactive
                            ? "bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]"
                            : "bg-[#EFF6FF] text-[#2563EB] border-[#2563EB]/20"
                        }`}>
                          {isInactive ? "Inactive" : emp.status || "Active"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/employees/edit/${emp.id}`}
                            className="text-[#2563EB] hover:underline font-semibold text-xs"
                          >
                            Edit →
                          </Link>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setActiveKebabId(activeKebabId === emp.id ? null : emp.id)}
                              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                            >
                              <FaEllipsisV className="text-xs" />
                            </button>
                            {activeKebabId === emp.id && (
                              <div className="absolute right-0 mt-1 w-40 rounded-xl bg-white p-1.5 shadow-lg border border-[#E2E8F0] z-30 text-xs animate-in fade-in zoom-in-95 duration-100">
                                <Link
                                  href={`/dashboard/employees/edit/${emp.id}`}
                                  className="block w-full text-left px-3 py-1.5 rounded-lg hover:bg-[#EFF6FF] text-[#0F172A] hover:text-[#2563EB] font-semibold transition-colors"
                                >
                                  Edit Details
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => confirmDelete(emp)}
                                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 font-semibold transition-colors"
                                >
                                  Delete Record
                                </button>
                              </div>
                            )}
                          </div>
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
              <h3 className="font-bold text-[#0F172A] text-base">Delete Employee Record</h3>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-[#0F172A]">{deleteModal.emp?.full_name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, emp: null, loading: false })}
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
