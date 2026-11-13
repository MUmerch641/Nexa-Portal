import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/serverAuth";
import { cleanPayloadForDb } from "@/lib/dbPersistence";

const TABLES = new Set([
  "activity_logs", "announcements", "app_users", "attendance", "attendance_policy", "bug_reports",
  "certificates", "clients", "client_projects", "comments", "complaints", "daily_tasks",
  "employee_activity_statuses", "employees", "expenses", "incomes", "interns", "invoices", "leaves",
  "mcq_attempts", "mcq_exams", "meetings", "milestones", "monitoring_sessions", "payrolls",
  "performances", "projects", "productivity_reports", "registered_accounts", "remote_work_sessions",
  "salary", "screenshot_logs", "settings", "student_attendance", "student_fee_cycles", "students",
  "tasks", "users", "utility_bills", "work_timelines",
]);

export async function GET(request) {
  const context = await getRequestUser(request);
  if (context.error) return NextResponse.json({ error: context.error }, { status: context.status });
  const table = new URL(request.url).searchParams.get("table");
  if (!TABLES.has(table)) return NextResponse.json({ error: "Unknown data module." }, { status: 400 });

  const { data, error } = await context.client.from("app_records")
    .select("payload")
    .eq("module", table)
    .limit(2000);
  if (error) return NextResponse.json({ error: error.message }, { status: 403 });
  return NextResponse.json({ success: true, data: (data || []).map((row) => row.payload) }, {
    headers: { "Cache-Control": "no-store, private" },
  });
}

export async function POST(request) {
  const context = await getRequestUser(request);
  if (context.error) return NextResponse.json({ error: context.error }, { status: context.status });

  try {
    const { table, record, action = "save" } = await request.json();
    if (!TABLES.has(table)) return NextResponse.json({ error: "Unknown data module." }, { status: 400 });
    if (["clear_all", "delete_all"].includes(action)) {
      return NextResponse.json({ error: "Bulk clearing is disabled. Delete specific records instead." }, { status: 403 });
    }

    if (action === "delete") {
      const identifiers = record || {};
      const { data: rows, error: readError } = await context.client.from("app_records")
        .select("id, payload")
        .eq("module", table)
        .limit(2000);
      if (readError) return NextResponse.json({ error: readError.message }, { status: 403 });
      const email = String(identifiers.email || "").trim().toLowerCase();
      const title = identifiers.task_title || identifiers.title || "";
      const ids = (rows || []).filter(({ payload = {} }) =>
        (identifiers.id && String(payload.id) === String(identifiers.id)) ||
        (email && String(payload.email || "").toLowerCase() === email) ||
        (title && String(payload.task_title || payload.title || "") === String(title))
      ).map(({ id }) => id);
      if (ids.length) {
        const { error } = await context.client.from("app_records").delete().in("id", ids);
        if (error) return NextResponse.json({ error: error.message }, { status: 403 });
      }
      return NextResponse.json({ success: true, deleted: ids.length > 0, count: ids.length });
    }

    if (action !== "save" || !record || typeof record !== "object" || Array.isArray(record)) {
      return NextResponse.json({ error: "Provide a record and a supported action." }, { status: 400 });
    }
    const safe = cleanPayloadForDb(record);
    const email = String(safe.email || safe.user_email || safe.student_email || "").trim().toLowerCase();
    safe.id = safe.id != null && String(safe.id).trim() ? String(safe.id) : email ? `email:${email}` : crypto.randomUUID();
    const { data, error } = await context.client.from("app_records").upsert({
      module: table,
      record_key: safe.id,
      payload: safe,
      created_by: context.user.id,
    }, { onConflict: "module,record_key" }).select("payload").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ success: true, data: [data.payload] });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "The request could not be completed." }, { status: 400 });
  }
}
