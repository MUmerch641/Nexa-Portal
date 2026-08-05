"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { logActivity, initActivityStatusTracker } from "@/lib/activityUtils";
import Modal from "@/components/Modal";
import { showToast } from "@/components/Toast";
import { FaUsers, FaUserPlus, FaUserTie, FaTrash, FaCheckCircle, FaFileDownload, FaSignOutAlt, FaInfoCircle, FaUserCheck, FaClock, FaTasks, FaMoneyBillWave, FaDesktop, FaExclamationTriangle, FaAward, FaShieldAlt } from "react-icons/fa";

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

  const INITIAL_DEMO_EMPLOYEES = [
    { id: "emp-101", full_name: "Muhammad Ali", email: "ali.staff@gmail.com", department: "Web Development", designation: "Senior Lead Developer", employment_type: "Paid Staff (Full Time)", joining_date: "2025-01-15", status: "active" },
    { id: "emp-102", full_name: "Sara Khan", email: "sara.design@gmail.com", department: "UI/UX Design", designation: "Lead Designer", employment_type: "Paid Staff (Full Time)", joining_date: "2025-02-01", status: "active" },
    { id: "emp-103", full_name: "Muhammad Rahim Bugti", email: "rahim.staff@gmail.com", department: "Engineering", designation: "Senior Full-Stack Developer", employment_type: "Paid Staff (Full Time)", joining_date: "2025-01-01", status: "active" }
  ];

  // Fetch Employees with Live Supabase Sync & LocalStorage Fallback
  const fetchEmployees = async () => {
    setFetching(true);
    let localEmps = [];
    try {
      const s = localStorage.getItem("persistent_employees");
      if (s) localEmps = JSON.parse(s);
    } catch(e) {}

    let dbEmps = [];
    try {
      const { data, error } = await supabase.from("employees").select("*");
      if (!error && data && data.length > 0) {
        dbEmps = data;
      }
    } catch (err) {}

    const empMap = new Map();
    const baseEmps = localEmps.length > 0 ? localEmps : INITIAL_DEMO_EMPLOYEES;

    baseEmps.forEach(e => {
      const key = (e.email || e.id || "").toLowerCase().trim();
      if (key) empMap.set(key, { ...e, status: e.status || "active" });
    });

    dbEmps.forEach(e => {
      const key = (e.email || e.id || "").toLowerCase().trim();
      if (key) {
        const existing = empMap.get(key) || {};
        empMap.set(key, { ...existing, ...e, status: e.status || existing.status || "active" });
      }
    });

    const finalEmps = Array.from(empMap.values());
    setEmployees(finalEmps);
    try {
      localStorage.setItem("persistent_employees", JSON.stringify(finalEmps));
    } catch(e) {}
    setFetching(false);
  };

  const [role, setRole] = useState("admin");
  const [userEmail, setUserEmail] = useState("");

  // Real-Time Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const filteredEmployees = employees.filter((emp) => {
    // Default filter: hide inactive employees unless showInactive toggle is on
    const isInactive = emp.status === "inactive" || emp.status === "deactivated";
    if (isInactive && !showInactive) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = (emp.full_name || "").toLowerCase().includes(q);
    const deptMatch = (emp.department || "").toLowerCase().includes(q);
    const desigMatch = (emp.designation || "").toLowerCase().includes(q);
    const emailMatch = (emp.email || "").toLowerCase().includes(q);
    return nameMatch || deptMatch || desigMatch || emailMatch;
  });

  useEffect(() => {
    const savedRole = localStorage.getItem("user_role") || "admin";
    const savedEmail = localStorage.getItem("current_user_email") || "sara.design@gmail.com";
    setRole(savedRole);
    setUserEmail(savedEmail);
    fetchEmployees();

    const cleanupTracker = initActivityStatusTracker(savedEmail);

    const handleStorageChange = () => {
      fetchEmployees();
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      cleanupTracker();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const [emailError, setEmailError] = useState("");
  const [nameError, setNameError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });
    if (name === "email" && emailError) {
      setEmailError("");
    }
    if (name === "full_name" && nameError) {
      setNameError("");
    }
  };

  const addEmployee = async (e) => {
    e.preventDefault();
    setEmailError("");
    setNameError("");

    const trimmedName = (form.full_name || "").trim();
    const trimmedEmail = (form.email || "").trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !form.department) {
      showAlert("Missing Fields", "Please enter Full Name, Email, and Department.", "warning");
      return;
    }

    if (trimmedName.length < 2) {
      setNameError("Employee name must be at least 2 characters long.");
      showAlert("Invalid Name Format ⚠️", "Please enter a valid employee name (at least 2 characters).", "warning");
      return;
    }

    // Check duplicate email against existing employees
    const duplicateEmployee = employees.find(
      emp => (emp?.email || "").trim().toLowerCase() === trimmedEmail
    );

    // Also check against registered system users cache
    let registeredUsers = [];
    try {
      const saved = localStorage.getItem("registered_system_users");
      if (saved) registeredUsers = JSON.parse(saved);
    } catch(err) {}

    const duplicateRegistered = registeredUsers.find(
      u => (u?.email || "").trim().toLowerCase() === trimmedEmail
    );

    if (duplicateEmployee || duplicateRegistered) {
      const existingName = duplicateEmployee?.full_name || duplicateRegistered?.fullName || "another user";
      setEmailError("This email address is already registered.");
      showAlert(
        "Duplicate Email Error ⚠️",
        `This email address (${form.email}) is already registered to ${existingName}.\n\nEach employee must have a unique email address. Please enter a different email address.`,
        "error"
      );
      return;
    }

    setLoading(true);

    try {
      const newEmpObj = {
        id: `emp-${Date.now()}`,
        full_name: trimmedName,
        father_name: form.father_name || "",
        email: trimmedEmail,
        phone: form.phone || "",
        department: form.department,
        designation: form.designation || "Staff Member",
        employment_type: form.employment_type || "Paid Staff (Full Time)",
        joining_date: form.joining_date || new Date().toISOString().split("T")[0],
        address: form.address || "",
        status: "active"
      };

      // 1. Get current list directly from localStorage to prevent closure/stale state bugs!
      let currentLocal = [];
      try {
        const s = localStorage.getItem("persistent_employees");
        if (s) currentLocal = JSON.parse(s);
      } catch(e) {}

      // Deduplicate by email
      const filteredCurrent = currentLocal.filter(emp => (emp.email || "").toLowerCase().trim() !== trimmedEmail);
      const newFullList = [newEmpObj, ...filteredCurrent];

      // 2. Save directly to localStorage
      try {
        localStorage.setItem("persistent_employees", JSON.stringify(newFullList));
      } catch(e) {}

      // 3. Update React State
      setEmployees(newFullList);

      // 4. Save to System Users credentials cache
      const userCredentials = {
        fullName: trimmedName,
        email: trimmedEmail,
        password: form.assigned_password || "employeepassword123",
        role: "employee",
        department: form.department,
      };

      try {
        const saved = localStorage.getItem("registered_system_users");
        const existing = saved ? JSON.parse(saved) : [];
        const updatedUsers = [
          ...existing.filter(u => u && u.email && u.email.toLowerCase().trim() !== trimmedEmail),
          userCredentials
        ];
        localStorage.setItem("registered_system_users", JSON.stringify(updatedUsers));
      } catch(e) {}

      // 5. Upsert into Supabase DB
      try {
        await supabase.from("employees").upsert([{
          id: newEmpObj.id,
          full_name: trimmedName,
          email: trimmedEmail,
          phone: form.phone || null,
          department: form.department,
          designation: form.designation,
          employment_type: form.employment_type,
          joining_date: form.joining_date || new Date().toISOString().split("T")[0],
          address: form.address || null,
          status: "active"
        }], { onConflict: "email" });
      } catch(err) {}

      // 6. Log activity
      try {
        await logActivity(
          "Admin / HR",
          "Employee Added",
          `Created employee profile & credentials for ${trimmedName} (${form.department})`,
          "employee"
        );
      } catch(e) {}

      showToast(
        "Employee Added Successfully! 🟢",
        `Employee: ${trimmedName}\nEmail: ${trimmedEmail}\nStatus: Active & Saved`,
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
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateEmployee = async (emp) => {
    if (!confirm(`Are you sure you want to DEACTIVATE "${emp.full_name}"?\n\nDeactivating will block login access while fully preserving all attendance, payslips, leave, and project history.`)) {
      return;
    }

    const updatedList = employees.map((e) =>
      e.id === emp.id ? { ...e, status: "inactive" } : e
    );
    setEmployees(updatedList);

    try {
      localStorage.setItem("persistent_employees", JSON.stringify(updatedList));
      await supabase.from("employees").update({ status: "inactive" }).eq("id", emp.id);
      
      // Update registered users status cache
      const saved = localStorage.getItem("registered_system_users");
      if (saved) {
        const users = JSON.parse(saved);
        const updatedUsers = users.map(u => 
          u.email.toLowerCase() === emp.email.toLowerCase() ? { ...u, status: "inactive" } : u
        );
        localStorage.setItem("registered_system_users", JSON.stringify(updatedUsers));
      }

      await logActivity(
        "Admin / HR",
        "Employee Deactivated",
        `Deactivated account for ${emp.full_name} (${emp.email}). Login access revoked. All historical data preserved.`,
        "employee"
      );
    } catch (e) {}

    showToast("Employee Deactivated 🛑", `Account for ${emp.full_name} deactivated. Login access revoked. Historical data preserved.`, "info");
  };

  const handleReactivateEmployee = async (emp) => {
    const updatedList = employees.map((e) =>
      e.id === emp.id ? { ...e, status: "active" } : e
    );
    setEmployees(updatedList);

    try {
      localStorage.setItem("persistent_employees", JSON.stringify(updatedList));
      await supabase.from("employees").update({ status: "active" }).eq("id", emp.id);

      const saved = localStorage.getItem("registered_system_users");
      if (saved) {
        const users = JSON.parse(saved);
        const updatedUsers = users.map(u => 
          u.email.toLowerCase() === emp.email.toLowerCase() ? { ...u, status: "active" } : u
        );
        localStorage.setItem("registered_system_users", JSON.stringify(updatedUsers));
      }
    } catch (e) {}

    showToast("Employee Reactivated 🟢", `Account for ${emp.full_name} reactivated. Login access restored.`, "success");
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

      {/* EMPLOYEE PERSONAL DASHBOARD VIEW (LOGGED-IN EMPLOYEE ONLY SEES THEIR OWN DATA) */}
      {(role === "employee" || role === "staff") ? (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white rounded-2xl p-7 shadow-xl border border-blue-500/40 relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-white text-blue-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-xs">
                    🧑‍💻 Verified Paid Staff Member
                  </span>
                  <span className="bg-blue-800/80 text-blue-100 text-[10px] font-bold px-3 py-1 rounded-full border border-blue-400/40">
                    Full-Time Paid Employee
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
                  <FaUserTie className="text-amber-300 text-3xl" />
                  <span>Welcome Back, Employee Portal</span>
                </h1>
                <p className="text-xs text-blue-100 mt-2 font-medium">
                  Logged in as: <strong className="text-white font-mono bg-blue-900/60 px-2.5 py-1 rounded border border-blue-400/40">{userEmail}</strong> • Isolated Personal Salary, Work Timers & HR Desk.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <a href="/dashboard/payroll" className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl text-xs transition-all shadow-lg border border-emerald-400">
                  💰 My Salary Slip
                </a>
                <a href="/dashboard/projects" className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold px-4 py-2.5 rounded-xl text-xs transition-all shadow-lg border border-amber-300">
                  📋 Daily Work Timer
                </a>
              </div>
            </div>
          </div>

          {/* DEDICATED EMPLOYEE ATTENDANCE MODULE */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full border border-emerald-200">
                  📌 Official Employee Attendance Module
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-2 flex items-center gap-2">
                  <FaClock className="text-emerald-600" />
                  <span>Live Employee Check-In & Time Policy Center</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Strict 24-Hour Rule • Public IPify API Verification Active
                </p>
              </div>

            </div>

            {/* Time-Based Attendance Policy Cards (White, Green, Orange, Red) */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Before 10:00 AM</span>
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <span className="w-3.5 h-3.5 rounded-full bg-white border-2 border-slate-400 shadow-xs"></span>
                  <span>⚪ White Light</span>
                </div>
                <p className="text-[11px] text-slate-600 font-semibold">🔒 Attendance Disabled</p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-800">10:00 AM – 10:14 AM</span>
                <div className="flex items-center gap-2 font-bold text-emerald-950">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-md animate-pulse"></span>
                  <span>🟢 Green Light</span>
                </div>
                <p className="text-[11px] text-emerald-900 font-semibold">🟢 Available Check-In</p>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-800">10:15 AM – 10:29 AM</span>
                <div className="flex items-center gap-2 font-bold text-amber-950">
                  <span className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-md animate-pulse"></span>
                  <span>🟠 Orange Light</span>
                </div>
                <p className="text-[11px] text-amber-900 font-semibold">🟠 Late Warning</p>
              </div>

              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-rose-800">10:30 AM and After</span>
                <div className="flex items-center gap-2 font-bold text-rose-950">
                  <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-md animate-pulse"></span>
                  <span>🔴 Red Light</span>
                </div>
                <p className="text-[11px] text-rose-900 font-semibold">🔴 One Day's Salary Deduction</p>
              </div>
            </div>

            {/* Quick Action Button & Database History */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
              <div className="text-xs text-slate-600 space-y-0.5">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <FaShieldAlt className="text-emerald-600" /> Public IPify Status: Verified Active
                </p>
                <p className="text-[11px] text-slate-500">
                  Check-in time, check-out time, attendance date & status are saved directly to database.
                </p>
              </div>

              <a
                href="/dashboard/attendance"
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 border border-emerald-500 shrink-0"
              >
                <FaClock className="text-amber-300" />
                <span>Mark My Staff Attendance Now →</span>
              </a>
            </div>
          </div>

          {/* ALL-IN-ONE PERSONAL DASHBOARD HUB FOR EMPLOYEE */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FaUserCheck className="text-indigo-600 text-lg" />
                <span>My Dedicated Employee Services (100% Isolated to {userEmail})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage your daily tasks, salary breakdown, attendance, leaves, complaints, and meetings in one place.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Card 2: Personal Daily Tasks */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span className="flex items-center gap-1.5 text-amber-700">
                      <FaTasks className="text-amber-600" /> My Assigned Daily Tasks
                    </span>
                    <span className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded font-extrabold">Stopwatch Active</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Start, pause, and mark complete on tasks assigned specifically to you.
                  </p>
                </div>
                <a href="/dashboard/projects" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-lg text-center transition-all block">
                  Open Daily Stopwatch →
                </a>
              </div>

              {/* Card 3: Personal Salary & Payslips */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <FaMoneyBillWave className="text-emerald-600" /> My Salary & Net Pay
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-extrabold">PDF Payslip</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    View Basic, Overtime, Bonus, Deductions & download PDF payslip.
                  </p>
                </div>
                <a href="/dashboard/payroll" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-center transition-all block">
                  Open My Salary →
                </a>
              </div>

              {/* Card 4: Remote Monitoring */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span className="flex items-center gap-1.5 text-indigo-700">
                      <FaDesktop className="text-indigo-600" /> Remote Work Monitor
                    </span>
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded font-extrabold">Transparent</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    View active timeline, app usage breakdown, and screenshot privacy log.
                  </p>
                </div>
                <a href="/dashboard/remote-monitoring" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-center transition-all block">
                  Open Remote Monitor →
                </a>
              </div>

              {/* Card 5: Complaints */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span className="flex items-center gap-1.5 text-rose-700">
                      <FaExclamationTriangle className="text-rose-600" /> My HR Complaints
                    </span>
                    <span className="bg-rose-100 text-rose-800 text-[10px] px-2 py-0.5 rounded font-extrabold">Helpdesk</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Report Internet, HR, or System issues and track 3-stage status.
                  </p>
                </div>
                <a href="/dashboard/complaints" className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-lg text-center transition-all block">
                  Open Complaints →
                </a>
              </div>

              {/* Card 6: Performance Score */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span className="flex items-center gap-1.5 text-amber-700">
                      <FaAward className="text-amber-600" /> Performance & Ranking
                    </span>
                    <span className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded font-extrabold">Score: 94/100</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    View 8-factor evaluation metrics score & monthly ranking leaderboard.
                  </p>
                </div>
                <a href="/dashboard/performance" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-lg text-center transition-all block">
                  Open Performance →
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <FaUsers className="text-blue-600" />
              <span>Paid Employees & Staff Management (Admin Control)</span>
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
                placeholder="e.g. O'Connor or Anne-Marie"
                required
                className={`w-full rounded-lg border px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 ${
                  nameError ? "border-red-500 bg-red-50/30" : "border-slate-300"
                }`}
              />
              {nameError && (
                <p className="mt-1 text-xs text-red-600 font-medium">{nameError}</p>
              )}
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
                className={`w-full rounded-lg border px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 ${
                  emailError ? "border-red-500 bg-red-50/30" : "border-slate-300"
                }`}
              />
              {emailError && (
                <p className="mt-1 text-xs text-red-600 font-medium">{emailError}</p>
              )}
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
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FaUserTie className="text-blue-600" />
                <span>Paid Staff Directory</span>
              </h2>
              <span className="text-xs font-semibold text-slate-500 bg-slate-200/60 px-2.5 py-1 rounded-md">
                Total: {filteredEmployees.length} {searchQuery ? `(of ${employees.length})` : ""}
              </span>
              <label className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold cursor-pointer ml-2 bg-white px-2 py-1 rounded border border-slate-200 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                />
                <span>Show Inactive Staff</span>
              </label>
            </div>

            {/* Real-Time Search & Clear Bar */}
            <div className="relative flex items-center w-full sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, department, title..."
                className="w-full rounded-lg border border-slate-300 pl-3.5 pr-8 py-1.5 text-xs text-slate-900 outline-none focus:border-blue-600 bg-white shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 text-slate-400 hover:text-slate-700 text-xs font-bold bg-slate-100 hover:bg-slate-200 rounded-full h-4 w-4 flex items-center justify-center transition-colors"
                  title="Clear Search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Employee Name</th>
                  <th className="px-4 py-3">Real-Time Status</th>
                  <th className="px-4 py-3">Department & Title</th>
                  <th className="px-4 py-3">Contact Email</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => {
                    const isInactive = emp.status === "inactive" || emp.status === "deactivated";
                    const emailKey = (emp.email || "").toLowerCase().trim();

                    // Read real-time activity status from state/local cache
                    let liveStatus = "Offline";
                    let lastActiveText = "Never";

                    try {
                      const statusMap = JSON.parse(localStorage.getItem("software_house_realtime_activity_statuses") || "{}");
                      const userStat = statusMap[emailKey];
                      if (userStat) {
                        liveStatus = userStat.status || "Offline";
                        lastActiveText = userStat.last_active ? new Date(userStat.last_active).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Never";
                      }
                    } catch (e) {}

                    return (
                    <tr key={emp.id} className={`hover:bg-slate-50/50 ${isInactive ? "bg-rose-50/20 opacity-75" : ""}`}>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{emp.full_name}</span>
                          {isInactive && (
                            <span className="bg-rose-100 text-rose-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-rose-200">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-blue-600 font-semibold">{emp.employment_type}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        {liveStatus === "Online" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                            🟢 Online
                          </span>
                        ) : liveStatus === "Idle" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            🟡 Idle (5m+)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300">
                            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                            ⚪ Offline
                          </span>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">Last Active: {lastActiveText}</div>
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
                        {isInactive ? (
                          <button
                            onClick={() => handleReactivateEmployee(emp)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-bold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 transition-all"
                          >
                            Reactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDeactivateEmployee(emp)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 transition-all"
                          >
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  )})
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 text-xs">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <span className="text-2xl">🔍</span>
                        <p className="font-bold text-slate-700">No employees found.</p>
                        {searchQuery && (
                          <p className="text-slate-400 text-[11px]">
                            No staff members match &quot;{searchQuery}&quot;. Try clearing or changing your search terms.
                          </p>
                        )}
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="mt-1 px-3 py-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs transition-colors"
                          >
                            Clear Search
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
      </div>
    </div>
  )}

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
