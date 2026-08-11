"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { generatePrintablePayslipPdf } from "@/lib/generatePayslipPdf";
import Modal from "@/components/Modal";
import { dbFetch, dbSaveRecord, dbDeleteRecord } from "@/lib/dbPersistence";
import {
  FaMoneyBillWave,
  FaCalculator,
  FaFileDownload,
  FaFilter,
  FaUsers,
  FaPlusCircle,
  FaEdit,
  FaTrash,
  FaUserCheck,
  FaLandmark,
  FaCheckCircle,
  FaArrowRight,
  FaSlidersH,
  FaUserPlus,
  FaUserTie,
  FaSignOutAlt,
  FaInfoCircle,
  FaCertificate
} from "react-icons/fa";

export default function PayrollDashboardPage() {
  const [role, setRole] = useState("admin");
  const [userEmail, setUserEmail] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("2026-08");
  const [loading, setLoading] = useState(true);

  // Initial Employee Master Salary & Payroll List
  const [payrolls, setPayrolls] = useState([
    {
      id: "p-1",
      employee_id: "emp-101",
      employee_name: "Muhammad Ali",
      department: "Web Development",
      designation: "Senior Lead Developer",
      email: "ali.staff@gmail.com",
      month: "2026-08",
      basic_salary: 120000,
      overtime_hours: 10,
      overtime_amount: 6000,
      leave_deduction: 0,
      late_penalty: 500,
      bonus_amount: 5000,
      incentive_amount: 3000,
      advance_deduction: 0,
      loan_deduction: 5000,
      final_payable_salary: 128500,
      status: "processed"
    },
    {
      id: "p-2",
      employee_id: "emp-102",
      employee_name: "Sara Khan",
      department: "UI/UX Design",
      designation: "Lead Designer",
      email: "sara.design@gmail.com",
      month: "2026-08",
      basic_salary: 95000,
      overtime_hours: 0,
      overtime_amount: 0,
      leave_deduction: 3650,
      late_penalty: 0,
      bonus_amount: 4000,
      incentive_amount: 2000,
      advance_deduction: 10000,
      loan_deduction: 0,
      final_payable_salary: 87350,
      status: "processed"
    },
    {
      id: "p-3",
      employee_id: "emp-103",
      employee_name: "Muhammad Rahim Bugti",
      department: "Engineering",
      designation: "Senior Full-Stack Developer",
      email: "rahim.staff@gmail.com",
      month: "2026-08",
      basic_salary: 150000,
      overtime_hours: 15,
      overtime_amount: 11250,
      leave_deduction: 0,
      late_penalty: 0,
      bonus_amount: 10000,
      incentive_amount: 5000,
      advance_deduction: 0,
      loan_deduction: 0,
      final_payable_salary: 176250,
      status: "processed"
    },
    {
      id: "p-4",
      employee_id: "emp-104",
      employee_name: "Usman Tariq",
      department: "QA Testing",
      designation: "Automation QA Engineer",
      email: "usman.qa@gmail.com",
      month: "2026-08",
      basic_salary: 80000,
      overtime_hours: 5,
      overtime_amount: 2500,
      leave_deduction: 2600,
      late_penalty: 500,
      bonus_amount: 3000,
      incentive_amount: 0,
      advance_deduction: 0,
      loan_deduction: 0,
      final_payable_salary: 82400,
      status: "processed"
    }
  ]);

  // Modal State for Adding New Employee Payroll Record (Admin Only)
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newEmpForm, setNewEmpForm] = useState({
    employee_name: "",
    email: "",
    assigned_password: "employeepassword123",
    department: "Engineering",
    designation: "Software Engineer",
    basic_salary: 75000,
    overtime_hours: 0,
    overtime_rate: 600,
    bonus_amount: 0,
    incentive_amount: 0,
    leave_deduction: 0,
    late_penalty: 0,
    loan_deduction: 0,
  });

  // Modal State for Editing / Adjusting Salary (Admin Only)
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  // Print & Download Official Experience Certificate
  const handlePrintExperienceLetter = (emp) => {
    const todayStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Official Experience & Relieving Certificate - ${emp.employee_name || emp.full_name}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
            .certificate-box { border: 10px solid #1e3a8a; padding: 40px; max-width: 800px; margin: 0 auto; position: relative; }
            .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .company-name { font-size: 26px; font-weight: bold; color: #1d4ed8; text-transform: uppercase; letter-spacing: 2px; }
            .sub-title { font-size: 13px; color: #64748b; margin-top: 5px; }
            .cert-title { font-size: 20px; font-weight: bold; text-align: center; text-transform: uppercase; letter-spacing: 3px; color: #0f172a; margin: 30px 0; text-decoration: underline; }
            .content { font-size: 14px; line-height: 1.8; color: #334155; margin-bottom: 40px; text-align: justify; }
            .highlight { font-weight: bold; color: #0f172a; }
            .signatures { display: flex; justify-between: space-between; margin-top: 60px; padding-top: 30px; border-top: 1px solid #cbd5e1; }
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
              This is to officially certify that <span class="highlight">${emp.employee_name || emp.full_name}</span> served with distinction at 
              <span class="highlight">Antigravity Software House</span> as a full-fledged <span class="highlight">${emp.designation}</span> in the 
              <span class="highlight">${emp.department}</span> Department.
              <br/><br/>
              During their tenure with our organization, <span class="highlight">${emp.employee_name || emp.full_name}</span> exhibited exceptional professional skills, technical diligence, and outstanding work ethic in delivering enterprise software solutions and team deliverables.
              <br/><br/>
              Having officially tendered their resignation, we accept their resignation and release them from their duties effective today. We confirm that all corporate dues and exit salary payouts (Monthly Net: Rs. ${Number(emp.final_payable_salary || emp.basic_salary || 0).toLocaleString()}) have been settled.
              <br/><br/>
              We wish <span class="highlight">${emp.employee_name || emp.full_name}</span> the very best in all their future professional endeavors.
            </div>

            <div style="display:flex; justify-content:space-between; margin-top:50px;">
              <div style="text-align:center;">
                <div>________________________</div>
                <div style="margin-top:5px; font-size:12px; font-weight:bold;">Head of Human Resources</div>
              </div>
              <div style="text-align:center;">
                <div style="color:#2563eb; border:2px solid #2563eb; padding:5px 10px; border-radius:6px; font-size:10px; font-weight:bold;">OFFICIALLY VERIFIED & ISSUED</div>
                <div style="margin-top:5px; font-size:11px;">Date: ${todayStr}</div>
              </div>
              <div style="text-align:center;">
                <div>________________________</div>
                <div style="margin-top:5px; font-size:12px; font-weight:bold;">Chief Executive Officer (CEO)</div>
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

  // Alert Modal State
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info" });

  const showAlert = (title, message, type = "info") => {
    setModal({ isOpen: true, title, message, type });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  useEffect(() => {
    const savedRole = localStorage.getItem("user_role") || "admin";
    const savedEmail = localStorage.getItem("current_user_email") || "";
    setRole(savedRole);
    setUserEmail(savedEmail);

    const loadPayrolls = async () => {
      const defaultPayrolls = [
        { id: "p-1", employee_id: "emp-101", employee_name: "Muhammad Ali", department: "Web Development", designation: "Senior Lead Developer", email: "ali.staff@gmail.com", month: "2026-08", basic_salary: 120000, overtime_hours: 10, overtime_amount: 6000, leave_deduction: 0, late_penalty: 500, bonus_amount: 5000, incentive_amount: 3000, advance_deduction: 0, loan_deduction: 5000, final_payable_salary: 128500, status: "processed" },
        { id: "p-2", employee_id: "emp-102", employee_name: "Sara Khan", department: "UI/UX Design", designation: "Lead Designer", email: "sara.design@gmail.com", month: "2026-08", basic_salary: 95000, overtime_hours: 0, overtime_amount: 0, leave_deduction: 3650, late_penalty: 0, bonus_amount: 4000, incentive_amount: 2000, advance_deduction: 10000, loan_deduction: 0, final_payable_salary: 87350, status: "processed" },
        { id: "p-3", employee_id: "emp-103", employee_name: "Muhammad Rahim Bugti", department: "Engineering", designation: "Senior Full-Stack Developer", email: "rahim.staff@gmail.com", month: "2026-08", basic_salary: 150000, overtime_hours: 15, overtime_amount: 11250, leave_deduction: 0, late_penalty: 0, bonus_amount: 10000, incentive_amount: 5000, advance_deduction: 0, loan_deduction: 0, final_payable_salary: 176250, status: "processed" },
        { id: "p-4", employee_id: "emp-104", employee_name: "Usman Tariq", department: "QA Testing", designation: "Automation QA Engineer", email: "usman.qa@gmail.com", month: "2026-08", basic_salary: 80000, overtime_hours: 5, overtime_amount: 2500, leave_deduction: 2600, late_penalty: 500, bonus_amount: 3000, incentive_amount: 0, advance_deduction: 0, loan_deduction: 0, final_payable_salary: 82400, status: "processed" }
      ];

      const finalPayrolls = await dbFetch("payrolls", defaultPayrolls);
      setPayrolls(finalPayrolls);
      setLoading(false);
    };

    loadPayrolls();
  }, []);

  const savePayrollsState = (newList) => {
    setPayrolls(newList);
    localStorage.setItem("software_house_payrolls", JSON.stringify(newList));
  };

  // Automated Formula: Net Salary = Basic + Overtime + Bonus + Incentives - (Leave Cuts + Late Penalty + Loan/Advance)
  const calculateNetSalary = (rec) => {
    const basic = Number(rec.basic_salary || 0);
    const overtime = Number(rec.overtime_amount || (rec.overtime_hours || 0) * (rec.overtime_rate || 600));
    const bonus = Number(rec.bonus_amount || 0);
    const incentive = Number(rec.incentive_amount || 0);
    const leave = Number(rec.leave_deduction || 0);
    const late = Number(rec.late_penalty || 0);
    const advance = Number(rec.advance_deduction || 0);
    const loan = Number(rec.loan_deduction || 0);

    return basic + overtime + bonus + incentive - (leave + late + advance + loan);
  };

  const handleCreateEmployeePayroll = async (e) => {
    e.preventDefault();
    if (!newEmpForm.employee_name.trim() || !newEmpForm.email.trim()) return;

    const computedOvertime = Number(newEmpForm.overtime_hours || 0) * Number(newEmpForm.overtime_rate || 600);
    const tempObj = {
      ...newEmpForm,
      overtime_amount: computedOvertime,
    };
    const finalNet = calculateNetSalary(tempObj);

    const newRecordObj = {
      id: "p-" + Date.now(),
      employee_id: "emp-" + Math.floor(100 + Math.random() * 900),
      employee_name: newEmpForm.employee_name,
      department: newEmpForm.department,
      designation: newEmpForm.designation,
      email: newEmpForm.email.toLowerCase().trim(),
      month: selectedMonth,
      basic_salary: Number(newEmpForm.basic_salary),
      overtime_hours: Number(newEmpForm.overtime_hours),
      overtime_amount: computedOvertime,
      leave_deduction: Number(newEmpForm.leave_deduction),
      late_penalty: Number(newEmpForm.late_penalty),
      bonus_amount: Number(newEmpForm.bonus_amount),
      incentive_amount: Number(newEmpForm.incentive_amount),
      advance_deduction: 0,
      loan_deduction: Number(newEmpForm.loan_deduction),
      final_payable_salary: finalNet,
      status: "processed"
    };

    // Save Admin assigned login credentials so user can log in with their exact email, assigned password, and role!
    const assignedRole = newEmpForm.account_role || "employee";
    const userCredentials = {
      fullName: newEmpForm.employee_name,
      email: newEmpForm.email.toLowerCase().trim(),
      password: newEmpForm.assigned_password || "userpassword123",
      role: assignedRole,
      department: newEmpForm.department,
    };

    try {
      const saved = localStorage.getItem("registered_system_users");
      const existing = saved ? JSON.parse(saved) : [];
      const updatedUsers = [...existing.filter(u => u.email.toLowerCase() !== newEmpForm.email.toLowerCase().trim()), userCredentials];
      localStorage.setItem("registered_system_users", JSON.stringify(updatedUsers));
    } catch(e) {}

    // Save to Supabase Database synchronously first
    try {
      await supabase.from("employees").upsert([
        {
          full_name: newRecordObj.employee_name,
          email: newRecordObj.email,
          department: newRecordObj.department,
          designation: newRecordObj.designation,
          employment_type: "Paid Staff (Full Time)"
        }
      ]);
    } catch (e) {}

    try {
      const { data: pRes, error: pErr } = await supabase.from("payrolls").insert([
        {
          employee_name: newRecordObj.employee_name,
          email: newRecordObj.email,
          department: newRecordObj.department,
          designation: newRecordObj.designation,
          month: newRecordObj.month,
          basic_salary: newRecordObj.basic_salary,
          overtime_hours: newRecordObj.overtime_hours,
          overtime_amount: newRecordObj.overtime_amount,
          leave_deduction: newRecordObj.leave_deduction,
          late_penalty: newRecordObj.late_penalty,
          bonus_amount: newRecordObj.bonus_amount,
          incentive_amount: newRecordObj.incentive_amount,
          loan_deduction: newRecordObj.loan_deduction,
          final_payable_salary: newRecordObj.final_payable_salary,
          status: "processed",
          created_at: new Date().toISOString()
        }
      ]).select();

      if (pRes && pRes.length > 0) {
        newRecordObj.id = pRes[0].id;
      }
    } catch (e) {}

    const updated = [newRecordObj, ...payrolls];
    savePayrollsState(updated);

    setCreateModalOpen(false);
    setNewEmpForm({
      employee_name: "",
      email: "",
      assigned_password: "employeepassword123",
      department: "Engineering",
      designation: "Software Engineer",
      basic_salary: 75000,
      overtime_hours: 0,
      overtime_rate: 600,
      bonus_amount: 0,
      incentive_amount: 0,
      leave_deduction: 0,
      late_penalty: 0,
      loan_deduction: 0,
    });
    showAlert(
      "Employee Registered & Credentials Assigned! 🔑",
      `Employee: ${newRecordObj.employee_name}\nLogin Email: ${newRecordObj.email}\nAssigned Password: ${userCredentials.password}\n\nNet Salary: Rs. ${finalNet.toLocaleString()}\n\nThe employee can now log in at /login with these credentials!`,
      "success"
    );
  };

  const handleUpdateRecord = (e) => {
    e.preventDefault();
    if (!editingRecord) return;

    const finalNet = calculateNetSalary(editingRecord);
    const updatedRecord = {
      ...editingRecord,
      final_payable_salary: finalNet
    };

    const updated = payrolls.map((p) => (p.id === editingRecord.id ? updatedRecord : p));
    savePayrollsState(updated);
    setEditModalOpen(false);
    setEditingRecord(null);
    showAlert("Salary Recalculated & Saved ⚡", `Updated final payable salary for ${updatedRecord.employee_name} is Rs. ${finalNet.toLocaleString()}.`, "success");
  };

  const handleDeleteRecord = async (id) => {
    if (!confirm("Are you sure you want to remove this payroll record?")) return;
    
    const recordToDelete = payrolls.find(p => p.id === id);
    const updated = payrolls.filter((p) => p.id !== id);
    savePayrollsState(updated);

    // Delete from Supabase Database strictly
    try {
      if (recordToDelete && recordToDelete.email) {
        await supabase.from("payrolls").delete().eq("email", recordToDelete.email.toLowerCase().trim());
      }
      if (id) {
        await supabase.from("payrolls").delete().eq("id", id);
      }
    } catch(e) {}
  };

  // Role Filtering:
  // Admin / HR sees ALL employee payroll records.
  // Logged-in Employee / Staff ONLY sees their own individual salary Breakdown!
  const displayPayrolls = payrolls.filter((p) => {
    if (role === "admin" || role === "hr" || role === "accounts" || role === "manager") {
      return true;
    }
    // Employee perspective: view their own email matching record
    return p.email && p.email.toLowerCase().trim() === userEmail.toLowerCase().trim();
  });

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-3 text-[#0F172A]">
        <div className="w-8 h-8 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-[#64748B]">Loading Payroll & Salary Records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Alert Modal */}
      <Modal isOpen={modal.isOpen} title={modal.title} message={modal.message} type={modal.type} onClose={closeModal} />

      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-full border border-[#2563EB]/20">
              Finance & Payroll Sub-Module
            </span>
            <span className="text-[10px] font-semibold text-[#64748B] bg-[#F8FAFC] px-2.5 py-1 rounded-full border border-[#E2E8F0]">
              Automated Salary Calculation Engine
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold mt-1.5 text-[#0F172A] flex items-center gap-2.5">
            <FaMoneyBillWave className="text-[#2563EB]" />
            <span>Enterprise Payroll & Salary Engine</span>
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Automated Salary Processing: Basic Salary + Overtime + Bonuses − Deductions (Leaves / Late Fines / Loans).
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2 rounded-xl text-xs font-semibold">
            <FaFilter className="text-[#64748B]" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-[#0F172A] font-bold outline-none cursor-pointer"
            >
              <option value="2026-08">🗓️ August 2026</option>
              <option value="2026-07">🗓️ July 2026</option>
            </select>
          </div>

          {(role === "admin" || role === "hr" || role === "accounts" || role === "manager") && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <FaPlusCircle className="text-sm" />
              <span>+ Add Employee Salary</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase">
            {role === "admin" ? "Total Net Payroll Payable" : "My Net Payable Salary"}
          </p>
          <p className="text-2xl font-black text-slate-900 mt-2">
            Rs. {displayPayrolls.reduce((sum, p) => sum + Number(p.final_payable_salary || 0), 0).toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1">Calculated Net Payout</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase">Total Allowances & Overtime</p>
          <p className="text-2xl font-black text-emerald-600 mt-2">
            Rs. {displayPayrolls.reduce((sum, p) => sum + Number(p.overtime_amount || 0) + Number(p.bonus_amount || 0) + Number(p.incentive_amount || 0), 0).toLocaleString()}
          </p>
          <p className="text-xs text-emerald-700/70 mt-1">Overtime + Bonuses + Incentives</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase">Total Salary Deductions</p>
          <p className="text-2xl font-black text-rose-600 mt-2">
            Rs. {displayPayrolls.reduce((sum, p) => sum + Number(p.leave_deduction || 0) + Number(p.late_penalty || 0) + Number(p.advance_deduction || 0) + Number(p.loan_deduction || 0), 0).toLocaleString()}
          </p>
          <p className="text-xs text-rose-700/70 mt-1">Leave Cuts + Late Fines + Loan Repayments</p>
        </div>
      </div>

      {/* Employee Personal Login Salary View Notice (When logged in as Employee) */}
      {role !== "admin" && role !== "hr" && role !== "accounts" && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
              <FaCheckCircle className="text-emerald-600" />
              <span>Personal Employee Salary Portal Dashboard</span>
            </span>
            <p className="text-emerald-800 text-xs mt-0.5">
              Showing automatic salary breakdown for logged-in account: <strong>{userEmail}</strong>
            </p>
          </div>
          <a
            href="/dashboard/finance"
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-all"
          >
            <span>Finance Hub</span> <FaArrowRight />
          </a>
        </div>
      )}

      {/* Payroll Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex justify-between items-center">
          <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <FaUsers className="text-emerald-600" />
            <span>
              {role === "admin" ? "Master Employee Salary List & Calculations" : "My Monthly Salary Breakdown Sheet"}
            </span>
          </h2>
          <span className="text-xs font-semibold text-slate-500">Month: {selectedMonth}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px]">
                <th className="py-3 px-3">Employee Details</th>
                <th className="py-3 px-3">Basic Salary</th>
                <th className="py-3 px-3">Overtime</th>
                <th className="py-3 px-3">Bonus & Incentives</th>
                <th className="py-3 px-3">Deductions (Leaves/Loans)</th>
                <th className="py-3 px-3">Calculated Net Salary</th>
                <th className="py-3 px-3 text-right">Actions / Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayPayrolls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center text-xl border border-[#2563EB]/20">
                        <FaCalculator />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#0F172A]">No Payroll Records Found</h3>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          Payroll records will appear here once employee salaries are processed for {selectedMonth}.
                        </p>
                      </div>
                      {(role === "admin" || role === "hr" || role === "accounts" || role === "manager") && (
                        <button
                          type="button"
                          onClick={() => setCreateModalOpen(true)}
                          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                        >
                          <FaPlusCircle className="text-xs" />
                          <span>Generate Payroll</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                displayPayrolls.map((p) => {
                  const empObj = { full_name: p.employee_name, email: p.email, department: p.department, designation: p.designation };
                  const totalDeductions = Number(p.leave_deduction || 0) + Number(p.late_penalty || 0) + Number(p.advance_deduction || 0) + Number(p.loan_deduction || 0);
                  const totalAdditions = Number(p.overtime_amount || 0) + Number(p.bonus_amount || 0) + Number(p.incentive_amount || 0);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 text-sm">{p.employee_name}</div>
                        <div className="text-[11px] text-slate-500">{p.designation} • {p.department}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{p.email}</div>
                      </td>

                      <td className="py-3 px-3 font-bold text-slate-800">
                        Rs. {Number(p.basic_salary).toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-emerald-700 font-semibold">
                        + Rs. {Number(p.overtime_amount || 0).toLocaleString()}
                        <span className="text-[10px] text-slate-400 block font-normal">({p.overtime_hours || 0} hrs)</span>
                      </td>

                      <td className="py-3 px-3 text-emerald-700 font-semibold">
                        + Rs. {totalAdditions.toLocaleString()}
                        <span className="text-[10px] text-slate-400 block font-normal">(Bonus: Rs. {p.bonus_amount || 0})</span>
                      </td>

                      <td className="py-3 px-3 text-rose-600 font-semibold">
                        - Rs. {totalDeductions.toLocaleString()}
                        <span className="text-[10px] text-slate-400 block font-normal">(Leaves/Late Fines)</span>
                      </td>

                      <td className="py-3 px-3 font-black text-slate-900 text-base">
                        Rs. {Number(p.final_payable_salary).toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(role === "admin" || role === "hr" || role === "accounts") && (
                            <>
                              <button
                                onClick={() => handlePrintExperienceLetter(p)}
                                className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-all"
                                title="Print Experience Certificate & Letter"
                              >
                                <FaCertificate />
                                <span>Experience Cert</span>
                              </button>
                              <button
                                onClick={() => {
                                  setEditingRecord({ ...p });
                                  setEditModalOpen(true);
                                }}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg text-xs"
                                title="Adjust Salary / Bonuses"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDeleteRecord(p.id)}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-1.5 rounded-lg text-xs"
                                title="Delete Record"
                              >
                                <FaTrash />
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => generatePrintablePayslipPdf(p, empObj)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                          >
                            <FaFileDownload />
                            <span>PDF Payslip</span>
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

      {/* CREATE EMPLOYEE SALARY MODAL (ADMIN ONLY) */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FaMoneyBillWave className="text-emerald-600" />
                <span>Enter Employee Salary Details (Automated Calculation)</span>
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateEmployeePayroll} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Employee Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newEmpForm.employee_name}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, employee_name: e.target.value })}
                    placeholder="e.g. Usman Tariq"
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Employee Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newEmpForm.email}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, email: e.target.value })}
                    placeholder="usman.qa@gmail.com"
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Role Type (Decided by Admin) *</label>
                <select
                  value={newEmpForm.account_role || "employee"}
                  onChange={(e) => setNewEmpForm({ ...newEmpForm, account_role: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-emerald-600 font-bold bg-emerald-50/50"
                >
                  <option value="employee">💼 Paid Employee Staff (Access Staff Features & Salary)</option>
                  <option value="student">🎓 Enrolled Student (Access Course Fee Receipts & Exam Portal)</option>
                  <option value="intern">💻 3-Month Intern (Access Internship Portal & Workspace)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Login Password *</label>
                <input
                  type="text"
                  required
                  value={newEmpForm.assigned_password}
                  onChange={(e) => setNewEmpForm({ ...newEmpForm, assigned_password: e.target.value })}
                  placeholder="userpassword123"
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-emerald-600 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Password used by the user to log in at /login</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={newEmpForm.department}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, department: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={newEmpForm.designation}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, designation: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-1">Salary & Allowance Inputs</h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Basic Salary (PKR) *</label>
                    <input
                      type="number"
                      required
                      value={newEmpForm.basic_salary}
                      onChange={(e) => setNewEmpForm({ ...newEmpForm, basic_salary: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-emerald-600 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Overtime Hours</label>
                    <input
                      type="number"
                      value={newEmpForm.overtime_hours}
                      onChange={(e) => setNewEmpForm({ ...newEmpForm, overtime_hours: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Bonus Amount (PKR)</label>
                    <input
                      type="number"
                      value={newEmpForm.bonus_amount}
                      onChange={(e) => setNewEmpForm({ ...newEmpForm, bonus_amount: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Incentives / Overtime Bonus</label>
                    <input
                      type="number"
                      value={newEmpForm.incentive_amount}
                      onChange={(e) => setNewEmpForm({ ...newEmpForm, incentive_amount: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 space-y-3">
                <h4 className="font-bold text-rose-950 text-xs border-b border-rose-200 pb-1">Deduction Inputs (Leaves & Loans)</h4>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Leave Cuts (PKR)</label>
                    <input
                      type="number"
                      value={newEmpForm.leave_deduction}
                      onChange={(e) => setNewEmpForm({ ...newEmpForm, leave_deduction: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Late Fine (PKR)</label>
                    <input
                      type="number"
                      value={newEmpForm.late_penalty}
                      onChange={(e) => setNewEmpForm({ ...newEmpForm, late_penalty: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Loan Repay (PKR)</label>
                    <input
                      type="number"
                      value={newEmpForm.loan_deduction}
                      onChange={(e) => setNewEmpForm({ ...newEmpForm, loan_deduction: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-900 outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md cursor-pointer mt-2"
              >
                Calculate Net Salary & Save to Payroll
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT / ADJUST SALARY MODAL (ADMIN ONLY) */}
      {editModalOpen && editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Adjust Salary & Bonus: {editingRecord.employee_name}</h3>
                <p className="text-xs text-slate-500">{editingRecord.designation} • {editingRecord.email}</p>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleUpdateRecord} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Basic Salary (PKR)</label>
                  <input
                    type="number"
                    value={editingRecord.basic_salary}
                    onChange={(e) => setEditingRecord({ ...editingRecord, basic_salary: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bonus Amount (PKR)</label>
                  <input
                    type="number"
                    value={editingRecord.bonus_amount}
                    onChange={(e) => setEditingRecord({ ...editingRecord, bonus_amount: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Overtime Amount (PKR)</label>
                  <input
                    type="number"
                    value={editingRecord.overtime_amount}
                    onChange={(e) => setEditingRecord({ ...editingRecord, overtime_amount: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Incentives Amount (PKR)</label>
                  <input
                    type="number"
                    value={editingRecord.incentive_amount}
                    onChange={(e) => setEditingRecord({ ...editingRecord, incentive_amount: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Leave Cuts (PKR)</label>
                  <input
                    type="number"
                    value={editingRecord.leave_deduction}
                    onChange={(e) => setEditingRecord({ ...editingRecord, leave_deduction: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Late Fine (PKR)</label>
                  <input
                    type="number"
                    value={editingRecord.late_penalty}
                    onChange={(e) => setEditingRecord({ ...editingRecord, late_penalty: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Loan Deduction</label>
                  <input
                    type="number"
                    value={editingRecord.loan_deduction}
                    onChange={(e) => setEditingRecord({ ...editingRecord, loan_deduction: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md cursor-pointer mt-2"
              >
                Re-Calculate Net Salary & Save Updates
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
