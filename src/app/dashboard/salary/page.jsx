"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { dbSaveRecord } from "@/lib/dbPersistence";
import Modal from "@/components/Modal";
import Link from "next/link";
import { FaLandmark, FaCalculator, FaMoneyBillWave } from "react-icons/fa";

export default function SalaryPage() {
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [month, setMonth] = useState("July 2026");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [loading, setLoading] = useState(false);

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

  const getEmployees = async () => {
    let localEmps = [];
    try {
      const saved = localStorage.getItem("persistent_employees");
      if (saved) localEmps = JSON.parse(saved);
    } catch (e) { }

    try {
      const { data, error } = await supabase
        .from("employees")
        .select("id, full_name")
        .order("full_name");

      if (!error && data && data.length > 0) {
        const empMap = new Map();
        localEmps.forEach(e => { if (e.id && e.full_name) empMap.set(String(e.id), e); });
        data.forEach(e => { if (e.id && e.full_name) empMap.set(String(e.id), e); });
        setEmployees(Array.from(empMap.values()));
        return;
      }
    } catch (err) { }

    if (localEmps.length > 0) {
      setEmployees(localEmps);
    } else {
      setEmployees([
        { id: "emp-101", full_name: "Muhammad Ali" },
        { id: "emp-102", full_name: "Sara Khan" },
        { id: "emp-103", full_name: "Muhammad " },
        { id: "emp-104", full_name: "Usman Tariq" }
      ]);
    }
  };

  useEffect(() => {
    getEmployees();
  }, []);

  const saveSalary = async (e) => {
    e.preventDefault();

    if (!employeeId || !month || !amount) {
      showAlert("Missing Fields", "Please select Employee, Month, and Amount.", "warning");
      return;
    }

    setLoading(true);

    const empObj = employees.find(e => String(e.id) === String(employeeId));
    const empName = empObj ? empObj.full_name : "Employee";

    const salaryObj = {
      id: `sal-${Date.now()}`,
      employee_id: employeeId,
      employee_name: empName,
      month: month,
      basic_salary: Number(amount),
      final_payable_salary: Number(amount),
      amount: Number(amount),
      payment_method: paymentMethod,
      created_at: new Date().toISOString()
    };

    await dbSaveRecord("salary", salaryObj);

    try {
      await supabase.from("salary").insert([
        {
          employee_id: employeeId,
          month: month,
          amount: Number(amount),
          payment_method: paymentMethod,
        },
      ]).catch(() => { });
    } catch (err) { }

    showAlert("Salary Record Saved!", `Payroll disbursement recorded successfully for ${empName}.`, "success");

    setEmployeeId("");
    setMonth("July 2026");
    setAmount("");
    setPaymentMethod("Bank Transfer");
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Custom Modal */}
      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={closeModal}
      />

      {/* Redirect Banner to Attendance Calculator Hub */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <FaCalculator className="text-blue-600 text-xl" />
          <div>
            <div className="text-xs font-bold text-blue-900">Attendance-Based Salary Calculator Available!</div>
            <div className="text-[11px] text-blue-700">Calculate net salary with 30-day attendance % & 3 allowed paid leaves.</div>
          </div>
        </div>

        <Link
          href="/dashboard/finance"
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-xs shrink-0"
        >
          Open Finance Hub
        </Link>
      </div>

      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FaMoneyBillWave className="text-blue-600" />
          <span>Salary Disbursement</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Record monthly payroll and staff salary payments
        </p>
      </div>

      <form
        onSubmit={saveSalary}
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4"
      >
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Select Employee *
          </label>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
            required
          >
            <option value="">-- Select Employee --</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.full_name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Salary Month *
            </label>
            <input
              type="text"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              placeholder="e.g. July 2026"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Salary Amount (PKR) *
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 75000"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Payment Method
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
          >
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cash">Cash</option>
            <option value="Cheque">Cheque</option>
            <option value="Easypaisa / JazzCash">Easypaisa / JazzCash</option>
          </select>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Salary Record"}
          </button>
        </div>
      </form>
    </div>
  );
}