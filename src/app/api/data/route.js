import { NextResponse } from "next/server";
import { getRequestUser, isPortalAdmin } from "@/lib/serverAuth";

const TABLES = new Set([
  "activity_logs", "announcements", "app_users", "attendance", "attendance_policy",
  "bug_reports", "certificates", "clients", "client_projects", "comments", "complaints",
  "daily_tasks", "employee_activity_statuses", "employees", "expenses", "incomes", "interns",
  "invoices", "leaves", "mcq_attempts", "mcq_exams", "meetings", "milestones",
  "monitoring_sessions", "payrolls", "performances", "projects", "productivity_reports",
  "registered_accounts", "remote_work_sessions", "salary", "screenshot_logs", "settings",
  "student_attendance", "student_fee_cycles", "students", "tasks", "users", "utility_bills",
  "work_timelines",
]);
const OPERATORS = new Set(["eq", "neq", "ilike", "like", "gte", "lte", "gt", "lt"]);
const SECRET_KEYS = new Set(["password", "password_hash", "assigned_password", "confirm_password", "current_password", "new_password"]);

function scrubSecrets(value) {
  if (Array.isArray(value)) return value.map(scrubSecrets);
  if (!value || typeof value !== "object") return value;
  const safe = {};
  for (const [key, child] of Object.entries(value)) {
    if (SECRET_KEYS.has(key.toLowerCase())) continue;
    if (["user_id", "emergency_contact"].includes(key) && typeof child === "string" && child.startsWith("auth:")) continue;
    safe[key] = scrubSecrets(child);
  }
  return safe;
}

function normalizeRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Each record must be a JSON object.");
  const record = scrubSecrets(value);
  const email = String(record.email || record.user_email || record.student_email || "").trim().toLowerCase();
  const recordId = record.id != null && String(record.id).trim()
    ? String(record.id)
    : email ? `email:${email}` : crypto.randomUUID();
  record.id = recordId;
  return { record, recordKey: recordId };
}

function fieldValue(record, field) {
  return field.split(".").reduce((value, key) => value == null ? undefined : value[key], record);
}

function matchesFilter(record, filter) {
  if (filter.operator === "or") {
    const alternatives = String(filter.value || "").split(",").map((part) => {
      const [field, operator, ...rest] = part.split(".");
      if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(field) || !OPERATORS.has(operator)) return false;
      return matchesFilter(record, { column: field, operator, value: rest.join(".") });
    });
    return alternatives.some(Boolean);
  }

  const actual = fieldValue(record, filter.column);
  const expected = filter.value;
  const left = actual == null ? "" : String(actual);
  const right = expected == null ? "" : String(expected);
  switch (filter.operator) {
    case "eq": return left === right;
    case "neq": return left !== right;
    case "ilike":
    case "like": {
      const escaped = right.replace(/[.+^${}()|[\]\\]/g, "\\$&").replaceAll("%", ".*").replaceAll("_", ".");
      return new RegExp(`^${escaped}$`, filter.operator === "ilike" ? "i" : "").test(left);
    }
    case "gte": return Number.isFinite(Number(left)) && Number.isFinite(Number(right)) ? Number(left) >= Number(right) : left >= right;
    case "lte": return Number.isFinite(Number(left)) && Number.isFinite(Number(right)) ? Number(left) <= Number(right) : left <= right;
    case "gt": return Number.isFinite(Number(left)) && Number.isFinite(Number(right)) ? Number(left) > Number(right) : left > right;
    case "lt": return Number.isFinite(Number(left)) && Number.isFinite(Number(right)) ? Number(left) < Number(right) : left < right;
    default: return false;
  }
}

function project(record, columns) {
  if (!columns || columns.trim() === "*") return record;
  const names = columns.split(",").map((name) => name.trim()).filter((name) => /^[A-Za-z][A-Za-z0-9_]*$/.test(name));
  return Object.fromEntries(names.filter((name) => name in record).map((name) => [name, record[name]]));
}

