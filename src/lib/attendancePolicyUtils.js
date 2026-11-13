import { authenticatedFetch } from "@/lib/authenticatedFetch";

// Default attendance policy
export const DEFAULT_POLICY = {
  id: "policy_1",
  shift_start: "10:00 AM",
  shift_end: "6:00 PM",
  grace_period_minutes: 14,
  late_warning_minutes: 29,
  salary_deduction_after: 30,
  policy_name: "Standard Policy",
  description: "Standard attendance policy for employees and students",
};

const POLICY_CACHE_KEY = "attendance_policy";

function cachePolicy(policy) {
  try {
    if (typeof window !== "undefined") localStorage.setItem(POLICY_CACHE_KEY, JSON.stringify(policy));
  } catch (error) {}
}

function readCachedPolicy() {
  try {
    if (typeof window === "undefined") return null;
    const saved = localStorage.getItem(POLICY_CACHE_KEY);
    return saved ? { ...DEFAULT_POLICY, ...JSON.parse(saved) } : null;
  } catch (error) {
    return null;
  }
}

async function readPolicyResponse(response) {
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success) {
    throw new Error(result.error || "Could not sync the attendance policy.");
  }
  return result;
}

/** Fetch the shared server policy first; local storage is only an offline fallback. */
export async function fetchAttendancePolicy() {
  const cachedPolicy = readCachedPolicy();
  try {
    const response = await authenticatedFetch("/api/attendance/policy");
    const result = await readPolicyResponse(response);
    const policy = { ...DEFAULT_POLICY, ...(result.policy || {}) };
    cachePolicy(policy);
    return policy;
  } catch (error) {
    if (cachedPolicy) return cachedPolicy;
    return DEFAULT_POLICY;
  }
}

async function saveAttendancePolicy(action, policy) {
  try {
    const response = await authenticatedFetch("/api/attendance/policy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, policy }),
    });
    const result = await readPolicyResponse(response);
    const savedPolicy = { ...DEFAULT_POLICY, ...(result.policy || policy || DEFAULT_POLICY) };
    cachePolicy(savedPolicy);
    return { success: true, message: "Attendance policy saved and synced across the portal.", policy: savedPolicy };
  } catch (error) {
    return { success: false, error: error?.message || "Could not save the attendance policy." };
  }
}

/** Update the shared server policy; never report a local-only write as a team sync. */
export function updateAttendancePolicy(policy) {
  return saveAttendancePolicy("update", policy);
}

/** Reset the shared server policy and refresh this browser's cache. */
export function resetAttendancePolicy() {
  return saveAttendancePolicy("reset", DEFAULT_POLICY);
}

export function getAttendancePolicyRules(policy = DEFAULT_POLICY) {
  const shiftStartFromString = timeToMinutes(policy?.shift_start || DEFAULT_POLICY.shift_start);
  const parsedShiftStart = policy?.shift_start_minutes ?? shiftStartFromString;
  const shiftStart = Number(parsedShiftStart);
  const asMinutes = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.min(180, parsed)) : fallback;
  };

  return {
    ...policy,
    shift_start_minutes: Number.isFinite(shiftStart) ? shiftStart : 600,
    grace_period_minutes: asMinutes(policy?.grace_period_minutes, DEFAULT_POLICY.grace_period_minutes),
    late_warning_minutes: asMinutes(policy?.late_warning_minutes, DEFAULT_POLICY.late_warning_minutes),
    salary_deduction_after: asMinutes(policy?.salary_deduction_after, DEFAULT_POLICY.salary_deduction_after),
  };
}

/** Convert time string to minutes since midnight */
export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;

  const match = String(timeStr).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 0;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3] ? match[3].toUpperCase() : "AM";

  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

/** Convert minutes to time string */
export function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")} ${period}`;
}

/** Get attendance status based on policy */
export function getAttendanceStatus(minutes, role = "employee", policy = null) {
  const policyMinutes = getAttendancePolicyRules(policy || DEFAULT_POLICY);
  const shiftStart = policyMinutes.shift_start_minutes;
  const graceEnd = shiftStart + policyMinutes.grace_period_minutes;
  const lateWarningEnd = shiftStart + policyMinutes.late_warning_minutes;
  const salaryDeductionStart = shiftStart + policyMinutes.salary_deduction_after;

  const isStudent = ["student", "course_student", "intern", "internship"].includes(role);

  if (minutes < shiftStart) {
    return { status: "Closed", label: "Attendance Closed", color: "slate", message: `Attendance opens at ${policyMinutes.shift_start}` };
  }

  if (minutes < graceEnd) {
    return { status: "Present (On Time)", label: "On Time", color: "green", message: "Attendance marked as On Time!" };
  }

  if (minutes < lateWarningEnd) {
    return { status: "Late Warning", label: "Late Warning", color: "yellow", message: "You are late. Please mark your attendance immediately." };
  }

  if (minutes >= salaryDeductionStart) {
    return isStudent
      ? { status: "Late (Fine Applicable)", label: "Late Fine", color: "red", message: "A late attendance fine may apply according to institute policy." }
      : { status: "Salary Deduction", label: "Salary Deduction", color: "red", message: "One day's salary will be deducted according to company policy." };
  }

  return { status: "Late", label: "Late", color: "orange", message: "Attendance marked late." };
}
