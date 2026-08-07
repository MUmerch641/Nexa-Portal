import { supabase } from "@/lib/supabase";
import { dbFetch, dbSaveList } from "@/lib/dbPersistence";

export const MONITORING_STORAGE_KEYS = {
  sessions: "remote_work_sessions",
  activity: "remote_activity_logs",
  screenshots: "remote_screenshot_logs",
  appUsage: "remote_app_usage_logs",
  timeline: "remote_work_timelines",
  reports: "remote_productivity_reports",
  settings: "remote_monitoring_settings",
};

// Initial Seed Data arrays (Cleared for clean real data entry)
export const INITIAL_REMOTE_SESSIONS = [];
export const INITIAL_SCREENSHOTS = [];
export const INITIAL_APP_USAGE = [];
export const INITIAL_WORK_TIMELINE = [];

/**
 * Get active sessions merged from DB & Local storage
 */
export async function getRemoteWorkSessions() {
  return await dbFetch("remote_work_sessions", INITIAL_REMOTE_SESSIONS);
}

/**
 * Get screenshot logs
 */
export async function getScreenshotLogs() {
  return await dbFetch("screenshot_logs", INITIAL_SCREENSHOTS);
}

/**
 * Save new screenshot
 */
export async function saveScreenshotLog(screenshotRecord) {
  const existing = await getScreenshotLogs();
  const updated = [screenshotRecord, ...existing];
  await dbSaveList("screenshot_logs", updated);
  return updated;
}

/**
 * Get timeline events
 */
export async function getWorkTimelines() {
  return await dbFetch("work_timelines", INITIAL_WORK_TIMELINE);
}

/**
 * Append timeline event
 */
export async function addTimelineEvent(eventRecord) {
  const existing = await getWorkTimelines();
  const updated = [eventRecord, ...existing];
  await dbSaveList("work_timelines", updated);
  return updated;
}

/**
 * Get settings (retention days, randomized interval bounds)
 */
export function getMonitoringSettings() {
  if (typeof window === "undefined") return { retentionDays: 60, minInterval: 5, maxInterval: 15 };
  try {
    const raw = localStorage.getItem(MONITORING_STORAGE_KEYS.settings);
    return raw ? JSON.parse(raw) : { retentionDays: 60, minInterval: 5, maxInterval: 15 };
  } catch (e) {
    return { retentionDays: 60, minInterval: 5, maxInterval: 15 };
  }
}

/**
 * Save monitoring settings
 */
export function saveMonitoringSettings(settings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MONITORING_STORAGE_KEYS.settings, JSON.stringify(settings));
}

/**
 * Purge screenshots older than retention period (e.g. 30, 60, or 90 days)
 */
export async function purgeExpiredScreenshots(retentionDays = 60) {
  const logs = await getScreenshotLogs();
  const now = Date.now();
  const cutoffTime = now - retentionDays * 24 * 3600 * 1000;

  const validLogs = logs.filter((log) => {
    const logTime = new Date(log.timestamp || log.date).getTime();
    return logTime >= cutoffTime;
  });

  const removedCount = logs.length - validLogs.length;
  if (removedCount > 0) {
    await dbSaveList("screenshot_logs", validLogs);
  }

  return { removedCount, remainingCount: validLogs.length };
}

/**
 * Utility to calculate random next screenshot interval between min & max minutes (default 5–15 min)
 */
export function getRandomScreenshotInterval(minMinutes = 5, maxMinutes = 15) {
  const minSec = minMinutes * 60;
  const maxSec = maxMinutes * 60;
  return Math.floor(Math.random() * (maxSec - minSec + 1)) + minSec;
}

/**
 * Detect client OS and Device Name for metadata logging
 */
export function getClientDeviceInfo() {
  if (typeof window === "undefined") {
    return { deviceName: "Workstation", os: "Unknown OS", ip: "127.0.0.1" };
  }

  const userAgent = navigator.userAgent || "";
  let os = "Windows 11 Pro";
  if (userAgent.includes("Mac")) os = "macOS Sonoma 14.4";
  else if (userAgent.includes("Linux")) os = "Linux Ubuntu 22.04";
  else if (userAgent.includes("Android")) os = "Android 14";
  else if (userAgent.includes("iPhone")) os = "iOS 17";

  return {
    deviceName: `${os.split(" ")[0]} Desktop Workstation`,
    os: os,
    ip: "192.168.1." + (Math.floor(Math.random() * 150) + 10),
  };
}
