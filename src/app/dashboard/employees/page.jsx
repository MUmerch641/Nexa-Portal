"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Modal from "@/components/Modal";
import { FaUsers, FaUserPlus, FaUserTie, FaTrash, FaCheckCircle, FaFileDownload, FaSignOutAlt, FaInfoCircle } from "react-icons/fa";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedHistoryModal, setSelectedHistoryModal] = useState(null);

  const [form, setForm] = useState({
    full_name: "",
    father_name: "",
    phone: "",
    email: "",
    assigned_password: "employeepassword123",
    blood_group: "O+",
    address: "",
    guardian_name: "",
    guardian_phone: "",
    emergency_phone: "",
    department: "Web Development",
    designation: "Senior Lead Developer",
    employment_type: "Paid Staff (Full Time)",
    joining_date: new Date().toISOString().split("T")[0],
  });

  // Modal State
  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const showAlert = (title, message, type = "info") => {
    setModal({ isOpen: true, title, message, type });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  // Resign & Experience Certificate Modal State
  const [resignModal, setResignModal] = useState(null);

  // Print & Download Official Experience Certificate
  const handlePrintExperienceLetter = (emp) => {
    const todayStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Official Experience & Relieving Certificate - ${emp.full_name}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
            .certificate-box { border: 10px solid #1e3a8a; padding: 40px; max-width: 800px; margin: 0 auto; position: relative; }
            .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .company-name { font-size: 26px; font-weight: bold; color: #1d4ed8; text-transform: uppercase; letter-spacing: 2px; }
            .sub-title { font-size: 13px; color: #64748b; margin-top: 5px; }
            .cert-title { font-size: 20px; font-weight: bold; text-align: center; text-transform: uppercase; letter-spacing: 3px; color: #0f172a; margin: 30px 0; text-decoration: underline; }
            .content { font-size: 14px; line-height: 1.8; color: #334155; margin-bottom: 40px; text-align: justify; }
            .highlight { font-weight: bold; color: #0f172a; }
            .signatures { display: flex; justify-content: space-between; margin-top: 60px; padding-top: 30px; border-top: 1px solid #cbd5e1; }
            .sig-box { text-align: center; font-size: 12px; font-weight: bold; }
            .stamp { color: #2563eb; border: 2px solid #2563eb; padding: 6px 12px; border-radius: 6px; display: inline-block; font-size: 10px; margin-top: 10px; text-transform: uppercase; letter-spacing: 1px; }
          </style>
        </head>
        <body>
          <div class="certificate-box">
            <div class="header">
              <div class="company-name">ANTIGRAVITY SOFTWARE HOUSE (PVT) LTD</div>
              <div class="sub-title">Corporate Tech Campus, Innovation Parkway | HR & People Operations</div>
            </div>

            <div class="cert-title">TO WHOM IT MAY CONCERN</div>

            <div class="content">
              This is to officially certify that <span class="highlight">${emp.full_name}</span> (S/O ${emp.father_name || 'N/A'}) served with distinction at 
              <span class="highlight">Antigravity Software House</span> as a full-fledged <span class="highlight">${emp.designation}</span> in the 
              <span class="highlight">${emp.department}</span> Department from <span class="highlight">${emp.joining_date || '2026-01-01'}</span> to 
              <span class="highlight">${todayStr}</span>.
              <br/><br/>
              During their tenure with our organization, <span class="highlight">${emp.full_name}</span> exhibited exceptional professional skills, technical diligence, and outstanding work ethic in delivering enterprise software solutions and team deliverables.
              <br/><br/>
              Having officially tendered their resignation, we accept their resignation and release them from their duties effective today. We confirm that all corporate dues and exit formalities have been completed.
              <br/><br/>
              We wish <span class="highlight">${emp.full_name}</span> the very best in all their future professional endeavors.
            </div>

            <div class="signatures">
              <div class="sig-box">
                <div>________________________</div>
                <div style="margin-top:5px;">Head of Human Resources</div>
                <div style="font-size:11px; color:#64748b;">Antigravity Software House</div>
              </div>
              <div class="sig-box">
                <div class="stamp">OFFICIALLY VERIFIED & ISSUED</div>
                <div style="margin-top:10px;">Date: ${todayStr}</div>
              </div>
              <div class="sig-box">
                <div>________________________</div>
                <div style="margin-top:5px;">Chief Executive Officer (CEO)</div>
                <div style="font-size:11px; color:#64748b;">Software House Management</div>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Fetch Employees with Strict LocalStorage Persistence
  const fetchEmployees = async () => {
    setFetching(true);
    try {
      const s = localStorage.getItem("persistent_employees");
      if (s !== null) {
        setEmployees(JSON.parse(s));
        setFetching(false);
        return;
      }
    } catch(e) {}

    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        setEmployees(data);
        localStorage.setItem("persistent_employees", JSON.stringify(data));
      } else {
        setEmployees([]);
        localStorage.setItem("persistent_employees", JSON.stringify([]));
      }
    } catch (err) {
      setEmployees([]);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const addEmployee = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.department) {
      showAlert("Missing Fields", "Please enter Full Name, Email, and Department.", "warning");
      return;
    }

    setLoading(true);

    const newEmpObj = {
      id: `emp-${Date.now()}`,
      ...form,
    };

    const updatedList = [newEmpObj, ...employees];
    setEmployees(updatedList);
    try {
      localStorage.setItem("persistent_employees", JSON.stringify(updatedList));
    } catch(e) {}

    try {
      await supabase.from("employees").insert([form]);
    } catch(e) {}

    // Save Admin assigned credentials so the employee can log in with their exact email & password!
    const userCredentials = {
      fullName: form.full_name,
      email: form.email,
      password: form.assigned_password || "employeepassword123",
      role: "employee",
      department: form.department,
    };

    try {
      const saved = localStorage.getItem("registered_system_users");
      const existing = saved ? JSON.parse(saved) : [];
      const updatedUsers = [...existing.filter(u => u.email.toLowerCase() !== form.email.toLowerCase()), userCredentials];
      localStorage.setItem("registered_system_users", JSON.stringify(updatedUsers));
    } catch(e) {}

    setLoading(false);
    showAlert(
      "Employee Account Created & Credentials Assigned! 🟢",
      `Employee: ${form.full_name}\nAssigned Email: ${form.email}\nAssigned Password: ${form.assigned_password}\n\nLogin credentials assigned! The employee can now log in directly at /login using these credentials.`,
      "success"
    );

    setForm({
      full_name: "",
      father_name: "",
      phone: "",
      email: "",
      assigned_password: "employeepassword123",
      blood_group: "O+",
      address: "",
      guardian_name: "",
      guardian_phone: "",
      emergency_phone: "",
      department: "Web Development",
      designation: "Senior Lead Developer",
      employment_type: "Paid Staff (Full Time)",
      joining_date: new Date().toISOString().split("T")[0],
    });
  };

  const handleDeleteEmployee = async (id) => {
    if (!confirm("Are you sure you want to delete this employee record?")) return;
    const updatedList = employees.filter((emp) => emp.id !== id);
    setEmployees(updatedList);
    try {
      localStorage.setItem("persistent_employees", JSON.stringify(updatedList));
      await supabase.from("employees").delete().eq("id", id);
    } catch(e) {}
  };

  return (
    <div className="space-y-6">
      {/* Modal */}
      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={closeModal}
      />

      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <FaUsers className="text-blue-600" />
          <span>Paid Employees & Staff Management</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Register and manage full-time & part-time paid software house staff
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Add Employee Form */}
        <div className="lg:col-span-1 rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 h-fit">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <FaUserPlus className="text-blue-600" />
            <span>Add Paid Staff Member</span>
          </h2>

          <form onSubmit={addEmployee} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="e.g. Muhammad Ali"
                required
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Father / Guardian Name
              </label>
              <input
                type="text"
                name="father_name"
                value={form.father_name}
                onChange={handleChange}
                placeholder="e.g. Tariq Mahmood"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Email Address (Login Username) *
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="ali.staff@gmail.com"
                required
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Assign Login Password *
              </label>
              <input
                type="text"
                name="assigned_password"
                value={form.assigned_password}
                onChange={handleChange}
                placeholder="Set password for user login..."
                required
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="03001234567"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Blood Group
                </label>
                <select
                  name="blood_group"
                  value={form.blood_group}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 bg-white"
                >
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Emergency #
                </label>
                <input
                  type="text"
                  name="emergency_phone"
                  value={form.emergency_phone}
                  onChange={handleChange}
                  placeholder="03009998877"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Guardian Name & Guardian #
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  name="guardian_name"
                  value={form.guardian_name}
                  onChange={handleChange}
                  placeholder="Guardian Name"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                />
                <input
                  type="text"
                  name="guardian_phone"
                  value={form.guardian_phone}
                  onChange={handleChange}
                  placeholder="Guardian #"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Residential Address
              </label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="House #, Street, City..."
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Employment Type *
              </label>
              <select
                name="employment_type"
                value={form.employment_type}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
              >
                <option value="Paid Staff (Full Time)">Paid Staff (Full Time)</option>
                <option value="Paid Staff (Part Time)">Paid Staff (Part Time)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Department *
              </label>
              <input
                type="text"
                name="department"
                value={form.department}
                onChange={handleChange}
                placeholder="e.g. Web Development, Mobile Apps"
                required
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Designation / Role Title *
              </label>
              <input
                type="text"
                name="designation"
                value={form.designation}
                onChange={handleChange}
                placeholder="e.g. Senior Full Stack Engineer"
                required
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Joining Date
              </label>
              <input
                type="date"
                name="joining_date"
                value={form.joining_date}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
            >
              {loading ? "Saving..." : "Save Paid Employee Record"}
            </button>
          </form>
        </div>

        {/* Paid Employees Staff Directory */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FaUserTie className="text-blue-600" />
              <span>Paid Staff Directory</span>
            </h2>
            <span className="text-xs font-semibold text-slate-500 bg-slate-200/60 px-2.5 py-1 rounded-md">
              Total Staff: {employees.length}
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Employee Name</th>
                  <th className="px-4 py-3">Department & Title</th>
                  <th className="px-4 py-3">Contact Email</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {employees.length > 0 ? (
                  employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{emp.full_name}</div>
                        <div className="text-xs text-blue-600 font-semibold">{emp.employment_type}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-800 text-xs">{emp.designation}</div>
                        <div className="text-[11px] text-slate-500">{emp.department}</div>
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-600 font-mono">
                        {emp.email}
                      </td>

                      <td className="px-4 py-3.5 text-right flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedHistoryModal(emp)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 transition-all"
                        >
                          <FaInfoCircle className="text-[10px]" /> View History
                        </button>
                        <button
                          onClick={() => setResignModal(emp)}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 transition-all"
                        >
                          <FaSignOutAlt className="text-[10px]" /> Resign & Cert
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(emp.id)}
                          className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1"
                        >
                          <FaTrash className="text-[10px]" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-xs">
                      No paid staff employees registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* EMPLOYEE FULL HISTORY INSPECTION MODAL */}
      {selectedHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  Full Employee Personal Record & History
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">{selectedHistoryModal.full_name}</h3>
                <p className="text-xs font-mono text-slate-500">{selectedHistoryModal.email}</p>
              </div>
              <button
                onClick={() => setSelectedHistoryModal(null)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-0.5">
                <p className="text-slate-400 font-bold uppercase text-[10px]">Employee Name</p>
                <p className="text-slate-900 font-bold text-xs">{selectedHistoryModal.full_name}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-0.5">
                <p className="text-slate-400 font-bold uppercase text-[10px]">Contact Phone Number</p>
                <p className="text-slate-900 font-bold font-mono text-xs">{selectedHistoryModal.phone || "03001234567"}</p>
              </div>

              <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 space-y-0.5">
                <p className="text-rose-600 font-bold uppercase text-[10px]">Blood Group</p>
                <p className="text-rose-900 font-black text-sm">{selectedHistoryModal.blood_group || "O+"}</p>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 space-y-0.5">
                <p className="text-amber-700 font-bold uppercase text-[10px]">Emergency Contact #</p>
                <p className="text-amber-950 font-bold font-mono text-xs">{selectedHistoryModal.emergency_phone || "03009998877"}</p>
              </div>

              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 space-y-0.5">
                <p className="text-blue-600 font-bold uppercase text-[10px]">Guardian Name</p>
                <p className="text-slate-900 font-bold text-xs">{selectedHistoryModal.guardian_name || selectedHistoryModal.father_name || "Tariq Mahmood"}</p>
              </div>

              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 space-y-0.5">
                <p className="text-blue-600 font-bold uppercase text-[10px]">Guardian Phone #</p>
                <p className="text-slate-900 font-bold font-mono text-xs">{selectedHistoryModal.guardian_phone || "03219876543"}</p>
              </div>
            </div>

            <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl text-xs space-y-1">
              <p className="text-slate-400 font-bold uppercase text-[10px]">Permanent Residential Address</p>
              <p className="text-slate-200 font-semibold">{selectedHistoryModal.address || "Corporate Avenue, Sector H-8, Islamabad"}</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Department & Title</p>
                <p className="text-slate-900 font-bold text-xs">{selectedHistoryModal.designation}</p>
                <p className="text-slate-600 text-[11px]">{selectedHistoryModal.department}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Tenure & Joining Date</p>
                <p className="text-slate-900 font-bold text-xs">{selectedHistoryModal.joining_date || "2026-01-15"}</p>
                <p className="text-blue-600 text-[11px] font-semibold">{selectedHistoryModal.employment_type}</p>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedHistoryModal(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2 rounded-xl text-xs transition-all shadow-md"
              >
                Close History Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESIGNATION & EXPERIENCE CERTIFICATE MODAL */}
      {resignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  Employee Exit & Resignation
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{resignModal.full_name}</h3>
                <p className="text-xs font-mono text-slate-500">{resignModal.email}</p>
              </div>
              <button
                onClick={() => setResignModal(null)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                <p className="text-slate-400 font-bold uppercase text-[10px]">Position & Department</p>
                <p className="text-slate-900 font-bold text-sm">{resignModal.designation}</p>
                <p className="text-slate-600 text-xs">{resignModal.department} ({resignModal.employment_type})</p>
              </div>

              <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 text-emerald-900 space-y-1">
                <p className="font-bold text-xs flex items-center gap-1.5 text-emerald-800">
                  <FaCheckCircle className="text-emerald-600" />
                  <span>Official Experience Letter Ready</span>
                </p>
                <p className="text-[11px] text-emerald-800/80 leading-relaxed">
                  Upon resigning, an official Relieving & Experience Certificate is automatically generated with tenure dates and HR seal.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setResignModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              
              <button
                onClick={() => handlePrintExperienceLetter(resignModal)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md"
              >
                <FaFileDownload />
                <span>Download Experience Certificate (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}