"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { FaArrowLeft, FaLock } from "react-icons/fa";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (active && event === "PASSWORD_RECOVERY" && session) setRecoveryReady(true);
    });

    const checkRecoverySession = async () => {
      const { data: { session } = {} } = await supabase.auth.getSession();
      const hasRecoveryCode = new URLSearchParams(window.location.search).has("code");
      const hasRecoveryHash = new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery";
      if (active && session && (hasRecoveryCode || hasRecoveryHash)) setRecoveryReady(true);
    };
    checkRecoverySession().catch(() => {});

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setError("Use at least 8 characters with uppercase, lowercase, a number, and a symbol.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      await supabase.auth.signOut();
      setMessage("Your password has been updated. Sign in with your new password.");
      setTimeout(() => router.replace("/login"), 1600);
    } catch (updateError) {
      setError(updateError?.message || "Could not update your password. Request a new reset link.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <section className="w-full max-w-md rounded-2xl border border-blue-100 bg-white p-8 shadow-xl space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <FaLock />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Choose a new password</h1>
          <p className="mt-2 text-sm text-slate-500">Set a strong password for your NEXA account.</p>
        </div>

        {message ? (
          <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</div>
        ) : recoveryReady ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-xs font-semibold uppercase text-slate-600" htmlFor="new-password">New password</label>
            <input id="new-password" type="password" autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600" />
            <label className="block text-xs font-semibold uppercase text-slate-600" htmlFor="confirm-password">Confirm password</label>
            <input id="confirm-password" type="password" autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600" />
            {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
            <button type="submit" disabled={saving} className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Updating…" : "Update password"}
            </button>
          </form>
        ) : (
          <div className="space-y-3 text-center">
            <p role="status" className="text-sm text-slate-600">Open the password reset link from your email. If it expired, request a new one.</p>
            <Link href="/forgot-password" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline">Request another link</Link>
          </div>
        )}

        <div className="border-t border-slate-100 pt-4 text-center">
          <Link href="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:underline"><FaArrowLeft /> Back to sign in</Link>
        </div>
      </section>
    </main>
  );
}