function finish(data, body) {
  const rows = Array.isArray(data) ? data : [];
  if (body.single) {
    return rows.length === 1
      ? { data: rows[0], count: 1 }
      : { data: null, error: "Expected exactly one record, but found none or more than one." };
  }
  if (body.maybeSingle) return { data: rows[0] || null, count: rows.length };
  return { data: rows, count: rows.length };
}

export async function POST(request) {
  const context = await getRequestUser(request);
  if (context.error) return NextResponse.json({ error: context.error }, { status: context.status });

  try {
    const body = await request.json();
    const { table, operation = "select" } = body;
    if (!TABLES.has(table)) return NextResponse.json({ error: "Unknown data module." }, { status: 400 });
    if (!["select", "insert", "upsert", "update", "delete"].includes(operation)) {
      return NextResponse.json({ error: "Unsupported data operation." }, { status: 400 });
    }
    if (table === "attendance" && !isPortalAdmin(context.role)) {
      return NextResponse.json({ error: "Use the live attendance clock to check in or out." }, { status: 403 });
    }

    const { data: stored, error: readError } = await context.client
      .from("app_records")
      .select("id, module, record_key, payload")
      .eq("module", table)
      .limit(2000);
    if (readError) return NextResponse.json({ error: readError.message }, { status: 400 });

    let rows = (stored || []).filter((row) => (body.filters || []).every((filter) => matchesFilter(row.payload || {}, filter)));
    if (body.orderBy?.column) {
      const { column, ascending } = body.orderBy;
      rows.sort((a, b) => {
        const av = fieldValue(a.payload || {}, column);
        const bv = fieldValue(b.payload || {}, column);
        const result = av == null ? (bv == null ? 0 : -1) : bv == null ? 1 : String(av).localeCompare(String(bv), undefined, { numeric: true });
        return ascending ? result : -result;
      });
    }
    if (body.limit != null) rows = rows.slice(0, Math.max(0, Math.min(Number(body.limit) || 0, 2000)));

    if (operation === "select") {
      return NextResponse.json(finish(rows.map((row) => project(row.payload || {}, body.columns)), body));
    }

    if (operation === "insert" || operation === "upsert") {
      const values = Array.isArray(body.values) ? body.values : [body.values];
      if (!values.length || values.length > 500) return NextResponse.json({ error: "Send between 1 and 500 records per save." }, { status: 400 });
      const normalized = values.map(normalizeRecord);
      const dbRows = normalized.map(({ record, recordKey }) => ({
        module: table,
        record_key: recordKey,
        payload: record,
        created_by: context.user.id,
      }));
      const query = context.client.from("app_records");
      const result = operation === "upsert"
        ? await query.upsert(dbRows, { onConflict: "module,record_key" }).select("payload")
        : await query.insert(dbRows).select("payload");
      if (result.error) return NextResponse.json({ error: result.error.message }, { status: 403 });
      return NextResponse.json(finish((result.data || []).map((row) => project(row.payload, body.columns)), body));
    }

    if (!(body.filters || []).length) return NextResponse.json({ error: "Updates and deletes require at least one filter." }, { status: 400 });
    if (!rows.length) return NextResponse.json(finish([], body));

    if (operation === "update") {
      const patch = scrubSecrets(body.values);
      if (!patch || typeof patch !== "object" || Array.isArray(patch)) return NextResponse.json({ error: "Update data must be a JSON object." }, { status: 400 });
      const updatedRows = [];
      for (const row of rows) {
        const payload = { ...(row.payload || {}), ...patch };
        const { data, error } = await context.client.from("app_records")
          .update({ payload, updated_at: new Date().toISOString() })
          .eq("id", row.id)
          .select("payload")
          .maybeSingle();
        if (error) return NextResponse.json({ error: error.message }, { status: 403 });
        if (data) updatedRows.push(project(data.payload, body.columns));
      }
      return NextResponse.json(finish(updatedRows, body));
    }

    const { error: deleteError } = await context.client.from("app_records")
      .delete()
      .in("id", rows.map((row) => row.id));
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 403 });
    return NextResponse.json(finish(rows.map((row) => project(row.payload || {}, body.columns)), body));
  } catch (error) {
    return NextResponse.json({ error: error?.message || "The data request could not be completed." }, { status: 400 });
  }
}
