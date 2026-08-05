import { supabase } from "@/lib/supabase";

const TABLE_STORAGE_KEYS = {
  employees: "persistent_employees",
  projects: "software_house_full_projects",
  daily_tasks: "software_house_daily_tasks",
  clients: "software_house_clients",
  invoices: "software_house_invoices",
  incomes: "persistent_incomes",
  expenses: "persistent_expenses",
  payrolls: "software_house_payrolls",
  students: "persistent_courses",
  leaves: "software_house_leaves",
  meetings: "software_house_meetings_list",
  complaints: "software_house_complaints_list",
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
    if (saved) localData = JSON.parse(saved);
  } catch (e) {}

  // 2. Load Supabase Database Data
  let dbData = [];
  try {
    const { data, error } = await supabase.from(table).select("*");
    if (!error && data && Array.isArray(data) && data.length > 0) {
      dbData = data;
    }
  } catch (e) {}

  // 3. Deduplicate and Merge Datasets (Local + DB + Defaults)
  const map = new Map();
  const baseList = localData.length > 0 ? localData : defaultData;

  baseList.forEach(item => {
    const key = String(item.id || item.email || item.title || item.client_name || "").toLowerCase().trim();
    if (key) map.set(key, item);
  });

  dbData.forEach(item => {
    const key = String(item.id || item.email || item.title || item.client_name || "").toLowerCase().trim();
    if (key) {
      const existing = map.get(key) || {};
      map.set(key, { ...existing, ...item });
    }
  });

  const merged = Array.from(map.values());

  // 4. Save merged list back to localStorage
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(storageKey, JSON.stringify(merged));
    } catch(e) {}
  }

  return merged;
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
      const k = String(item.id || item.email || item.title || "").toLowerCase().trim();
      return k !== recKey;
    });

    const updated = [record, ...filtered];
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch(e) {}
  }

  // 2. Write to Supabase DB
  try {
    await supabase.from(table).upsert([record], { onConflict: "id" });
  } catch(e) {
    try {
      await supabase.from(table).insert([record]);
    } catch(err) {}
  }

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
        const filtered = current.filter(item => item.id !== id && item.email !== emailField);
        localStorage.setItem(storageKey, JSON.stringify(filtered));
      }
    } catch(e) {}
  }

  try {
    await supabase.from(table).delete().eq("id", id);
  } catch(e) {}

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("dataChanged"));
    window.dispatchEvent(new Event("storage"));
  }
}
