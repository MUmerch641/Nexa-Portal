import { supabase } from "@/lib/supabase";

export const INITIAL_ACTIVITIES = [
  {
    id: "act-101",
    user_name: "Admin / HR Lead",
    action_type: "Leave Approved",
    description: "Approved 3-day sick leave request for Senior Lead Developer",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    icon: "leave"
  },
  {
    id: "act-102",
    user_name: "Accounts Manager",
    action_type: "Expense Added",
    description: "Logged office K-Electric bill payment of Rs. 35,000",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    icon: "expense"
  },
  {
    id: "act-103",
    user_name: "Admin / HR",
    action_type: "Employee Added",
    description: "Created new employee profile and credentials for Sara Khan",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    icon: "employee"
  },
  {
    id: "act-104",
    user_name: "Project Lead",
    action_type: "Project Updated",
    description: "Updated Software House Management ERP project progress to 85%",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    icon: "project"
  }
];

export async function logActivity(user_name, action_type, description, icon = "general") {
  const newActivity = {
    id: `act-${Date.now()}`,
    user_name: user_name || "Admin",
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

  // 2. Save to Supabase DB activity_logs table
  try {
    await supabase.from("activity_logs").insert([newActivity]);
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
    await supabase.from("activity_logs").delete().neq("id", "0");
  } catch(e) {}
}

export async function fetchRecentActivities() {
  let dbActivities = [];
  try {
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(30);

    if (!error && data) {
      dbActivities = data;
    }
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
  return combined;
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
    supabase.from("employee_activity_statuses").upsert([{
      user_email: emailKey,
      status,
      last_active: lastActiveIso,
      updated_at: new Date().toISOString()
    }]);
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
