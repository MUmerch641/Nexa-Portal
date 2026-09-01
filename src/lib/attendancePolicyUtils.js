/**
 * Attendance Policy Utility Functions
 * Manages custom attendance policy for employees and students
 */

import { supabase } from "./supabase";

// Default attendance policy
export const DEFAULT_POLICY = {
  shift_start: "10:00 AM",
  shift_end: "6:00 PM",
  grace_period_minutes: 14,
  late_warning_minutes: 29,
  salary_deduction_after: 30,
  policy_name: "Standard Policy",
  description: "Standard attendance policy for employees and students"
};

/**
 * Fetch current attendance policy
 */
export async function fetchAttendancePolicy() {
  try {
    // Check local cache first
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("attendance_policy");
      if (cached) {
        return JSON.parse(cached);
      }
    }

    // Fetch from Supabase
    try {
      const { data, error } = await supabase
        .from("attendance_policy")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        const policy = data[0];
        if (typeof window !== "undefined") {
          localStorage.setItem("attendance_policy", JSON.stringify(policy));
        }
        return policy;
      }
    } catch (supabaseErr) {
      console.log("Supabase fetch failed, using default:", supabaseErr.message);
    }

    // Return default policy
    return DEFAULT_POLICY;
  } catch (e) {
    console.error("Error fetching attendance policy:", e);
    return DEFAULT_POLICY;
  }
}

/**
 * Update attendance policy
 */
export async function updateAttendancePolicy(policy) {
  try {
    // Try to upsert to Supabase first
    try {
      const { data, error } = await supabase
        .from("attendance_policy")
        .upsert({
          id: "policy_1",
          shift_start: policy.shift_start,
          shift_end: policy.shift_end,
          grace_period_minutes: parseInt(policy.grace_period_minutes) || 14,
          late_warning_minutes: parseInt(policy.late_warning_minutes) || 29,
          salary_deduction_after: parseInt(policy.salary_deduction_after) || 30,
          policy_name: policy.policy_name || "Standard Policy",
          description: policy.description || "Standard attendance policy",
          updated_at: new Date().toISOString()
        })
        .select()
        .limit(1);

      if (error) {
        console.log("Supabase error (table may not exist), using localStorage:", error.message);
      } else if (data && data.length > 0) {
        // Clear cache
        if (typeof window !== "undefined") {
          localStorage.removeItem("attendance_policy");
        }
        return { success: true, message: "Attendance policy updated successfully" };
      }
    } catch (supabaseErr) {
      console.log("Supabase connection failed, using localStorage:", supabaseErr.message);
    }

    // Fallback to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("attendance_policy", JSON.stringify(policy));
    }

    return { success: true, message: "Attendance policy saved (using localStorage fallback)" };
  } catch (e) {
    console.error("Error in updateAttendancePolicy:", e);
    return { success: false, error: e.message };
  }
}

/**
 * Reset policy to default
 */
export async function resetAttendancePolicy() {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem("attendance_policy");
    }
    
    return { 
      success: true, 
      message: "Policy reset to default",
      policy: DEFAULT_POLICY
    };
  } catch (e) {
    console.error("Error resetting policy:", e);
    return { success: false, error: e.message };
  }
}

/**
 * Convert time string to minutes since midnight
 */
export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 0;
  
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3] ? match[3].toUpperCase() : "AM";
  
  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  
  return hours * 60 + minutes;
}

/**
 * Convert minutes to time string
 */
export function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")} ${period}`;
}

/**
 * Get attendance status based on policy
 */
export function getAttendanceStatus(minutes, role = "employee", policy = null) {
  const defaultPolicy = DEFAULT_POLICY;
  const policyMinutes = policy || defaultPolicy;
  
  const shiftStart = timeToMinutes(policyMinutes.shift_start);
  const graceEnd = shiftStart + (parseInt(policyMinutes.grace_period_minutes) || 14);
  const lateWarningEnd = shiftStart + (parseInt(policyMinutes.late_warning_minutes) || 29);
  const salaryDeductionStart = shiftStart + (parseInt(policyMinutes.salary_deduction_after) || 30);

  const isStudent = role === "student" || role === "course_student" || role === "intern" || role === "internship";

  if (minutes < shiftStart) {
    return {
      status: "Closed",
      label: "Attendance Closed",
      color: "slate",
      message: `Attendance opens at ${policyMinutes.shift_start}`
    };
  }

  if (minutes >= shiftStart && minutes < graceEnd) {
    return {
      status: "On Time",
      label: "On Time 🟢",
      color: "emerald",
      message: "On time attendance recorded"
    };
  }

  if (minutes >= graceEnd && minutes < lateWarningEnd) {
    return {
      status: "Late Warning",
      label: "Late Warning 🟠",
      color: "amber",
      message: "Late attendance recorded"
    };
  }

  if (isStudent) {
    return {
      status: "Late Fine",
      label: "Late Fine Applicable 🔴",
      color: "rose",
      message: "Late fine may apply"
    };
  }

  return {
    status: "Salary Deduction",
    label: "Salary Deduction 🔴",
    color: "rose",
    message: "1-day salary deduction applied"
  };
}
