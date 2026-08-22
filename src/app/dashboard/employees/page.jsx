"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { dbFetch, dbSaveRecord } from "@/lib/dbPersistence";
import { logActivity, initActivityStatusTracker } from "@/lib/activityUtils";
import Modal from "@/components/Modal";
import { showToast } from "@/components/Toast";
import { registerEmployeeWithCredentials } from "@/lib/studentEnrollmentUtils";
import {
  FaUsers,
  FaUserPlus,
  FaUserTie,
  FaTrash,
  FaCheckCircle,
  FaFileDownload,
  FaSignOutAlt,
  FaInfoCircle,
  FaUserCheck,
  FaClock,
  FaTasks,
  FaMoneyBillWave,
  FaDesktop,
  FaExclamationTriangle,
  FaAward,
  FaShieldAlt,
  FaEllipsisV,
  FaSearch,
  FaDownload
} from "react-icons/fa";

const INITIAL_DEMO_EMPLOYEES = [
  { id: "emp-101", full_name: "Muhammad Ali", father_name: "Tariq Mahmood", email: "ali.staff@gmail.com", phone: "03001234567", department: "Web Development", designation: "Senior Lead Developer", employment_type: "Paid Staff (Full Time)", joining_date: "2025-01-15", status: "active" },
  { id: "emp-102", full_name: "Sara Khan", father_name: "Abdul Rehman", email: "sara.design@gmail.com", phone: "03219876543", department: "UI/UX Design", designation: "Lead Designer", employment_type: "Paid Staff (Full Time)", joining_date: "2025-02-01", status: "active" },
  { id: "emp-103", full_name: "Muhammad Rahim Bugti", father_name: "Hussain Bugti", email: "rahim.staff@gmail.com", phone: "03335554433", department: "Engineering", designation: "Senior Full-Stack Developer", employment_type: "Paid Staff (Full Time)", joining_date: "2025-01-01", status: "active" }
];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);

  // Modals & Popup State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedHistoryModal, setSelectedHistoryModal] = useState(null);
  const [resignModal, setResignModal] = useState(null);
  const [activeKebabId, setActiveKebabId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: "", emp: null, loading: false });

  // Add Employee Form State (Cleaned of duplicate fields)
  const [form, setForm] = useState({
    full_name: "",
    father_name: "",
    phone: "",
    email: "",
    assigned_password: "employeepassword123",
    blood_group: "O+",
    address: "",
    guardian_phone: "",
    emergency_phone: "",
    department: "Web Development",
    designation: "Senior Lead Developer",
    employment_type: "Paid Staff (Full Time)",
    joining_date: new Date().toISOString().split("T")[0],
  });

  const [emailError, setEmailError] = useState("");
  const [nameError, setNameError] = useState("");

  const [role, setRole] = useState("admin");
  const [userEmail, setUserEmail] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  // Fetch Employees & Deduplicate
  const fetchEmployees = async () => {
    setFetching(true);
    const rawEmps = await dbFetch("employees", INITIAL_DEMO_EMPLOYEES);
    
    // Deduplicate employees strictly by ID / Email
    const map = new Map();
    (rawEmps || []).forEach(e => {
      if (!e) return;
      const key = String(e.id || e.email).toLowerCase().trim();
      if (key && !map.has(key)) {
        map.set(key, e);
      }
    });
    setEmployees(Array.from(map.values()));
    setFetching(false);
  };

  useEffect(() => {
    const savedRole = localStorage.getItem("user_role") || "admin";
    const savedEmail = localStorage.getItem("current_user_email") || "";
    setRole(savedRole);
    setUserEmail(savedEmail);
    fetchEmployees();

    const cleanupTracker = initActivityStatusTracker(savedEmail);
    const handleStorageChange = () => fetchEmployees();
    window.addEventListener("storage", handleStorageChange);

    return () => {
      cleanupTracker();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === "email") setEmailError("");
    if (name === "full_name") setNameError("");
  };

  // Add Employee Form Handler
  const addEmployee = async (e) => {
    e.preventDefault();
    setEmailError("");
    setNameError("");

    const trimmedName = (form.full_name || "").trim();
    const trimmedEmail = (form.email || "").trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !form.department) {
      showToast("Missing Fields ⚠️", "Please enter Full Name, Email, and Department.", "warning");
      return;
    }

    if (trimmedName.length < 2) {
      setNameError("Employee name must be at least 2 characters long.");
      return;
    }

    // Check Duplicate Email
    const duplicate = employees.find(emp => (emp?.email || "").trim().toLowerCase() === trimmedEmail);
    if (duplicate) {
      setEmailError("This email address is already registered.");
      showToast("Duplicate Email ⚠️", `Email address ${trimmedEmail} is already registered to ${duplicate.full_name}.`, "error");
      return;
    }

    if (!form.assigned_password || form.assigned_password.length < 6) {
      showToast("Password Security Error 🔴", "Temporary password must be at least 6 characters long.", "error");
      return;
    }

    if (form.confirm_password && form.assigned_password !== form.confirm_password) {
      showToast("Password Mismatch 🔴", "Passwords do not match. Please re-enter.", "error");
      return;
    }

    setLoading(true);

    try {
      const res = await registerEmployeeWithCredentials({
        employeeData: {
          full_name: trimmedName,
          father_name: form.father_name || "",
          email: trimmedEmail,
          phone: form.phone || "",
          blood_group: form.blood_group || "O+",
          department: form.department,
          designation: form.designation || "Staff Member",
          employment_type: form.employment_type || "Paid Staff (Full Time)",
          joining_date: form.joining_date || new Date().toISOString().split("T")[0],
          address: form.address || "",
          guardian_phone: form.guardian_phone || "",
          emergency_phone: form.emergency_phone || "",
        },
        password: form.assigned_password,
      });

      await fetchEmployees();
      setLoading(false);
      setIsAddModalOpen(false);

      showToast("Employee Account Created 🎉", `Staff record & login created for ${trimmedName}.`, "success");

      setForm({
        full_name: "",
        father_name: "",
        phone: "",
        email: "",
        assigned_password: "employeepassword123",
        confirm_password: "employeepassword123",
        blood_group: "O+",
        address: "",
        guardian_phone: "",
        emergency_phone: "",
        department: "Web Development",
        designation: "Senior Lead Developer",
        employment_type: "Paid Staff (Full Time)",
        joining_date: new Date().toISOString().split("T")[0],
      });
    } catch (err) {
      setLoading(false);
      const msg = err.message || "Failed to create employee account.";
      setEmailError(msg);
      showToast("Error 🔴", msg, "error");
    }
  };

  // Confirmation action execution (Deactivate / Reactivate / Delete)
  const handleExecuteConfirmedAction = async () => {
    if (!confirmModal.emp) return;
    const { type, emp } = confirmModal;
    setConfirmModal(prev => ({ ...prev, loading: true }));

    if (type === "deactivate") {
      const updatedList = employees.map(e => e.id === emp.id ? { ...e, status: "inactive" } : e);
      setEmployees(updatedList);
      try {
        localStorage.setItem("persistent_employees", JSON.stringify(updatedList));
        await supabase.from("employees").update({ status: "inactive" }).eq("id", emp.id);
      } catch(e) {}
      showToast("Employee Deactivated 🛑", `Account for ${emp.full_name} deactivated. Historical data preserved.`, "info");
    } else if (type === "reactivate") {
      const updatedList = employees.map(e => e.id === emp.id ? { ...e, status: "active" } : e);
      setEmployees(updatedList);
      try {
        localStorage.setItem("persistent_employees", JSON.stringify(updatedList));
        await supabase.from("employees").update({ status: "active" }).eq("id", emp.id);
      } catch(e) {}
      showToast("Employee Reactivated 🟢", `Account for ${emp.full_name} reactivated.`, "success");
    } else if (type === "delete") {
      const updatedList = employees.filter(e => e.id !== emp.id);
      setEmployees(updatedList);
      try {
        localStorage.setItem("persistent_employees", JSON.stringify(updatedList));
        await supabase.from("employees").delete().eq("id", emp.id);
      } catch(e) {}
      showToast("Employee Deleted 🗑️", `'${emp.full_name}' purged permanently.`, "info");
    }

    setConfirmModal({ isOpen: false, type: "", emp: null, loading: false });
  };

  // Export Employees Directory to CSV
  const handleExportCsv = () => {
    let csv = "ID,Full Name,Email,Department,Designation,Employment Type,Status,Joining Date\n";
    filteredEmployees.forEach(e => {
      csv += `"${e.id}","${e.full_name}","${e.email}","${e.department}","${e.designation}","${e.employment_type}","${e.status}","${e.joining_date || ''}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `employees_directory_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  // Print Experience Letter
  const handlePrintExperienceLetter = (emp) => {
    const todayStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Official Experience Certificate - ${emp.full_name}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #0f172a; background: #fff; }
            .certificate-box { border: 8px solid #2563eb; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .company-name { font-size: 24px; font-weight: bold; color: #2563eb; letter-spacing: 2px; }
            .cert-title { font-size: 18px; font-weight: bold; text-align: center; margin: 30px 0; text-decoration: underline; }
            .content { font-size: 14px; line-height: 1.8; color: #334155; margin-bottom: 40px; }
            .highlight { font-weight: bold; color: #0f172a; }
            .signatures { display: flex; justify-content: space-between; margin-top: 60px; padding-top: 30px; border-top: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="certificate-box">
            <div class="header">
              <div class="company-name">NEXA SOFTWARE HOUSE (PVT) LTD</div>
              <div style="font-size:12px; color:#64748b;">Human Resources & People Operations</div>
            </div>
            <div class="cert-title">TO WHOM IT MAY CONCERN</div>
            <div class="content">
              This is to certify that <span class="highlight">${emp.full_name}</span> (Father/Guardian: ${emp.father_name || 'N/A'}) served as <span class="highlight">${emp.designation}</span> in the <span class="highlight">${emp.department}</span> Department from <span class="highlight">${emp.joining_date || '2025-01-01'}</span> to <span class="highlight">${todayStr}</span>.
              <br/><br/>
              During their tenure, they demonstrated outstanding technical skills, professionalism, and dedication to software deliverables. Having tendered their resignation, we accept their resignation and wish them every success.
            </div>
            <div class="signatures">
              <div><strong>Head of HR</strong><br/>Nexa Software House</div>
              <div><strong>Date: ${todayStr}</strong></div>
              <div><strong>Chief Executive Officer</strong><br/>Nexa Innovation</div>
            </div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const isInactive = emp.status === "inactive" || emp.status === "deactivated";
      if (isInactive && !showInactive) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        (emp.full_name || "").toLowerCase().includes(q) ||
        (emp.email || "").toLowerCase().includes(q) ||
        (emp.department || "").toLowerCase().includes(q) ||
        (emp.designation || "").toLowerCase().includes(q)
      );
    });
  }, [employees, searchQuery, showInactive]);

  return (
    <div className="space-y-6">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] flex items-center gap-2.5">
            <FaUsers className="text-[#2563EB]" />
            <span>Paid Employees & Staff Directory</span>
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Manage full-time & part-time software house staff profiles and exit letters.
          </p>
        </div>

        {(role === "admin" || role === "hr" || role === "manager") && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="bg-white hover:bg-[#F8FAFC] text-[#2563EB] border border-[#E2E8F0] font-semibold px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <FaDownload className="text-xs" /> Export CSV
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <FaUserPlus className="text-xs" />
              <span>+ Add Staff</span>
            </button>
          </div>
        )}
      </div>

      {/* STAFF DIRECTORY TABLE CONTAINER */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4 p-6">
        
        {/* Table Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#0F172A]">Staff Members</span>
            <span className="text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] px-2.5 py-0.5 rounded-full border border-[#2563EB]/20">
              {filteredEmployees.length} Total
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-medium text-[#64748B] cursor-pointer bg-[#F8FAFC] px-3 py-1.5 rounded-xl border border-[#E2E8F0]">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded text-[#2563EB] focus:ring-0 cursor-pointer"
              />
              <span>Show Inactive Staff</span>
            </label>

            <div className="relative w-full sm:w-72">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] text-xs" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employees by name, department, designation..."
                className="w-full pl-9 pr-3 py-1.5 text-xs text-[#0F172A] border border-[#E2E8F0] rounded-xl outline-none focus:border-[#2563EB] transition-colors bg-white font-medium"
              />
            </div>
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold uppercase text-[10px] tracking-wider border-b border-[#E2E8F0] sticky top-0">
              <tr>
                <th className="py-3 px-4">Employee Name & ID</th>
                <th className="py-3 px-4">Department & Title</th>
                <th className="py-3 px-4">Contact Email</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] font-normal">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#64748B] italic">
                    No employees matching search query.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp, idx) => {
                  const isInactive = emp.status === "inactive" || emp.status === "deactivated";
                  const emailKey = (emp.email || "").toLowerCase().trim();

                  let liveStatus = "Offline";
                  try {
                    const statusMap = JSON.parse(localStorage.getItem("software_house_realtime_activity_statuses") || "{}");
                    const userStat = statusMap[emailKey];
                    if (userStat && userStat.status) liveStatus = userStat.status;
                  } catch(e) {}

                  return (
                    <tr key={`emp-row-${emp.id || emp.email || 'id'}-${idx}`} className="hover:bg-[#F8FAFC] transition-colors group">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-[#EFF6FF] text-[#2563EB] font-bold flex items-center justify-center text-xs shrink-0 border border-[#2563EB]/20">
                            {emp.full_name?.slice(0, 2).toUpperCase() || "EM"}
                          </div>
                          <div>
                            <p className="font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                              {emp.full_name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-mono text-[#64748B]">{emp.id}</span>
                              <span className="text-[10px] font-semibold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.2 rounded">
                                • {emp.employment_type || "Paid Staff"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-[#0F172A]">
                        <p className="font-bold text-[#0F172A]">{emp.designation || "Staff Member"}</p>
                        <p className="text-[11px] text-[#64748B]">{emp.department}</p>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[#64748B]">
                        {emp.email}
                      </td>

                      {/* Status Badges: Padding 6px 12px (px-3 py-1), Border #E2E8F0, Rounded 999px */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                          isInactive
                            ? "bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]"
                            : liveStatus === "Online"
                            ? "bg-[#EFF6FF] text-[#2563EB] border-[#2563EB]/20"
                            : "bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]"
                        }`}>
                          <span>{isInactive ? "🔴 Deactivated" : liveStatus === "Online" ? "🟢 Online" : "⚪ Offline"}</span>
                        </span>
                      </td>

                      {/* Reduced Action Noise: Text link `View History →` + Kebab Menu (⋮) */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedHistoryModal(emp)}
                            className="text-[#2563EB] hover:underline font-semibold text-xs cursor-pointer"
                          >
                            View History →
                          </button>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setActiveKebabId(activeKebabId === emp.id ? null : emp.id)}
                              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                            >
                              <FaEllipsisV className="text-xs" />
                            </button>

                            {activeKebabId === emp.id && (
                              <div className={`absolute right-0 w-44 rounded-xl bg-white p-1.5 shadow-xl border border-[#E2E8F0] z-50 space-y-0.5 text-xs text-left animate-in fade-in zoom-in-95 duration-100 ${
                                idx >= Math.max(0, filteredEmployees.length - 2)
                                  ? "bottom-full mb-1 origin-bottom-right"
                                  : "top-full mt-1 origin-top-right"
                              }`}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedHistoryModal(emp);
                                    setActiveKebabId(null);
                                  }}
                                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[#EFF6FF] text-[#0F172A] hover:text-[#2563EB] font-semibold transition-colors"
                                >
                                  View Full History
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={() => {
                                    setResignModal(emp);
                                    setActiveKebabId(null);
                                  }}
                                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[#EFF6FF] text-[#0F172A] hover:text-[#2563EB] font-semibold transition-colors"
                                >
                                  Generate Certificate
                                </button>

                                {isInactive ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setConfirmModal({ isOpen: true, type: "reactivate", emp, loading: false });
                                      setActiveKebabId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[#EFF6FF] text-[#2563EB] font-semibold transition-colors"
                                  >
                                    Reactivate Account
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setConfirmModal({ isOpen: true, type: "deactivate", emp, loading: false });
                                      setActiveKebabId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[#F8FAFC] text-[#64748B] font-semibold transition-colors"
                                  >
                                    Deactivate Account
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    setConfirmModal({ isOpen: true, type: "delete", emp, loading: false });
                                    setActiveKebabId(null);
                                  }}
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

      {/* ADD EMPLOYEE MODAL (Centered Responsive Dialog) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-[#E2E8F0] space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                  <FaUserPlus className="text-[#2563EB]" />
                  <span>Add New Paid Staff Member</span>
                </h3>
                <p className="text-xs text-[#64748B]">Fill in employee information below.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A] font-bold text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={addEmployee} className="space-y-4 text-xs">
              
              {/* SECTION 1: PERSONAL INFORMATION */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#2563EB] border-b border-[#E2E8F0] pb-1">
                  Personal Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-[#64748B]">Full Name *</label>
                    <input
                      type="text"
                      name="full_name"
                      required
                      value={form.full_name}
                      onChange={handleChange}
                      placeholder="e.g. Ali Hassan"
                      className="w-full p-2.5 rounded-xl border border-[#E2E8F0] font-semibold text-[#0F172A] outline-none focus:border-[#2563EB]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[#64748B]">Father / Guardian Name</label>
                    <input
                      type="text"
                      name="father_name"
                      value={form.father_name}
                      onChange={handleChange}
                      placeholder="e.g. Tariq Mahmood"
                      className="w-full p-2.5 rounded-xl border border-[#E2E8F0] font-semibold text-[#0F172A] outline-none focus:border-[#2563EB]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[#64748B]">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="ali.staff@gmail.com"
                      className="w-full p-2.5 rounded-xl border border-[#E2E8F0] font-semibold text-[#0F172A] outline-none focus:border-[#2563EB]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[#64748B]">Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="03001234567"
                      className="w-full p-2.5 rounded-xl border border-[#E2E8F0] font-semibold text-[#0F172A] outline-none focus:border-[#2563EB]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#64748B]">Residential Address</label>
                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="House #, Street, City..."
                    className="w-full p-2.5 rounded-xl border border-[#E2E8F0] font-semibold text-[#0F172A] outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              {/* SECTION 2: EMPLOYMENT INFORMATION */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#2563EB] border-b border-[#E2E8F0] pb-1">
                  Employment Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-[#64748B]">Department *</label>
                    <input
                      type="text"
                      name="department"
                      required
                      value={form.department}
                      onChange={handleChange}
                      placeholder="e.g. Web Development"
                      className="w-full p-2.5 rounded-xl border border-[#E2E8F0] font-semibold text-[#0F172A] outline-none focus:border-[#2563EB]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[#64748B]">Designation / Title *</label>
                    <input
                      type="text"
                      name="designation"
                      required
                      value={form.designation}
                      onChange={handleChange}
                      placeholder="e.g. Senior Lead Developer"
                      className="w-full p-2.5 rounded-xl border border-[#E2E8F0] font-semibold text-[#0F172A] outline-none focus:border-[#2563EB]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[#64748B]">Employment Type *</label>
                    <select
                      name="employment_type"
                      value={form.employment_type}
                      onChange={handleChange}
                      className="w-full p-2.5 rounded-xl border border-[#E2E8F0] font-semibold text-[#0F172A] outline-none focus:border-[#2563EB] bg-white"
                    >
                      <option value="Paid Staff (Full Time)">Paid Staff (Full Time)</option>
                      <option value="Paid Staff (Part Time)">Paid Staff (Part Time)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[#64748B]">Joining Date</label>
                    <input
                      type="date"
                      name="joining_date"
                      value={form.joining_date}
                      onChange={handleChange}
                      className="w-full p-2.5 rounded-xl border border-[#E2E8F0] font-semibold text-[#0F172A] outline-none focus:border-[#2563EB]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: EMERGENCY CONTACT */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#2563EB] border-b border-[#E2E8F0] pb-1">
                  Emergency Contact & Password
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-[#64748B]">Guardian Phone Number</label>
                    <input
                      type="text"
                      name="guardian_phone"
                      value={form.guardian_phone}
                      onChange={handleChange}
                      placeholder="03219876543"
                      className="w-full p-2.5 rounded-xl border border-[#E2E8F0] font-semibold text-[#0F172A] outline-none focus:border-[#2563EB]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[#64748B]">Assign Login Password *</label>
                    <input
                      type="text"
                      name="assigned_password"
                      required
                      value={form.assigned_password}
                      onChange={handleChange}
                      className="w-full p-2.5 rounded-xl border border-[#E2E8F0] font-semibold text-[#0F172A] outline-none focus:border-[#2563EB]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] font-semibold text-[#2563EB] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold cursor-pointer"
                >
                  {loading ? "Saving..." : "Save Paid Employee Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DESTRUCTIVE MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E2E8F0] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-[#E2E8F0] pb-3 text-[#0F172A]">
              <FaExclamationTriangle className="text-xl text-[#2563EB]" />
              <h3 className="font-bold text-[#0F172A] text-base">Confirm Employee Action</h3>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Are you sure you want to {confirmModal.type} account for <strong className="text-[#0F172A]">"{confirmModal.emp?.full_name}"</strong>?
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, type: "", emp: null, loading: false })}
                className="flex-1 py-2.5 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#2563EB] border border-[#E2E8F0] font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirmedAction}
                disabled={confirmModal.loading}
                className="flex-1 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs cursor-pointer flex items-center justify-center"
              >
                {confirmModal.loading ? "Processing..." : "Confirm Action"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMPLOYEE HISTORY MODAL */}
      {selectedHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#E2E8F0] space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-md border border-[#2563EB]/20">
                  Full Employee Personal Record
                </span>
                <h3 className="text-lg font-bold text-[#0F172A] mt-1">{selectedHistoryModal.full_name}</h3>
                <p className="text-xs font-mono text-[#64748B]">{selectedHistoryModal.email}</p>
              </div>
              <button
                onClick={() => setSelectedHistoryModal(null)}
                className="text-[#64748B] hover:text-[#0F172A] text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
                <p className="text-[#64748B] font-semibold uppercase text-[10px]">Department</p>
                <p className="text-[#0F172A] font-bold text-xs">{selectedHistoryModal.department}</p>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
                <p className="text-[#64748B] font-semibold uppercase text-[10px]">Designation</p>
                <p className="text-[#0F172A] font-bold text-xs">{selectedHistoryModal.designation}</p>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
                <p className="text-[#64748B] font-semibold uppercase text-[10px]">Phone Number</p>
                <p className="text-[#0F172A] font-mono text-xs">{selectedHistoryModal.phone || "03001234567"}</p>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
                <p className="text-[#64748B] font-semibold uppercase text-[10px]">Guardian Phone</p>
                <p className="text-[#0F172A] font-mono text-xs">{selectedHistoryModal.guardian_phone || "03219876543"}</p>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedHistoryModal(null)}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold px-5 py-2 rounded-xl text-xs cursor-pointer"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESIGN MODAL */}
      {resignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E2E8F0] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-md">
                  Experience Certificate & Exit
                </span>
                <h3 className="text-base font-bold text-[#0F172A] mt-1">{resignModal.full_name}</h3>
                <p className="text-xs font-mono text-[#64748B]">{resignModal.email}</p>
              </div>
              <button onClick={() => setResignModal(null)} className="text-[#64748B] hover:text-[#0F172A] font-bold">✕</button>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button onClick={() => setResignModal(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-[#2563EB] border border-[#E2E8F0] bg-white">Cancel</button>
              <button onClick={() => handlePrintExperienceLetter(resignModal)} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5">
                <FaFileDownload /> Download Certificate PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
