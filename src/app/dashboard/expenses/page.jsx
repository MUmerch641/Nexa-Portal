"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/activityUtils";
import {
  FaWallet,
  FaBolt,
  FaWifi,
  FaCheckCircle,
  FaHourglassHalf,
  FaPlusCircle,
  FaTrash,
  FaExchangeAlt,
  FaFilter,
} from "react-icons/fa";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  // Form State
  const [form, setForm] = useState({
    title: "",
    category: "Electricity Bill",
    amount: "",
    payment_status: "Paid",
    expense_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const categories = [
    "Electricity Bill",
    "Internet & Fiber Bill",
    "Cloud & Software Subscriptions",
    "Office Rent",
    "Employee Salaries",
    "Refreshments & Tea",
    "Equipment & Maintenance",
    "Misc / Other",
  ];

  // Fetch Expenses with LocalStorage Persistence & Supabase Sync
  const fetchExpenses = async () => {
    setLoading(true);
    let dbData = [];
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("expense_date", { ascending: false });

      if (!error && data) {
        dbData = data;
      }
    } catch (err) {}

    let localData = [];
    try {
      const s = localStorage.getItem("persistent_expenses");
      if (s) localData = JSON.parse(s);
    } catch(e) {}

    const map = new Map();
    localData.forEach(item => {
      if (item.id || item.title) map.set(item.id || item.title, item);
    });
    dbData.forEach(item => {
      if (item.id || item.title) map.set(item.id || item.title, { ...map.get(item.id || item.title), ...item });
    });

    const finalExpenses = Array.from(map.values());
    setExpenses(finalExpenses);
    try {
      localStorage.setItem("persistent_expenses", JSON.stringify(finalExpenses));
    } catch(e) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Handle Form Input Change
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // Add Expense Record
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!form.title || !form.amount) {
      alert("Please enter title and amount.");
      return;
    }

    setSubmitting(true);

    try {
      const newExp = {
        id: `exp-${Date.now()}`,
        title: form.title,
        category: form.category,
        amount: Number(form.amount),
        payment_status: form.payment_status,
        expense_date: form.expense_date || new Date().toISOString().split("T")[0],
        notes: form.notes || "",
      };

      const updated = [newExp, ...expenses];
      setExpenses(updated);
      try {
        localStorage.setItem("persistent_expenses", JSON.stringify(updated));
        localStorage.setItem("software_house_finance_expenses", JSON.stringify(updated));
      } catch(e) {}

      // Background sync to Supabase
      supabase.from("expenses").insert([{
        title: form.title,
        category: form.category,
        amount: Number(form.amount),
        payment_status: form.payment_status,
        expense_date: form.expense_date,
        notes: form.notes,
      }]).catch(() => {});

      try {
        logActivity(
          "Accounts Manager",
          "Expense Added",
          `Recorded ${form.category}: ${form.title} (Rs. ${Number(form.amount).toLocaleString("en-PK")})`,
          "expense"
        ).catch(() => {});
      } catch(e) {}

      alert("Expense Record Added Successfully!");
      setForm({
        title: "",
        category: "Electricity Bill",
        amount: "",
        payment_status: "Paid",
        expense_date: new Date().toISOString().split("T")[0],
        notes: "",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Payment Status (Paid <-> Unpaid)
  const togglePaymentStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "Paid" ? "Unpaid" : "Paid";
    const updated = expenses.map(item => item.id === id ? { ...item, payment_status: newStatus } : item);
    setExpenses(updated);
    try {
      localStorage.setItem("persistent_expenses", JSON.stringify(updated));
    } catch(e) {}

    supabase.from("expenses").update({ payment_status: newStatus }).eq("id", id).catch(() => {});
  };

  // Delete Expense Record
  const handleDeleteExpense = async (id) => {
    if (!confirm("Are you sure you want to delete this expense record?")) return;

    const updated = expenses.filter(item => item.id !== id);
    setExpenses(updated);
    try {
      localStorage.setItem("persistent_expenses", JSON.stringify(updated));
    } catch(e) {}

    supabase.from("expenses").delete().eq("id", id).catch(() => {});
  };

  // Calculate Metrics
  const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalPaid = expenses
    .filter((item) => item.payment_status === "Paid")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalUnpaid = expenses
    .filter((item) => item.payment_status === "Unpaid")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const electricityTotal = expenses
    .filter((item) => item.category === "Electricity Bill")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const internetTotal = expenses
    .filter((item) => item.category === "Internet & Fiber Bill" || item.category === "Cloud & Software Subscriptions")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  // Filtered List
  const filteredExpenses = expenses.filter((item) => {
    const matchesCategory = filterCategory === "All" || item.category === filterCategory;
    const matchesStatus = filterStatus === "All" || item.payment_status === filterStatus;
    return matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Software House Expenses</h1>
        <p className="text-sm text-slate-500 mt-1">
          Track electricity, internet, rent, cloud tools, salaries, and office operational costs
        </p>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total Overall Expenses */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Expenses
            </p>
            <FaWallet className="text-blue-600 text-lg" />
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {loading ? "..." : `${totalExpenses.toLocaleString()} PKR`}
          </p>
        </div>

        {/* Total Paid */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Total Paid
            </p>
            <FaCheckCircle className="text-emerald-600 text-lg" />
          </div>
          <p className="mt-2 text-xl font-bold text-emerald-700">
            {loading ? "..." : `${totalPaid.toLocaleString()} PKR`}
          </p>
        </div>

        {/* Total Unpaid / Pending */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
              Unpaid / Pending
            </p>
            <FaHourglassHalf className="text-amber-600 text-lg" />
          </div>
          <p className="mt-2 text-xl font-bold text-amber-700">
            {loading ? "..." : `${totalUnpaid.toLocaleString()} PKR`}
          </p>
        </div>

        {/* Electricity Total */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Electricity Bills
            </p>
            <FaBolt className="text-amber-500 text-lg" />
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {loading ? "..." : `${electricityTotal.toLocaleString()} PKR`}
          </p>
        </div>

        {/* Internet & Cloud Total */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Internet & Cloud
            </p>
            <FaWifi className="text-indigo-600 text-lg" />
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {loading ? "..." : `${internetTotal.toLocaleString()} PKR`}
          </p>
        </div>
      </div>

      {/* Main Form & Table Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Add Expense Form */}
        <div className="lg:col-span-1 rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 h-fit">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <FaPlusCircle className="text-blue-600" />
            <span>Add New Expense</span>
          </h2>

          <form onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Title / Bill Name *
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. July K-Electric Bill, StormFiber"
                required
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Category *
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Amount (PKR) *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="e.g. 25000"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Payment Status
                </label>
                <select
                  name="payment_status"
                  value={form.payment_status}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                >
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Expense Date
              </label>
              <input
                type="date"
                name="expense_date"
                value={form.expense_date}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Notes / Reference
              </label>
              <textarea
                rows={2}
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Consumer number, transaction ID..."
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Expense Record"}
            </button>
          </form>
        </div>

        {/* Expenses List & Filter Table */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col">
          {/* Table Controls & Filters Header */}
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FaFilter className="text-slate-500 text-sm" />
              <span>Expense History</span>
            </h2>

            <div className="flex items-center gap-2">
              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 outline-none bg-white focus:border-blue-600"
              >
                <option value="All">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 outline-none bg-white focus:border-blue-600"
              >
                <option value="All">All Statuses</option>
                <option value="Paid">Paid Only</option>
                <option value="Unpaid">Unpaid Only</option>
              </select>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Title / Category</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredExpenses.length > 0 ? (
                  filteredExpenses.map((exp) => {
                    const isPaid = exp.payment_status === "Paid";
                    return (
                      <tr key={exp.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-900">{exp.title}</div>
                          <div className="text-xs text-slate-500">{exp.category}</div>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-900">
                          {Number(exp.amount || 0).toLocaleString()} PKR
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-500">
                          {exp.expense_date || "—"}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-block rounded-md px-2.5 py-0.5 text-xs font-semibold border ${
                              isPaid
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {exp.payment_status || "Paid"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right flex items-center justify-end gap-2">
                          {/* Toggle Paid/Unpaid Status */}
                          <button
                            onClick={() => togglePaymentStatus(exp.id, exp.payment_status)}
                            title={isPaid ? "Mark as Unpaid" : "Mark as Paid"}
                            className={`p-1.5 rounded-md text-xs font-medium border transition-colors ${
                              isPaid
                                ? "text-amber-700 border-amber-300 hover:bg-amber-50"
                                : "text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                            }`}
                          >
                            <FaExchangeAlt />
                          </button>

                          {/* Delete Record */}
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            title="Delete Expense"
                            className="p-1.5 rounded-md text-xs font-medium text-rose-600 border border-rose-200 hover:bg-rose-50 transition-colors"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-xs">
                      No expense records found matching selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
