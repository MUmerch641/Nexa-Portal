"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Modal from "@/components/Modal";
import {
  FaProjectDiagram,
  FaPlusCircle,
  FaCheckCircle,
  FaClock,
  FaBuilding,
  FaTasks,
  FaTrash,
  FaPaperPlane,
  FaUserTie,
  FaHistory,
  FaChartLine,
} from "react-icons/fa";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [role, setRole] = useState("admin");

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

  // Add Project Form State
  const [form, setForm] = useState({
    title: "",
    client_name: "Acme Tech Systems",
    assigned_developer: "Muhammad Rahim Bugti (Senior Developer)",
    description: "",
    progress: "45",
    status: "In Progress",
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  });

  // Daily Update Post State
  const [updateText, setUpdateText] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  useEffect(() => {
    setRole(localStorage.getItem("user_role") || "admin");
    const handleRoleChange = () => setRole(localStorage.getItem("user_role") || "admin");
    window.addEventListener("roleChanged", handleRoleChange);
    return () => window.removeEventListener("roleChanged", handleRoleChange);
  }, []);

  // Fetch Projects from Supabase or Fallback
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      // Persistent projects sync from local storage or defaults
      let storedProjects = [];
      try {
        const s = localStorage.getItem("persistent_projects");
        if (s) storedProjects = JSON.parse(s);
      } catch(e) {}

      if (storedProjects.length > 0) {
        setProjects(storedProjects);
        setLoading(false);
        return;
      }

      if (error || !data || data.length === 0) {
        // Default initial demo projects tagged with assigned developers
        const initialProjs = [
          {
            id: "p-101",
            title: "E-Commerce SaaS Web Portal & Mobile App",
            client_name: "Acme Tech Systems",
            assigned_developer: "Ali Hassan (student@gmail.com)",
            description: "Full-stack next.js e-commerce engine with payment gateway and mobile app",
            progress: 70,
            status: "In Progress",
            deadline: "2026-09-30",
            updates: [
              {
                id: "u-1",
                date: "2026-07-31 16:30",
                author: "MERN Dev Team",
                title: "Connected Payment Gateway & Order API",
                details: "Successfully integrated Stripe API endpoints and order confirmation webhooks.",
              },
              {
                id: "u-2",
                date: "2026-07-30 14:15",
                author: "UI/UX Designer",
                title: "Finalized Dashboard UI & Mobile Drawer Navigation",
                details: "Completed dark-mode corporate color palette and responsive mobile layouts.",
              },
            ],
          },
          {
            id: "p-102",
            title: "AI Customer Support Chatbot System",
            client_name: "Apex Global Solutions",
            assigned_developer: "Muhammad Rahim Bugti (rahim.dev@gmail.com)",
            description: "Custom AI assistant chatbot with vector database & customer ticket routing",
            progress: 90,
            status: "Testing & Review",
            deadline: "2026-08-15",
            updates: [
              {
                id: "u-3",
                date: "2026-07-31 11:00",
                author: "Python AI Engineer",
                title: "Trained Chatbot Model & Vector Embeddings",
                details: "Trained LLM model on customer knowledge base documents with 98% accuracy.",
              },
            ],
          },
        ];
        setProjects(initialProjs);
        try { localStorage.setItem("persistent_projects", JSON.stringify(initialProjs)); } catch(e) {}
      } else {
        setProjects(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // Add New Project (Admin Only)
  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!form.title || !form.client_name) {
      showAlert("Missing Fields", "Please enter Project Title and Client Name.", "warning");
      return;
    }

    setSubmitting(true);
    const newProjObj = {
      id: `p-${Date.now()}`,
      title: form.title,
      client_name: form.client_name,
      assigned_developer: form.assigned_developer,
      description: form.description,
      progress: Number(form.progress || 0),
      status: form.status,
      deadline: form.deadline,
      updates: [
        {
          id: `u-${Date.now()}`,
          date: new Date().toLocaleString(),
          author: "Project Manager",
          title: "Project Initialized & Assigned",
          details: `Project assigned by Admin to ${form.assigned_developer}. Contract finalized and development started.`,
        },
      ],
    };

    // Try Supabase insert
    const { error } = await supabase.from("projects").insert([
      {
        title: form.title,
        client_name: form.client_name,
        assigned_developer: form.assigned_developer,
        description: form.description,
        progress: Number(form.progress || 0),
        status: form.status,
        deadline: form.deadline,
      },
    ]);

    setSubmitting(false);

    const updatedProjs = [newProjObj, ...projects];
    setProjects(updatedProjs);
    try { localStorage.setItem("persistent_projects", JSON.stringify(updatedProjs)); } catch(e) {}

    showAlert("Project Assigned Successfully!", `Project '${form.title}' assigned to ${form.assigned_developer}!`, "success");

    setForm({
      title: "",
      client_name: "Acme Tech Systems",
      assigned_developer: assignableUsers[0]?.fullName || "Muhammad Rahim Bugti",
      description: "",
      progress: "45",
      status: "In Progress",
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    });
  };

  // Post Daily Work Progress Update (Employee / Admin Action)
  const postDailyProgress = (projectId) => {
    if (!updateText) {
      showAlert("Empty Progress Update", "Please type daily work update details.", "warning");
      return;
    }

    const updatedProjects = projects.map((p) => {
      if (p.id === projectId) {
        const newUpdate = {
          id: `u-${Date.now()}`,
          date: new Date().toLocaleString(),
          author: role === "admin" ? "Project Manager" : `Assigned Developer (${currentUserEmail})`,
          title: "Daily Work Progress Update",
          details: updateText,
        };
        const currentUpdates = p.updates || [];
        return {
          ...p,
          updates: [newUpdate, ...currentUpdates],
        };
      }
      return p;
    });

    setProjects(updatedProjects);
    try { localStorage.setItem("persistent_projects", JSON.stringify(updatedProjects)); } catch(e) {}
    setUpdateText("");
    setSelectedProjectId(null);
    showAlert("Daily Progress Posted!", "Work progress report has been submitted to Admin & Client!", "success");
  };

  // Update Project Progress Percentage
  const updateProgressPercentage = (projectId, newProgress) => {
    const updatedProjects = projects.map((p) => {
      if (p.id === projectId) {
        return { ...p, progress: Number(newProgress) };
      }
      return p;
    });
    setProjects(updatedProjects);
    try { localStorage.setItem("persistent_projects", JSON.stringify(updatedProjects)); } catch(e) {}
  };

  // Dynamic Users List for Admin Assignment Dropdown (Employees, Students & Interns)
  const [assignableUsers, setAssignableUsers] = useState([]);

  useEffect(() => {
    try {
      const reg = localStorage.getItem("registered_system_users");
      const usersList = reg ? JSON.parse(reg) : [];
      const defaultUsers = [
        { fullName: "Muhammad Rahim Bugti", email: "rahim.dev@gmail.com", role: "employee" },
        { fullName: "Ali Hassan", email: "student@gmail.com", role: "employee" },
        { fullName: "Sara Ahmed", email: "sara.course@gmail.com", role: "employee" },
        { fullName: "Bilal Remote Intern", email: "bilal.remote@gmail.com", role: "intern" }
      ];

      const combinedMap = new Map();
      [...defaultUsers, ...usersList].forEach(u => combinedMap.set(u.email.toLowerCase(), u));
      setAssignableUsers(Array.from(combinedMap.values()));
    } catch(e) {}
  }, []);

  // Current user email/name for strict individual isolation
  const currentUserEmail = typeof window !== "undefined" ? localStorage.getItem("current_user_email") || "" : "";

  // Strict Assignment Filtering with Guarantee:
  // - Admin: Assigns & Views ALL projects and progress reports
  // - Client: Views Acme Tech Systems project
  // - Employee / Student / Intern: Views project assigned to them, or active project workspace so they can ALWAYS post daily progress!
  const displayedProjects = (() => {
    if (role === "admin") return projects;
    if (role === "client") return projects.filter((p) => p.client_name?.toLowerCase().includes("acme"));

    const matched = projects.filter((p) => {
      if (!currentUserEmail) return true;
      const assignedStr = (p.assigned_developer || p.developer || "").toLowerCase();
      const userKey = currentUserEmail.split("@")[0].toLowerCase();
      return assignedStr.includes(userKey) || assignedStr.includes(currentUserEmail.toLowerCase());
    });

    // If specific match exists, return it; otherwise show default active project so user can ALWAYS log daily work progress!
    if (matched.length > 0) return matched;
    return projects.length > 0 ? [projects[0]] : [];
  })();

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

      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FaProjectDiagram className="text-blue-600" />
            <span>
              {role === "client" ? "My Assigned Project Daily Progress" : "Projects & Daily Progress Updates"}
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {role === "client"
              ? "Live tracking of daily work progress and completion milestones for your project"
              : "Employees post daily progress updates; Clients view live completion timeline"}
          </p>
        </div>

        {/* Role Badge */}
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 w-fit">
          <FaUserTie />
          <span>Viewing as: {role === "client" ? "Client Portal View" : role === "employee" ? "Employee Portal View" : "Admin Panel View"}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Add Project Form (Admin Only) */}
        {role === "admin" && (
          <div className="lg:col-span-1 rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 h-fit">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <FaPlusCircle className="text-blue-600" />
              <span>Create New Project</span>
            </h2>

            <form onSubmit={handleAddProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Mobile E-Commerce App"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Assign Developer / Student / Intern *
                </label>
                <select
                  name="assigned_developer"
                  value={form.assigned_developer}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 bg-white"
                >
                  <option value="">-- Select Member to Assign Project --</option>
                  {assignableUsers.map((u) => (
                    <option key={u.email} value={`${u.fullName} (${u.email})`}>
                      {u.fullName} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Project Description
                </label>
                <textarea
                  rows={2}
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Scope of work and deliverables..."
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Initial Progress %
                  </label>
                  <input
                    type="number"
                    name="progress"
                    value={form.progress}
                    onChange={handleChange}
                    placeholder="e.g. 50"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Testing & Review">Testing & Review</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Create Project
              </button>
            </form>
          </div>
        )}

        {/* Projects List & Daily Progress Timeline Feed */}
        <div className={role === "admin" ? "lg:col-span-2 space-y-5" : "lg:col-span-3 space-y-5"}>
          {displayedProjects.length > 0 ? (
            displayedProjects.map((project) => {
              const updatesList = project.updates || [];

              return (
                <div key={project.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
                  {/* Card Top */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900">{project.title}</h2>
                        <span
                          className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md border ${
                            project.status === "Completed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : project.status === "Testing & Review"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {project.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          <FaBuilding className="text-blue-600" /> Client: {project.client_name}
                        </span>
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          👨‍💻 Assigned Dev: {project.assigned_developer || project.developer || "Senior Developer"}
                        </span>
                        {project.deadline && (
                          <span className="flex items-center gap-1">
                            <FaClock className="text-slate-400" /> Deadline: {project.deadline}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Percentage Display */}
                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completion</div>
                      <div className="text-2xl font-extrabold text-blue-700">{project.progress || 0}%</div>
                    </div>
                  </div>

                  {/* Progress Bar & Slider for Admin/Employee */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span>Project Progress Bar</span>
                      <span>{project.progress}% Complete</span>
                    </div>

                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${project.progress || 0}%` }}
                      />
                    </div>

                    {role !== "client" && (
                      <div className="pt-2 flex items-center gap-3">
                        <span className="text-xs text-slate-500 font-semibold">Update Progress %:</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={project.progress || 0}
                          onChange={(e) => updateProgressPercentage(project.id, e.target.value)}
                          className="w-48 accent-blue-600 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>

                  {/* Employee Post Progress Update Control */}
                  {role !== "client" && (
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-3">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <FaPaperPlane className="text-blue-600" />
                        <span>Post Employee Daily Work Progress Update</span>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={selectedProjectId === project.id ? updateText : ""}
                          onChange={(e) => {
                            setSelectedProjectId(project.id);
                            setUpdateText(e.target.value);
                          }}
                          placeholder="Type daily work completed (e.g. Completed Auth API & Mobile Navigation UI)..."
                          className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 bg-white"
                        />
                        <button
                          onClick={() => postDailyProgress(project.id)}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-xs"
                        >
                          Post Update
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Daily Work Progress Updates Timeline Feed */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <FaHistory className="text-blue-600" />
                      <span>Daily Work Progress History Feed (Visible to Client)</span>
                    </h3>

                    <div className="space-y-2.5">
                      {updatesList.length > 0 ? (
                        updatesList.map((upd) => (
                          <div key={upd.id} className="rounded-lg bg-slate-50 p-3.5 border border-slate-200 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-900">{upd.title}</span>
                              <span className="text-[11px] font-mono text-slate-500">{upd.date}</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">{upd.details}</p>
                            <div className="text-[10px] text-blue-600 font-semibold pt-1">
                              Posted by: {upd.author}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-400 italic py-2">
                          No daily updates posted yet for this project.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400 text-xs">
              No projects found for your portal account.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
