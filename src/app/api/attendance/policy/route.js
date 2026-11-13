import { NextResponse } from "next/server";
import { getRequestUser, isPortalAdmin } from "@/lib/serverAuth";

const DEFAULT_POLICY = {
  id: "policy_1",
  shift_start: "10:00 AM",
  shift_end: "6:00 PM",
  grace_period_minutes: 14,
  late_warning_minutes: 29,
  salary_deduction_after: 30,
  policy_name: "Standard Policy",
  description: "Standard attendance policy for employees and students",
};

async function savePolicy(client, policy, userId) {
  const record = { ...DEFAULT_POLICY, ...policy, id: "policy_1", updated_at: new Date().toISOString() };
  const { data, error } = await client.from("app_records").upsert({
    module: "attendance_policy", record_key: "policy_1", payload: record, created_by: userId,
  }, { onConflict: "module,record_key" }).select("payload").single();
  return { data: data?.payload || null, error };
}

export async function GET(request) {
  const context = await getRequestUser(request);
  if (context.error) return NextResponse.json({ error: context.error }, { status: context.status });
  const { data, error } = await context.client.from("app_records")
    .select("payload")
    .eq("module", "attendance_policy")
    .limit(1);
  if (error) return NextResponse.json({ error: error.message }, { status: 403 });
  return NextResponse.json({ success: true, policy: data?.[0]?.payload || DEFAULT_POLICY, defaultPolicy: DEFAULT_POLICY }, {
    headers: { "Cache-Control": "no-store, private" },
  });
}

export async function POST(request) {
  const context = await getRequestUser(request);
  if (context.error) return NextResponse.json({ error: context.error }, { status: context.status });
  if (!isPortalAdmin(context.role)) return NextResponse.json({ error: "Only administrators can change the attendance policy." }, { status: 403 });
  try {
    const { action, policy = {} } = await request.json();
    if (!['update', 'reset'].includes(action)) return NextResponse.json({ error: "Unsupported policy action." }, { status: 400 });
    const selected = action === "reset" ? DEFAULT_POLICY : {
      shift_start: String(policy.shift_start || DEFAULT_POLICY.shift_start),
      shift_end: String(policy.shift_end || DEFAULT_POLICY.shift_end),
      grace_period_minutes: Math.max(0, Math.min(180, Number.parseInt(policy.grace_period_minutes, 10) || DEFAULT_POLICY.grace_period_minutes)),
      late_warning_minutes: Math.max(0, Math.min(180, Number.parseInt(policy.late_warning_minutes, 10) || DEFAULT_POLICY.late_warning_minutes)),
      salary_deduction_after: Math.max(0, Math.min(180, Number.parseInt(policy.salary_deduction_after, 10) || DEFAULT_POLICY.salary_deduction_after)),
      policy_name: String(policy.policy_name || DEFAULT_POLICY.policy_name).slice(0, 120),
      description: String(policy.description || DEFAULT_POLICY.description).slice(0, 1000),
    };
    const { data, error } = await savePolicy(context.client, selected, context.user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ success: true, policy: data || { ...DEFAULT_POLICY, ...selected } });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Could not save attendance policy." }, { status: 400 });
  }
}
