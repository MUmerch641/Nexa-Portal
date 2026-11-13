import { supabase } from "@/lib/supabase";

export const TABLE_STORAGE_KEYS = {
  employees: "persistent_employees",
  projects: "software_house_projects",
  daily_tasks: "software_house_daily_tasks",
  clients: "software_house_clients",
  invoices: "software_house_invoices",
  incomes: "persistent_incomes",
  expenses: "persistent_expenses",
  payrolls: "software_house_payrolls",
  salary: "software_house_salary_history",
  students: "persistent_courses",
  leaves: "software_house_leaves",
  meetings: "software_house_meetings_list",
  complaints: "software_house_complaints_list",
  announcements: "software_house_announcements_list",
  attendance: "software_house_master_attendance_logs",
  performances: "software_house_performances",
  interns: "persistent_interns",
  utility_bills: "software_house_utility_bills",
  client_projects: "software_house_client_projects",
  monitoring_sessions: "monitoring_sessions",
  remote_work_sessions: "remote_work_sessions",
  activity_logs: "remote_activity_logs",
  screenshot_logs: "remote_screenshot_logs",
  app_usage_logs: "remote_app_usage_logs",
  work_timelines: "remote_work_timelines",
  productivity_reports: "remote_productivity_reports",
  student_fee_cycles: "persistent_student_fee_cycles",
  registered_accounts: "registered_system_users",
  student_attendance: "student_attendance_records",
};

const SECRET_KEYS = new Set(["password", "password_hash", "assigned_password", "confirm_password", "current_password", "new_password"]);

export function cleanPayloadForDb(value) {
  if (Array.isArray(value)) return value.map(cleanPayloadForDb);
  if (!value || typeof value !== "object") return value;
  const safe = {};
  for (const [key, child] of Object.entries(value)) {
    if (SECRET_KEYS.has(key.toLowerCase())) continue;
    if (["user_id", "emergency_contact"].includes(key) && typeof child === "string" && child.startsWith("auth:")) continue;
    if (typeof child === "function" || typeof child === "symbol") continue;
    safe[key] = cleanPayloadForDb(child);
  }
  return safe;
}

export async function dbFetch(table, defaultData = [], _forceFresh = false) {
  const { data, error } = await supabase.from(table).select("*");
  if (error) throw new Error(error.message || `Unable to load ${table}.`);
  return Array.isArray(data) ? data : defaultData;
}

export async function dbSaveList(table, list = []) {
  const byKey = new Map();
  if (Array.isArray(list)) {
    for (const value of list) {
      const record = cleanPayloadForDb(value);
      const key = record?.id != null ? String(record.id) : String(record?.email || record?.user_email || "");
      byKey.set(key || `new:${byKey.size}`, record);
    }
  }
  const records = [...byKey.values()];
  if (!records.length) return records;
  const { data, error } = await supabase.from(table).upsert(records).select("*");
  if (error) throw new Error(error.message || `Unable to save ${table}.`);
  return data || records;
}

export async function dbSaveRecord(table, record) {
  if (!record) return null;
  const { data, error } = await supabase.from(table).upsert(cleanPayloadForDb(record)).select("*").maybeSingle();
  if (error) throw new Error(error.message || `Unable to save ${table} record.`);
  return data || record;
}

export async function dbDeleteRecord(table, id, emailField = "") {
  if (!id && !emailField) return { success: false, error: "A record ID or email is required." };
  let query = supabase.from(table).delete();
  if (id) query = query.eq("id", String(id));
  else query = query.eq("email", String(emailField).trim().toLowerCase());
  const { error } = await query;
  return error ? { success: false, error: error.message } : { success: true };
}
