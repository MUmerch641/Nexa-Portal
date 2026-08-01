"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import {
  fetchFinanceRecords,
  addFinanceRecord,
  togglePaid,
  calculateTotals,
} from "@/lib/financeUtils";
import {
  FaLandmark,
  FaMoneyBillWave,
  FaBolt,
  FaWifi,
  FaReceipt,
  FaPlusCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaLock,
  FaShieldAlt
} from "react-icons/fa";
import "@/app/dashboard/finance/finance.css";

export default function FinancePage() {
  const [role, setRole] = useState("admin");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info" });

  // Month-Wise Filter State (e.g. 'all', '2026-08', '2026-07')
  const [selectedMonth, setSelectedMonth] = useState("all");

  // Form state for new expense
  const [newRecord, setNewRecord] = useState({
    type: "salary",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    paid: false,
  });

  // Load role from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("user_role") || "admin";
    setRole(stored);
  }, []);

  // Load finance records on mount
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchFinanceRecords();
        setRecords(data || []);
      } catch (e) {
        // Fallback dataset
        setRecords([
          { id: "1", type: "salary", amount: 150000, description: "Software Developers July Salaries", date: "2026-07-31", paid: true },
          { id: "2", type: "electricity", amount: 25000, description: "K-Electric Monthly Office Bill", date: "2026-08-05", paid: false },
          { id: "3", type: "internet", amount: 8500, description: "Optix Fiber 100Mbps Dedicated Line", date: "2026-08-02", paid: false },
          { id: "4", type: "other", amount: 12000, description: "Office Tea, Coffee & Refreshments", date: "2026-07-28", paid: true },
          { id: "5", type: "salary", amount: 165000, description: "Software Developers August Salaries", date: "2026-08-30", paid: true },
          { id: "6", type: "electricity", amount: 28000, description: "K-Electric August Aircon Bill", date: "2026-08-25", paid: true },
        ]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewRecord((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAdd = async () => {
    if (!newRecord.amount || !newRecord.date) {
      setModal({ isOpen: true, title: "Missing Fields", message: "Please fill in the amount and date.", type: "warning" });
      return;
    }
    try {
      const recordToAdd = {
        ...newRecord,
        amount: Number(newRecord.amount),
      };
      const inserted = await addFinanceRecord(recordToAdd);
      setRecords((prev) => [...prev, inserted]);
      setModal({ isOpen: true, title: "Success", message: "Expense record added successfully!", type: "success" });
    } catch (e) {
      // Local fallback insert
      const mockObj = { ...newRecord, id: Date.now().toString(), amount: Number(newRecord.amount) };
      setRecords((prev) => [...prev, mockObj]);
      setModal({ isOpen: true, title: "Success (Local)", message: "New expense added to current view.", type: "success" });
    } finally {
      setNewRecord({ type: "salary", amount: "", description: "", date: new Date().toISOString().split("T")[0], paid: false });
    }
  };

  const handleTogglePaid = async (id, current) => {
    try {
      await togglePaid(id, !current);
      setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, paid: !current } : r)));
    } catch (e) {
      setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, paid: !current } : r)));
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-semibold">Loading Financial Records...</div>;

  // Strict Admin Check
  if (role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm max-w-lg mx-auto my-12">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center text-2xl mb-4">
          <FaLock />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Admin Access Only</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-xs">
          Finance & Accounts details (Employee Salaries, Electricity, Internet Bills & Expenses) are strictly reserved for Administrator view.
        </p>
        <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded-lg">
          <FaShieldAlt className="text-slate-500" />
          <span>Restricted Portal View</span>
        </div>
      </div>
    );
  }

  // Extract unique YYYY-MM months from records for the dropdown selector
  const availableMonths = Array.from(
    new Set(records.map((r) => r.date?.substring(0, 7)).filter(Boolean))
  ).sort().reverse();

  // Filter records by selected month
  const filteredRecords = selectedMonth === "all"
    ? records
    : records.filter((r) => r.date?.startsWith(selectedMonth));

  const { totalsByType, overallTotal } = calculateTotals(filteredRecords);
  const totalPaid = filteredRecords.filter(r => r.paid).reduce((acc, r) => acc + Number(r.amount || 0), 0);
  const totalUnpaid = filteredRecords.filter(r => !r.paid).reduce((acc, r) => acc + Number(r.amount || 0), 0);

  const getIconForType = (type) => {
    switch (type) {
      case "salary": return <FaMoneyBillWave className="text-emerald-500" />;
      case "electricity": return <FaBolt className="text-amber-500" />;
      case "internet": return <FaWifi className="text-blue-500" />;
      default: return <FaReceipt className="text-purple-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FaLandmark className="text-blue-600" />
            <span>Finance & Software House Accounts</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Admin-only management for total company expenses, staff salary payouts, and electricity/internet utility bills.
          </p>
        </div>

        {/* Month-Wise Report Selector */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex items-center gap-2 bg-white border border-slate-300 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Month Report:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-slate-900 font-bold outline-none cursor-pointer"
            >
              <option value="all">📅 All Months Overall</option>
              {availableMonths.map((m) => {
                const dateObj = new Date(`${m}-01`);
                const labelStr = dateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" });
                return (
                  <option key={m} value={m}>
                    🗓️ {labelStr}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-1.5 rounded-xl text-xs font-bold">
            <FaShieldAlt className="text-emerald-600 text-sm" />
            <span>Admin Verified</span>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Software House Expenses</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <FaLandmark className="text-lg" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">Rs. {overallTotal.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">Combined total recorded expenses</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Staff Salary Payouts</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <FaMoneyBillWave className="text-lg" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">Rs. {(totalsByType.salary || 0).toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">Total salaries allocated/paid</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending / Unpaid Bills</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <FaTimesCircle className="text-lg" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-3">Rs. {totalUnpaid.toLocaleString()}</p>
          <p className="text-xs text-amber-700/70 mt-1">Electricity, Internet & dues pending</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Cleared / Paid Out</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <FaCheckCircle className="text-lg" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-3">Rs. {totalPaid.toLocaleString()}</p>
          <p className="text-xs text-emerald-700/70 mt-1">Completed bills & salary payouts</p>
        </div>
      </div>

      {/* Category Breakdown Chips */}
      <div className="flex flex-wrap gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs">
          <FaBolt className="text-amber-500" />
          <span>Electricity Bills: <strong>Rs. {(totalsByType.electricity || 0).toLocaleString()}</strong></span>
        </div>
        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs">
          <FaWifi className="text-blue-500" />
          <span>Internet Dues: <strong>Rs. {(totalsByType.internet || 0).toLocaleString()}</strong></span>
        </div>
        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs">
          <FaReceipt className="text-purple-500" />
          <span>Other Expenses: <strong>Rs. {(totalsByType.other || 0).toLocaleString()}</strong></span>
        </div>
      </div>

      {/* MONTH-WISE COMPARISON & BREAKDOWN CARDS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FaLandmark className="text-blue-600" />
              <span>Month-Wise Separate Financial Summaries & Comparison</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Compare total expenses, salaries, and utility bills separately for each month
            </p>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg">
            {availableMonths.length} Months Tracked
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableMonths.map((m) => {
            const monthRecords = records.filter((r) => r.date?.startsWith(m));
            const monthTotal = monthRecords.reduce((sum, r) => sum + Number(r.amount || 0), 0);
            const monthSalaries = monthRecords.filter(r => r.type === "salary").reduce((sum, r) => sum + Number(r.amount || 0), 0);
            const monthUtilities = monthRecords.filter(r => r.type === "electricity" || r.type === "internet").reduce((sum, r) => sum + Number(r.amount || 0), 0);
            const monthPaid = monthRecords.filter(r => r.paid).reduce((sum, r) => sum + Number(r.amount || 0), 0);
            const monthUnpaid = monthRecords.filter(r => !r.paid).reduce((sum, r) => sum + Number(r.amount || 0), 0);

            const dateObj = new Date(`${m}-01`);
            const monthName = dateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" });

            return (
              <div key={m} className={`rounded-xl p-4 border space-y-3 transition-all ${selectedMonth === m ? "bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20" : "bg-slate-50 border-slate-200 hover:border-blue-200"}`}>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-900 text-sm">🗓️ {monthName}</span>
                  <button
                    onClick={() => setSelectedMonth(m)}
                    className="text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    View Details →
                  </button>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Total Expense:</span>
                    <strong className="text-slate-900 font-bold">Rs. {monthTotal.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Staff Salaries:</span>
                    <strong className="text-emerald-700 font-semibold">Rs. {monthSalaries.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Electricity & Internet:</span>
                    <strong className="text-amber-700 font-semibold">Rs. {monthUtilities.toLocaleString()}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-emerald-100/60 p-2 rounded-lg text-emerald-800 font-bold text-center">
                    Paid: Rs. {monthPaid.toLocaleString()}
                  </div>
                  <div className="bg-rose-100/60 p-2 rounded-lg text-rose-800 font-bold text-center">
                    Unpaid: Rs. {monthUnpaid.toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expense Records Table */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center justify-between">
            <span>Expenses & Payout Records</span>
            <span className="text-xs font-normal text-slate-500">Total Records: {records.length}</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase text-slate-500 font-semibold">
                  <th className="py-3 px-3">Expense Type</th>
                  <th className="py-3 px-3">Details</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Payment Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-slate-400 text-xs">
                      No expense records found for this month report filter.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 capitalize font-semibold text-slate-800 flex items-center gap-2">
                        {getIconForType(r.type)}
                        <span>{r.type}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 text-xs max-w-[180px] truncate">
                        {r.description || "N/A"}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        Rs. {Number(r.amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-500 whitespace-nowrap">
                        {r.date}
                      </td>
                      <td className="py-3 px-3">
                        {r.paid ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
                            <FaCheckCircle className="text-[10px]" /> Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
                            <FaTimesCircle className="text-[10px]" /> Unpaid Dues
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleTogglePaid(r.id, r.paid)}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                            r.paid
                              ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs"
                          }`}
                        >
                          Mark as {r.paid ? "Unpaid" : "Paid"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add New Expense Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs h-fit">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FaPlusCircle className="text-blue-600" />
            <span>Add New Bill / Expense</span>
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Expense Type *</label>
              <select
                name="type"
                value={newRecord.type}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 bg-white"
              >
                <option value="salary">💼 Employee Salary Payout</option>
                <option value="electricity">⚡ Electricity Bill</option>
                <option value="internet">🌐 Internet Connection Bill</option>
                <option value="other">📝 Other Office Expense</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Amount (PKR) *</label>
              <input
                type="number"
                name="amount"
                placeholder="e.g. 25000"
                value={newRecord.amount}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Billing / Expense Date *</label>
              <input
                type="date"
                name="date"
                value={newRecord.date}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Description / Notes</label>
              <input
                type="text"
                name="description"
                placeholder="e.g. July Electricity Bill"
                value={newRecord.description}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="paid"
                  checked={newRecord.paid}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-semibold text-slate-700">Already Paid / Cleared</span>
              </label>
            </div>

            <button
              onClick={handleAdd}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md mt-2 flex items-center justify-center gap-2"
            >
              <FaPlusCircle />
              <span>Record Expense</span>
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={() => setModal({ ...modal, isOpen: false })}
      />
    </div>
  );
}

