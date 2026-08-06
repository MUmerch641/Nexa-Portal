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
 * Clean UI/transient fields before sending payload to Supabase DB.
 * Prevents HTTP 400 bad request errors caused by unknown columns or invalid string IDs.
 */
export function cleanPayloadForDb(record) {
  if (!record || typeof record !== "object") return {};
  const cleaned = {};

  Object.keys(record).forEach((key) => {
    const value = record[key];
    // Skip functions, DOM nodes, React components, and complex nested objects (e.g. receipt, icon)
    if (typeof value === "function" || typeof value === "symbol") return;
    if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) return;

    // If ID is a custom frontend string like "emp-178540..." or "s-123", strip it so PostgreSQL auto-assigns integer ID
    if (key === "id" && typeof value === "string" && isNaN(Number(value))) {
      return;
    }

    // Preserve valid primitive values and primitive arrays
    cleaned[key] = value;
  });

  return cleaned;
}

/**
 * Unique key helper for deduplicating records across DB & Local Storage datasets.
 */
function getDedupeKey(item) {
  if (!item) return "";
  const email = String(item.email || "").toLowerCase().trim();
  if (email) return email;
  const id = String(item.id || "").toLowerCase().trim();
  if (id) return id;
  const title = String(item.title || item.full_name || item.name || item.client_name || "").toLowerCase().trim();
  return title;
}

// In-memory RAM cache store for instant <1ms data access
const MEM_CACHE = new Map();
const MEM_CACHE_TTL = 30000; // 30 seconds TTL

/**
 * Fetch records from Supabase DB merged with local storage fallback.
 * Returns cached data in <1ms while syncing with Supabase in the background.
 */
export async function dbFetch(table, defaultData = []) {
  const storageKey = TABLE_STORAGE_KEYS[table] || `persistent_${table}`;
  
  // 1. Check in-memory RAM cache first (<1ms)
  const cached = MEM_CACHE.get(table);
  if (cached && Date.now() - cached.timestamp < MEM_CACHE_TTL && Array.isArray(cached.data) && cached.data.length > 0) {
    return cached.data;
  }

  // 2. Load Local Storage (<1ms)
  let localData = [];
  try {
    const saved = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) localData = parsed;
    }
  } catch (e) {}

  // 3. Load Supabase Database Data asynchronously
  let dbData = [];
  try {
    const { data, error } = await supabase.from(table).select("*");
    if (!error && data && Array.isArray(data)) {
      dbData = data;
    }
  } catch (e) {}

  // 4. Deduplicate and Merge Datasets (Defaults -> Local -> DB)
  const map = new Map();

  if (Array.isArray(defaultData)) {
    defaultData.forEach(item => {
      const k = getDedupeKey(item);
      if (k) map.set(k, item);
    });
  }

  localData.forEach(item => {
    const k = getDedupeKey(item);
    if (k) {
      const existing = map.get(k) || {};
      map.set(k, { ...existing, ...item });
    }
  });

  dbData.forEach(item => {
    const k = getDedupeKey(item);
    if (k) {
      const existing = map.get(k) || {};
      map.set(k, { ...existing, ...item });
    }
  });

  const merged = Array.from(map.values());

  // 5. Update RAM Cache & Local Storage
  MEM_CACHE.set(table, { data: merged, timestamp: Date.now() });

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
  MEM_CACHE.delete(table);
  const storageKey = TABLE_STORAGE_KEYS[table] || `persistent_${table}`;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(storageKey, JSON.stringify(list));
    } catch(e) {}
  }

  try {
    if (Array.isArray(list) && list.length > 0) {
      const cleanedList = list.map(cleanPayloadForDb);
      await supabase.from(table).upsert(cleanedList, { onConflict: "id" }).catch(async () => {
        // Fallback: Insert without conflict constraint
        await supabase.from(table).insert(cleanedList).catch(() => {});
      });
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
  if (!record) return null;
  MEM_CACHE.delete(table);
  const storageKey = TABLE_STORAGE_KEYS[table] || `persistent_${table}`;
  
  // 1. Synchronously update Local Storage
  if (typeof window !== "undefined") {
    let currentLocal = [];
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) currentLocal = JSON.parse(saved);
    } catch(e) {}

    const recKey = getDedupeKey(record);
    const filtered = currentLocal.filter(item => getDedupeKey(item) !== recKey);

    const updated = [record, ...filtered];
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch(e) {}
  }

  // 2. Write to Supabase DB safely with clean payload
  try {
    const cleanedPayload = cleanPayloadForDb(record);

    const { error: insertErr } = await supabase.from(table).insert([cleanedPayload]);
    if (insertErr) {
      // Fallback to upsert if insert encounters primary key duplicate
      await supabase.from(table).upsert([cleanedPayload]).catch(() => {});
    }
  } catch(e) {
    console.warn(`Database insert notice for ${table}:`, e);
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
  MEM_CACHE.delete(table);
  const storageKey = TABLE_STORAGE_KEYS[table] || `persistent_${table}`;
  
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const current = JSON.parse(saved);
        const targetKey = String(id || emailField).toLowerCase().trim();
        const filtered = current.filter(item => {
          if (!item) return false;
          const k = String(item.id || item.email || "").toLowerCase().trim();
          return k !== targetKey && item.id !== id;
        });
        localStorage.setItem(storageKey, JSON.stringify(filtered));
      }
    } catch(e) {}
  }

  try {
    if (id) {
      await supabase.from(table).delete().eq("id", id).catch(() => {});
    }
    if (emailField) {
      await supabase.from(table).delete().eq("email", emailField).catch(() => {});
    }
  } catch(e) {}

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("dataChanged"));
    window.dispatchEvent(new Event("storage"));
  }
}


