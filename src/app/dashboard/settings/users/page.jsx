"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { showToast } from "@/components/Toast";
import { FaArrowLeft, FaUsers, FaSyncAlt, FaSave } from "react-icons/fa";

const ROLES = ["pending", "admin", "manager", "hr", "employee", "intern", "student", "client"];

export default function UserAccessPage() {
  const [users, setUsers] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [canGrantAdmin, setCanGrantAdmin] = useState(false);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: { user } = {}, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Sign in with an approved administrator account.");
      const { data: actor, error: actorError } = await supabase.from("user_profiles")
        .select("role, status")
        .eq("id", user.id)
        .maybeSingle();
      if (actorError || !["admin", "manager", "hr"].includes(actor?.role) || actor?.status !== "active") {
        setAuthorized(false);
        setCanGrantAdmin(false);
        throw new Error("Only approved administrators can manage account access.");
      }
      setAuthorized(true);
      setCanGrantAdmin(actor.role === "admin");
      const { data, error: queryError } = await supabase.from("user_profiles")
        .select("id, email, full_name, role, status, created_at")
        .order("created_at", { ascending: false });
      if (queryError) throw queryError;
      const list = data || [];
      setUsers(list);
      setDrafts(Object.fromEntries(list.map((profile) => [profile.id, { role: profile.role, status: profile.status }])));
    } catch (loadError) {
      setError(loadError?.message || "Could not load account profiles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const saveUser = async (profile) => {
    const draft = drafts[profile.id];
    if (!draft) return;
    setSaving(profile.id);
    const { data, error: updateError } = await supabase.from("user_profiles")
      .update({ role: draft.role, status: draft.status, updated_at: new Date().toISOString() })
      .eq("id", profile.id)
      .select("id, email, full_name, role, status, created_at")
      .maybeSingle();
    setSaving("");
    if (updateError || !data) {
      showToast("Access update failed", updateError?.message || "The account was not updated.", "error");
      return;
    }
    setUsers((current) => current.map((item) => item.id === data.id ? data : item));
    showToast("Account access updated", `${data.email} now has ${data.role} access (${data.status}).`, "success");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 text-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <Link href="/dashboard/settings" className="mb-2 inline-flex items-center gap-2 text-xs font-semibold text-blue-700 hover:underline">
            <FaArrowLeft /> Back to settings
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><FaUsers className="text-blue-600" /> Team account access</h1>
          <p className="mt-1 text-sm text-slate-600">New sign-ups stay pending until you assign their role and activate them.</p>
        </div>
        <button onClick={loadUsers} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50">
          <FaSyncAlt /> Refresh
        </button>
      </div>

      {!authorized && error && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{error}</div>}
      {authorized && error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? <div className="p-8 text-center text-sm text-slate-500">Loading user profiles…</div> : !authorized ? null : users.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No one has signed up yet. Share the portal signup link with your team.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-5 py-3">Team member</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Account status</th><th className="px-5 py-3">Joined</th><th className="px-5 py-3" /></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((profile) => {
                  const draft = drafts[profile.id] || { role: profile.role, status: profile.status };
                  const changed = draft.role !== profile.role || draft.status !== profile.status;
                  const canManageProfile = canGrantAdmin || profile.role !== "admin";
                  const availableRoles = canGrantAdmin ? ROLES : ROLES.filter((role) => role !== "admin");
                  const roleOptions = availableRoles.includes(profile.role) ? availableRoles : [profile.role, ...availableRoles];
                  return (
                    <tr key={profile.id}>
                      <td className="px-5 py-4"><div className="font-semibold">{profile.full_name || "New team member"}</div><div className="text-xs text-slate-500">{profile.email}</div></td>
                      <td className="px-5 py-4"><select value={draft.role} disabled={!canManageProfile} onChange={(event) => setDrafts((all) => ({ ...all, [profile.id]: { ...draft, role: event.target.value } }))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500">
                        {roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
                      </select></td>
                      <td className="px-5 py-4"><select value={draft.status} disabled={!canManageProfile} onChange={(event) => setDrafts((all) => ({ ...all, [profile.id]: { ...draft, status: event.target.value } }))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500">
                        <option value="pending">Pending</option><option value="active">Active</option><option value="inactive">Inactive</option>
                      </select></td>
                      <td className="px-5 py-4 text-xs text-slate-500">{profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}</td>
                      <td className="px-5 py-4 text-right"><button onClick={() => saveUser(profile)} disabled={!changed || !canManageProfile || saving === profile.id} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"><FaSave /> {saving === profile.id ? "Saving…" : "Save"}</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
