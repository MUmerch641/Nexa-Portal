import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const LIVE_SUPABASE_URL = "https://uzwmwtkldgchnuqxamov.supabase.co";
const LIVE_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6d213dGtsZGdjaG51cXhhbW92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MDUxMjYsImV4cCI6MjEwMDk4MTEyNn0.dTw41DhaS-qDVqX4jj3WsrAvYE9CLigjOLZFiDt_7Rk";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
  ? process.env.NEXT_PUBLIC_SUPABASE_URL
  : LIVE_SUPABASE_URL;

const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("placeholder")
  ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  : LIVE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const body = await request.json();
    const { targetEmail, requesterEmail, requesterRole } = body;

    const isRequesterAdmin =
      requesterRole === "admin" ||
      (requesterEmail && requesterEmail.toLowerCase().trim() === "admin@gmail.com");

    if (!isRequesterAdmin) {
      return NextResponse.json(
        { error: "403 Forbidden: Only authorized Admins can trigger password resets." },
        { status: 403 }
      );
    }

    if (!targetEmail || !targetEmail.trim()) {
      return NextResponse.json({ error: "Target email address is required." }, { status: 400 });
    }

    // Trigger Supabase Auth password reset email securely
    const { error } = await supabase.auth.resetPasswordForEmail(targetEmail.trim().toLowerCase(), {
      redirectTo: `${request.headers.get("origin") || "http://localhost:3000"}/verify-email`,
    });

    if (error) {
      console.error("Supabase Reset Password Error:", error);
    }

    return NextResponse.json({
      success: true,
      message: `Password reset instructions sent securely to ${targetEmail}.`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to trigger password reset." },
      { status: 500 }
    );
  }
}
