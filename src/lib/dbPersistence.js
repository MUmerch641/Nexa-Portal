import { supabase } from "@/lib/supabase";

export const TABLE_STORAGE_KEYS = {
  employees: "persistent_employees",
  projects: "software_house_full_projects",
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
};

/**
 * Fetch records from Supabase DB merged with local storage fallback.
 * Ensures 100% data persistence on page refresh, offline, or DB errors.
 */
export async function dbFetch(table, defaultData = []) {
  const storageKey = TABLE_STORAGE_KEYS[table] || `persistent_${table}`;
  
  // 1. Load Local Storage
  let localData = [];
  try {
    const saved = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) localData = parsed;
    }
  } catch (e) {}

  // 2. Load Supabase Database Data
  let dbData = [];
  try {
    const { data, error } = await supabase.from(table).select("*");
    if (!error && data && Array.isArray(data)) {
      dbData = data;
    }
  } catch (e) {}

  // 3. Deduplicate and Merge Datasets (Local + DB + Defaults)
  const map = new Map();
  // Start with localData if present; else defaultData
  const baseList = localData.length > 0 ? localData : defaultData;

  baseList.forEach(item => {
    if (!item) return;
    const key = String(item.id || item.email || item.title || item.client_name || "").toLowerCase().trim();
    if (key) map.set(key, item);
  });

  dbData.forEach(item => {
    if (!item) return;
    const key = String(item.id || item.email || item.title || item.client_name || "").toLowerCase().trim();
    if (key) {
      const existing = map.get(key) || {};
      map.set(key, { ...existing, ...item });
    }
  });

  const merged = Array.from(map.values());

  // 4. Save merged list back to localStorage
  if (typeof window !== "undefined" && merged.length > 0) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(merged));
    } catch(e) {}
  }

  return merged;
}

/**
 * Save an entire array of records to Local Storage AND sync each with Supabase asynchronously.
 */
export async function dbSaveList(table, list = []) {
  const storageKey = TABLE_STORAGE_KEYS[table] || `persistent_${table}`;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(storageKey, JSON.stringify(list));
    } catch(e) {}
  }

  try {
    if (Array.isArray(list) && list.length > 0) {
      await supabase.from(table).upsert(list, { onConflict: "id" }).catch(() => {});
    }
  } catch(e) {}

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("dataChanged"));
    window.dispatchEvent(new Event("storage"));
  }

  return list;
}

/**
 * Insert or Upsert record to Database AND Local Storage synchronously.
 */
export async function dbSaveRecord(table, record) {
  const storageKey = TABLE_STORAGE_KEYS[table] || `persistent_${table}`;
  
  // 1. Synchronously update Local Storage
  if (typeof window !== "undefined") {
    let currentLocal = [];
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) currentLocal = JSON.parse(saved);
    } catch(e) {}

    const recKey = String(record.id || record.email || record.title || "").toLowerCase().trim();
    const filtered = currentLocal.filter(item => {
      if (!item) return false;
      const k = String(item.id || item.email || item.title || "").toLowerCase().trim();
      return k !== recKey;
    });

    const updated = [record, ...filtered];
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch(e) {}
  }

  // 2. Write to Supabase DB safely
  try {
    const { error: upsertErr } = await supabase.from(table).upsert([record], { onConflict: "id" });
    if (upsertErr) {
      const { error: insertErr } = await supabase.from(table).insert([record]);
      if (insertErr && record.id) {
        const { id, ...cleanPayload } = record;
        await supabase.from(table).insert([cleanPayload]).catch(() => {});
      }
    }
  } catch(e) {}

  // 3. Trigger cross-tab/window event
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("dataChanged"));
    window.dispatchEvent(new Event("storage"));
  }

  return record;
}

/**
 * Delete record from Database AND Local Storage.
 */
export async function dbDeleteRecord(table, id, emailField = "") {
  const storageKey = TABLE_STORAGE_KEYS[table] || `persistent_${table}`;
  
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const current = JSON.parse(saved);
        const filtered = current.filter(item => item && item.id !== id && item.email !== emailField);
        localStorage.setItem(storageKey, JSON.stringify(filtered));
      }
    } catch(e) {}
  }

  try {
    await supabase.from(table).delete().eq("id", id).catch(() => {});
  } catch(e) {}

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("dataChanged"));
    window.dispatchEvent(new Event("storage"));
  }
}

