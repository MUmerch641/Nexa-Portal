"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { dbFetch, dbSaveRecord, dbDeleteRecord } from "@/lib/dbPersistence";
import Modal from "@/components/Modal";
import {
  FaUserTie,
  FaBuilding,
  FaHandHoldingUsd,
  FaCheckCircle,
  FaHourglassHalf,
  FaPlusCircle,
  FaTrash,
  FaSearch,
  FaFileInvoiceDollar,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaPaperPlane,
  FaMoneyCheckAlt,
  FaPrint,
  FaTimes,
  FaExclamationTriangle,
} from "react-icons/fa";

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  // Modal State
  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  // Invoice Preview Modal State
  const [invoiceModal, setInvoiceModal] = useState({
    isOpen: false,
    client: null,
  });

  // Invoice Form State
  const [invoiceForm, setInvoiceForm] = useState({
    invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    amount: "",
    due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    notes: "Payment due within 15 days of invoice date.",
  });

  const showAlert = (title, message, type = "info") => {
    setModal({ isOpen: true, title, message, type });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  const todayStr = new Date().toISOString().split("T")[0];

  // Client Registration Form State
  const [form, setForm] = useState({
    client_name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    project_name: "",
    contract_start_date: todayStr,
    contract_end_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    contract_value: "",
    amount_paid: "",
    payment_status: "Paid",
    notes: "",
  });

  // Fetch Clients & Invoices with Persistence & Supabase Sync
  const fetchClients = async () => {
    setLoading(true);
    const finalClients = await dbFetch("clients");
    setClients(finalClients);

    try {
      // Fetch Invoices
      const { data: invData } = await supabase
        .from("invoices")
        .select("*, clients(client_name)")
        .order("created_at", { ascending: false });
      if (invData) setInvoices(invData);
    } catch(err) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // Add New Client Record
  const handleAddClient = async (e) => {
    e.preventDefault();
    if (!form.client_name || !form.email || !form.contract_value) {
      showAlert("Missing Required Fields", "Please enter Client Name, Email, and Contract Value.", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const contractVal = Number(form.contract_value || 0);
      const paidVal = Number(form.amount_paid || 0);

      let calculatedStatus = form.payment_status;
      if (paidVal >= contractVal) {
        calculatedStatus = "Paid";
      } else if (paidVal > 0) {
        calculatedStatus = "Partial Deposit";
      } else {
        calculatedStatus = "Pending Invoice";
      }

      const newClientObj = {
        id: `client-${Date.now()}`,
        client_name: form.client_name,
        contact_person: form.contact_person || "",
        email: form.email,
        phone: form.phone || "",
        project_name: form.project_name || "",
        contract_value: contractVal,
        amount_paid: paidVal,
        payment_status: calculatedStatus,
        notes: form.notes || "",
        address: form.address || "",
        contract_start_date: form.contract_start_date || todayStr,
        contract_end_date: form.contract_end_date || "",
        created_at: new Date().toISOString()
      };

      await dbSaveRecord("clients", newClientObj);
      const updatedList = await dbFetch("clients");
      setClients(updatedList);

      // Save credentials for Client Login Portal!
      const userCredentials = {
        fullName: form.client_name,
        email: form.email,
        password: "clientpassword123",
        role: "client",
        company: form.client_name
      };
      try {
        const saved = localStorage.getItem("registered_system_users");
        const existing = saved ? JSON.parse(saved) : [];
        const updatedUsers = [
          ...existing.filter(u => u && u.email && u.email.toLowerCase() !== form.email.toLowerCase()),
          userCredentials
        ];
        localStorage.setItem("registered_system_users", JSON.stringify(updatedUsers));
      } catch(e) {}

      // Sync DB in background
      supabase.from("clients").insert([newClientObj]).catch(() => {});

      try {
        logActivity(
          "Admin / Sales",
          "Client Onboarded",
          `Registered new corporate client ${form.client_name} (Contract Value: Rs. ${contractVal.toLocaleString()})`,
          "expense"
        ).catch(() => {});
      } catch(e) {}

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("dataChanged"));
        window.dispatchEvent(new Event("storage"));
      }

      showToast(
        "Client Profile & Contract Created! 🟢",
        `Client: ${form.client_name}\nProject: ${form.project_name || "Custom"}\nLogin Created: ${form.email}`,
        "success"
      );

      setForm({
        client_name: "",
        contact_person: "",
        email: "",
        phone: "",
        address: "",
        project_name: "",
        contract_start_date: todayStr,
        contract_end_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        contract_value: "",
        amount_paid: "",
        payment_status: "Paid",
        notes: "",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Generate Invoice for Client
  const handleGenerateInvoice = async (client) => {
    const amountStr = prompt(`Generate Invoice for ${client.client_name}.\nEnter Invoice Amount (PKR):`, (Number(client.contract_value || 0) - Number(client.amount_paid || 0)).toString());

    if (!amountStr || isNaN(amountStr)) return;

    const invNum = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const dueDateStr = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const { error } = await supabase.from("invoices").insert([
      {
        client_id: client.id,
        invoice_number: invNum,
        amount: Number(amountStr),
        due_date: dueDateStr,
        status: "Unpaid",
      },
    ]);

    if (error) {
      showAlert("Error Generating Invoice", error.message, "error");
      return;
    }

    showAlert("Invoice Generated!", `Invoice ${invNum} created for ${client.client_name} for ${Number(amountStr).toLocaleString()} PKR.\nDue Date: ${dueDateStr}`, "success");
    fetchClients();
  };

  // Record Client Payment Update
  const handleRecordPayment = async (clientId, currentContract, currentPaid) => {
    const additionalAmount = prompt(
      `Current Received: ${currentPaid.toLocaleString()} PKR / ${currentContract.toLocaleString()} PKR.\nEnter additional payment amount collected (PKR):`
    );

    if (!additionalAmount || isNaN(additionalAmount)) return;

    const newTotalPaid = Number(currentPaid) + Number(additionalAmount);
    let newStatus = "Partial Deposit";
    if (newTotalPaid >= currentContract) {
      newStatus = "Paid";
    }

    const { error } = await supabase
      .from("clients")
      .update({
        amount_paid: newTotalPaid,
        payment_status: newStatus,
      })
      .eq("id", clientId);

    if (error) {
      showAlert("Error Updating Payment", error.message, "error");
      return;
    }

    showAlert(
      "Payment Recorded!",
      `Updated total collected for client to: ${newTotalPaid.toLocaleString()} PKR`,
      "success"
    );

    fetchClients();
  };

  // Send Overdue Invoice Reminder Email
  const sendOverdueReminder = (client) => {
    showAlert(
      "📧 Overdue Invoice Reminder Sent!",
      `Reminder Email sent to: ${client.client_name} (${client.email})\n\nSubject: Overdue Payment Notice\nMessage: Outstanding payment balance of ${(Number(client.contract_value || 0) - Number(client.amount_paid || 0)).toLocaleString()} PKR for project '${client.project_name}' is pending. Please process invoice payment.`,
      "info"
    );
  };

  // Delete Client
  const handleDeleteClient = async (id, clientEmail) => {
    if (!confirm("Are you sure you want to delete this client record?")) return;

    // Remove from local state immediately
    const updated = clients.filter(c => c.id !== id);
    setClients(updated);

    try {
      localStorage.setItem("software_house_master_clients", JSON.stringify(updated));
    } catch(e) {}

    // Delete from Supabase Database
    try {
      if (id) {
        await supabase.from("clients").delete().eq("id", id);
      }
      if (clientEmail) {
        await supabase.from("clients").delete().eq("email", clientEmail);
      }
    } catch (e) {}

    showAlert("Client Record Deleted 🗑️", "Client deal record deleted successfully.", "success");
    fetchClients();
  };

  // Financial Metrics
  const totalContractVal = clients.reduce((sum, item) => sum + Number(item.contract_value || 0), 0);
  const totalReceivedVal = clients.reduce((sum, item) => sum + Number(item.amount_paid || 0), 0);
  const totalPendingVal = totalContractVal - totalReceivedVal;

  // Filtered List
  const filteredClients = clients.filter((item) => {
    const matchesSearch =
      item.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === "All" || item.payment_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Custom Modal */}
      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={closeModal}
      />

      {/* Page Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <FaUserTie className="text-blue-600" />
          <span>Client Details, Contracts & Invoicing</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage client profiles, contract dates, billing history, invoice generation, and overdue reminders
        </p>
      </div>

      {/* Financial Overview Metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Contract Value
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {loading ? "..." : `${totalContractVal.toLocaleString()} PKR`}
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <FaBuilding className="text-xl" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Total Revenue Received
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-700">
              {loading ? "..." : `${totalReceivedVal.toLocaleString()} PKR`}
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <FaHandHoldingUsd className="text-xl" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">
              Outstanding Balance Due
            </p>
            <p className="mt-2 text-2xl font-bold text-rose-700">
              {loading ? "..." : `${totalPendingVal.toLocaleString()} PKR`}
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
            <FaHourglassHalf className="text-xl" />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Client Registration Form */}
        <div className="lg:col-span-1 rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 h-fit">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <FaPlusCircle className="text-blue-600" />
            <span>Add Client & Contract</span>
          </h2>

          <form onSubmit={handleAddClient} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Client / Company Name *
              </label>
              <input
                type="text"
                name="client_name"
                value={form.client_name}
                onChange={handleChange}
                placeholder="e.g. Apex Tech Systems"
                required
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Contact Person Name
              </label>
              <input
                type="text"
                name="contact_person"
                value={form.contact_person}
                onChange={handleChange}
                placeholder="e.g. Mr. David Smith (Director)"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="client@company.com"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+92 300 1234567"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Office / Company Address
              </label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Suite 402, Business Tower, Karachi"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Project Title / Scope
              </label>
              <input
                type="text"
                name="project_name"
                value={form.project_name}
                onChange={handleChange}
                placeholder="e.g. Enterprise SaaS Portal"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Contract Start Date
                </label>
                <input
                  type="date"
                  name="contract_start_date"
                  value={form.contract_start_date}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Contract End Date
                </label>
                <input
                  type="date"
                  name="contract_end_date"
                  value={form.contract_end_date}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Total Agreed Cost *
                </label>
                <input
                  type="number"
                  name="contract_value"
                  value={form.contract_value}
                  onChange={handleChange}
                  placeholder="e.g. 500000"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Amount Received *
                </label>
                <input
                  type="number"
                  name="amount_paid"
                  value={form.amount_paid}
                  onChange={handleChange}
                  placeholder="e.g. 250000"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitting ? "Saving Client..." : "Save Client Profile & Contract"}
            </button>
          </form>
        </div>

        {/* Client Directory & Invoice Tracker Table */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col">
          {/* Search Controls */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <FaSearch className="absolute left-3 top-3 text-slate-400 text-xs" />
              <input
                type="text"
                placeholder="Search client, project, address, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 pl-8 pr-3 py-1.5 text-xs text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 outline-none bg-white focus:border-blue-600"
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Fully Paid</option>
              <option value="Partial Deposit">Partial Deposit</option>
              <option value="Pending Invoice">Pending Invoice</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm text-slate-700">
              <tbody className="divide-y divide-slate-200">
                {filteredClients.length > 0 ? (
                  filteredClients.map((client) => {
                    const contract = Number(client.contract_value || 0);
                    const paid = Number(client.amount_paid || 0);
                    const pending = contract - paid;
                    const percentage = contract > 0 ? Math.min(Math.round((paid / contract) * 100), 100) : 0;
                    const isPendingDue = pending > 0;

                    return (
                      <tr key={client.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-4 space-y-1">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <FaBuilding className="text-blue-600 text-xs" />
                            <span>{client.client_name}</span>
                          </div>

                          {client.project_name && (
                            <div className="text-xs text-blue-600 font-medium">
                              Project: {client.project_name}
                            </div>
                          )}

                          <div className="text-[11px] text-slate-500">
                            {client.contact_person ? `${client.contact_person} • ` : ""}
                            {client.email}
                          </div>

                          {client.address && (
                            <div className="text-[11px] text-slate-400 flex items-center gap-1">
                              <FaMapMarkerAlt className="text-slate-400" /> {client.address}
                            </div>
                          )}

                          <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 pt-0.5">
                            <FaCalendarAlt className="text-slate-400 text-[10px]" />
                            <span>Contract: {client.contract_start_date || "—"} to {client.contract_end_date || "—"}</span>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="text-xs font-semibold text-slate-500">Contract Cost</div>
                          <div className="font-bold text-slate-900">{contract.toLocaleString()} PKR</div>

                          <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                            Received: {paid.toLocaleString()} PKR
                          </div>

                          <div className="text-[11px] text-rose-700 font-semibold">
                            Pending: {pending.toLocaleString()} PKR
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-md border ${
                              client.payment_status === "Paid"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : client.payment_status === "Partial Deposit"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {client.payment_status}
                          </span>

                          {isPendingDue && (
                            <div className="mt-1">
                              <button
                                onClick={() => sendOverdueReminder(client)}
                                title="Send Overdue Payment Email Reminder"
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 hover:bg-rose-600 hover:text-white transition-colors"
                              >
                                <FaPaperPlane className="text-[9px]" /> Send Reminder
                              </button>
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-4 text-right space-y-1.5">
                          {/* Generate Invoice */}
                          <button
                            onClick={() => handleGenerateInvoice(client)}
                            title="Generate Invoice for Client"
                            className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200 hover:bg-blue-600 hover:text-white transition-colors"
                          >
                            <FaFileInvoiceDollar />
                            <span>Invoice</span>
                          </button>

                          {/* Record Payment */}
                          <button
                            onClick={() => handleRecordPayment(client.id, contract, paid)}
                            title="Record Payment Receipt"
                            className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-colors"
                          >
                            <FaMoneyCheckAlt />
                            <span>Collect</span>
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteClient(client.id, client.email)}
                            title="Delete Client Record"
                            className="w-full inline-flex items-center justify-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold text-rose-600 border border-rose-200 hover:bg-rose-50 transition-colors"
                          >
                            <FaTrash className="text-[10px]" /> Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-xs">
                      No client records found.
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
