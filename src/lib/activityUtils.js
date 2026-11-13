import { dbDeleteRecord, dbFetch, dbSaveRecord } from "@/lib/dbPersistence";

export const INITIAL_ACTIVITIES = [];

export async function logActivity(user_name, action_type, description, icon = "general") {
  let userEmail = "";
  try { userEmail = (localStorage.getItem("current_user_email") || "").toLowerCase().trim(); } catch (e) {}
  const newActivity = {
    id: `act-${Date.now()}`,
    user_name: user_name || "Admin",
    user_email: userEmail,
    email: userEmail,
    action_type: action_type || "System Action",
    description,
    timestamp: new Date().toISOString(),
    icon
  };

  // 1. Save to LocalStorage persistent logs
  try {
    const saved = localStorage.getItem("persistent_activity_logs");
    const existing = saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
    const updated = [newActivity, ...existing].slice(0, 50); // Retain top 50 recent
    localStorage.setItem("persistent_activity_logs", JSON.stringify(updated));
  } catch (e) {}

  // 2. Save to the shared app_records backend.
  try {
    await dbSaveRecord("activity_logs", newActivity);
  } catch (e) {}

  // 3. Trigger events for instant live feed update
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("activityLogged"));
    window.dispatchEvent(new Event("dataChanged"));
    window.dispatchEvent(new Event("storage"));
  }

  return newActivity;
}

export async function clearActivityLogs() {
  try {
    localStorage.removeItem("persistent_activity_logs");
    localStorage.setItem("persistent_activity_logs", JSON.stringify([]));
  } catch(e) {}

  try {
    const activities = await dbFetch("activity_logs", []);
    await Promise.all(activities.map((activity) => dbDeleteRecord("activity_logs", activity.id)));
  } catch(e) {}
}

export async function fetchRecentActivities() {
  let dbActivities = [];
  try {
    dbActivities = await dbFetch("activity_logs", []);
  } catch (e) {}

  let localActivities = [];
  try {
    const saved = localStorage.getItem("persistent_activity_logs");
    if (saved) {
      localActivities = JSON.parse(saved);
    }
  } catch (e) {}

  const actMap = new Map();
  dbActivities.forEach(a => actMap.set(a.id || a.timestamp, a));
  localActivities.forEach(a => {
    const key = a.id || a.timestamp;
    if (!actMap.has(key)) actMap.set(key, a);
  });

  const combined = Array.from(actMap.values()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return combined.slice(0, 30);
}

export function formatTimeAgo(isoTimestamp) {
  if (!isoTimestamp) return "Just now";
  const now = new Date();
  const past = new Date(isoTimestamp);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago (${past.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
}

// REAL-TIME EMPLOYEE ACTIVITY STATUS ENGINE (Online | Idle | Offline)
const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 Minutes Idle Timeout

export function updateEmployeeRealtimeStatus(userEmail, status, lastActiveIso = new Date().toISOString()) {
  if (!userEmail) return;
  const emailKey = userEmail.toLowerCase().trim();
  const statusObj = {
    email: emailKey,
    status, // "Online" | "Idle" | "Offline"
    last_active: lastActiveIso,
    updated_at: new Date().toISOString()
  };

  try {
    const saved = localStorage.getItem("software_house_realtime_activity_statuses") || "{}";
    const statusMap = JSON.parse(saved);
    statusMap[emailKey] = statusObj;
    localStorage.setItem("software_house_realtime_activity_statuses", JSON.stringify(statusMap));
    window.dispatchEvent(new Event("storage"));
  } catch (e) {}

  try {
    dbSaveRecord("employee_activity_statuses", {
      id: emailKey,
      email: emailKey,
      user_email: emailKey,
      status,
      last_active: lastActiveIso,
      updated_at: new Date().toISOString()
    }).catch(() => {});
  } catch (e) {}
}

export function initActivityStatusTracker(userEmail) {
  if (typeof window === "undefined" || !userEmail) return () => {};

  const emailKey = userEmail.toLowerCase().trim();
  let idleTimer = null;

  const markOnline = () => {
    updateEmployeeRealtimeStatus(emailKey, "Online");
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      updateEmployeeRealtimeStatus(emailKey, "Idle");
    }, IDLE_TIMEOUT_MS);
  };

  markOnline();

  const activityEvents = ["mousemove", "keydown", "click", "scroll", "touchstart"];
  activityEvents.forEach(evt => window.addEventListener(evt, markOnline));

  const handleBeforeUnload = () => {
    updateEmployeeRealtimeStatus(emailKey, "Offline");
  };
  window.addEventListener("beforeunload", handleBeforeUnload);

  return () => {
    if (idleTimer) clearTimeout(idleTimer);
    activityEvents.forEach(evt => window.removeEventListener(evt, markOnline));
    window.removeEventListener("beforeunload", handleBeforeUnload);
    updateEmployeeRealtimeStatus(emailKey, "Offline");
  };
}
