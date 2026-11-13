"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { FaEnvelope, FaArrowLeft, FaLock } from "react-icons/fa";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    setSending(true);
    setError("");
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (resetError) {
      setError(resetError?.message || "Could not send reset instructions. Try again later.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <section className="w-full max-w-md rounded-2xl border border-blue-100 bg-white p-8 shadow-xl space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <FaLock />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Reset your password</h1>
          <p className="mt-2 text-sm text-slate-500">We’ll send a password reset link to your account email.</p>
        </div>

        {sent ? (
          <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            If an account uses that email, reset instructions have been sent. Check your inbox and spam folder.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-xs font-semibold uppercase text-slate-600" htmlFor="reset-email">Email address</label>
            <div className="relative">
              <FaEnvelope className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-blue-600"
                placeholder="name@company.com"
              />
            </div>
            {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
            <button type="submit" disabled={sending} className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">
              {sending ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <div className="border-t border-slate-100 pt-4 text-center">
          <Link href="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:underline">
            <FaArrowLeft /> Back to sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
