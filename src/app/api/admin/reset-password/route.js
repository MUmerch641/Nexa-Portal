import { NextResponse } from "next/server";
import { getRequestUser, isPortalAdmin } from "@/lib/serverAuth";

export async function POST(request) {
  const context = await getRequestUser(request);
  if (context.error) return NextResponse.json({ error: context.error }, { status: context.status });
  if (!isPortalAdmin(context.role)) {
    return NextResponse.json({ error: "Only administrators can request a password reset for another account." }, { status: 403 });
  }

  try {
    const { targetEmail } = await request.json();
    const email = String(targetEmail || "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid account email address." }, { status: 400 });
    }
    const { error } = await context.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(request.url).origin}/reset-password`,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, message: "Password reset instructions were sent if the account exists." });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Could not request a password reset." }, { status: 400 });
  }
}
