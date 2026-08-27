/**
 * Returns YYYY-MM-DD string according to user's local timezone (not UTC)
 */
export function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Checks if an attendance record belongs to today's date
 */
export function isRecordFromToday(r) {
  if (!r) return false;
  const today = getTodayDateString();
  const rDate = r.attendance_date || r.date || (r.timestamp ? r.timestamp.split("T")[0] : "");
  if (rDate && rDate === today) return true;
  if (r.timestamp) {
    try {
      const d = new Date(r.timestamp);
      const now = new Date();
      return d.getFullYear() === now.getFullYear() &&
             d.getMonth() === now.getMonth() &&
             d.getDate() === now.getDate();
    } catch(e) {}
  }
  return false;
}

/**
 * Returns total minutes elapsed since midnight today
 */
export function getCurrentMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * Student & Employee Pure Time-Based Attendance Status Logic Engine:
 * 
 * Before shift_start: White Status ("white"). Attendance Closed.
 * 
 * shift_start to (shift_start + grace_period_minutes): Green Status ("green"). On-Time Check-In.
 * 
 * (shift_start + grace_period_minutes) to (shift_start + late_warning_minutes): Orange Status ("orange"). Late Warning.
 * 
 * (shift_start + salary_deduction_after) and After: Red Status ("red").
 */
export function determineAttendanceState(role = "employee", minutes, policy = null) {
  // Use default policy if not provided
  const defaultPolicy = {
    shift_start_minutes: 600,  // 10:00 AM
    grace_period_minutes: 14,  // 10:14 AM
    late_warning_minutes: 29,  // 10:29 AM
    salary_deduction_after: 30 // 10:30 AM
  };
  
  const policyMinutes = policy || defaultPolicy;
  const shiftStart = policyMinutes.shift_start_minutes || 600;
  const graceEnd = shiftStart + (policyMinutes.grace_period_minutes || 14);
  const lateWarningEnd = shiftStart + (policyMinutes.late_warning_minutes || 29);
  const salaryDeductionStart = shiftStart + (policyMinutes.salary_deduction_after || 30);

  const isStudent = role === "student" || role === "course_student" || role === "intern" || role === "internship";

  // Before shift_start: Attendance Closed
  if (minutes < shiftStart) {
    return {
      allowed: false,
      modalMessage: `Attendance is disabled before ${policyMinutes.shift_start || "10:00 AM"}.`,
      status: "info",
      lightColor: "white",
      label: `Attendance Closed (Before ${policyMinutes.shift_start || "10:00 AM"})`,
      attendanceStatus: "Closed",
      salaryDeductionStatus: "No Deduction"
    };
  }

  // On Time period
  if (minutes >= shiftStart && minutes < graceEnd) {
    return {
      allowed: true,
      modalMessage: "Attendance marked as On Time!",
      status: "success",
      lightColor: "green",
      label: "On Time 🟢",
      attendanceStatus: "On Time",
      salaryDeductionStatus: "No Deduction"
    };
  }

  // Late Warning period
  if (minutes >= graceEnd && minutes < lateWarningEnd) {
    return {
      allowed: true,
      modalMessage: "You are late. Please mark your attendance immediately.",
      status: "warning",
      lightColor: "orange",
      label: "Late Warning 🟠",
      attendanceStatus: "Late Warning",
      salaryDeductionStatus: "Warning Issued"
    };
  }

  // Salary Deduction period
  if (isStudent) {
    return {
      allowed: true,
      modalMessage: "You are very late. A late attendance fine may apply according to institute policy.",
      status: "error",
      lightColor: "red",
      label: "Late Fine Applicable 🔴",
      attendanceStatus: "Late Fine",
      salaryDeductionStatus: "Late Fine Policy"
    };
  } else {
    return {
      allowed: true,
      modalMessage: "You are very late. One day's salary will be deducted according to company policy.",
      status: "error",
      lightColor: "red",
      label: "Salary Deduction 🔴",
      attendanceStatus: "Salary Deduction",
      salaryDeductionStatus: "1-Day Salary Deducted"
    };
  }
}

/**
 * Evaluates Employee Attendance Check-In Status based on Policy Timeline:
 * - shift_start to (shift_start + grace_period_minutes): On Time 🟢
 * - (shift_start + grace_period_minutes) to (shift_start + late_warning_minutes): Late Warning 🟠
 * - (shift_start + salary_deduction_after) and after: Salary Deduction 🔴
 */
export function getEmployeeCheckInStatus(input, policy = null) {
  let minutes = 0;
  const defaultPolicy = {
    shift_start_minutes: 600,  // 10:00 AM
    grace_period_minutes: 14,  // 10:14 AM
    late_warning_minutes: 29,  // 10:29 AM
    salary_deduction_after: 30 // 10:30 AM
  };
  
  const policyMinutes = policy || defaultPolicy;
  const shiftStart = policyMinutes.shift_start_minutes || 600;
  const graceEnd = shiftStart + (policyMinutes.grace_period_minutes || 14);
  const lateWarningEnd = shiftStart + (policyMinutes.late_warning_minutes || 29);

  if (typeof input === "number") {
    minutes = input;
  } else if (input instanceof Date) {
    minutes = input.getHours() * 60 + input.getMinutes();
  } else if (typeof input === "string" && input.trim()) {
    // If it's an ISO timestamp
    if (input.includes("T") || input.includes("-")) {
      try {
        const d = new Date(input);
        if (!isNaN(d.getTime())) {
          minutes = d.getHours() * 60 + d.getMinutes();
        }
      } catch (e) {}
    }
    
    // If minutes not resolved yet, parse time string e.g. "10:12 AM" or "10:15:30 AM" or "10:30"
    if (!minutes) {
      const match = input.match(/(\d+):(\d+)(?::\d+)?\s*(AM|PM)?/i);
      if (match) {
        let hours = parseInt(match[1], 10);
        const mins = parseInt(match[2], 10);
        const modifier = match[3] ? match[3].toUpperCase() : "";
        if (modifier === "PM" && hours < 12) hours += 12;
        if (modifier === "AM" && hours === 12) hours = 0;
        minutes = hours * 60 + mins;
      }
    }
  }

  // Fallback to current time if unparseable
  if (!minutes) {
    const now = new Date();
    minutes = now.getHours() * 60 + now.getMinutes();
  }

  // Before shift_start
  if (minutes < shiftStart) {
    return {
      status: "Early / Closed",
      label: `Before ${policyMinutes.shift_start || "10:00 AM"} (Closed)`,
      shortLabel: "Closed",
      badgeColor: "bg-slate-50 text-slate-700 border-slate-200",
      colorKey: "slate",
      dot: "⚪",
      rule: `Attendance opens at ${policyMinutes.shift_start || "10:00 AM"}`
    };
  }

  // On Time period
  if (minutes >= shiftStart && minutes < graceEnd) {
    return {
      status: "On Time",
      label: "On Time 🟢",
      shortLabel: "On Time",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      colorKey: "emerald",
      dot: "🟢",
      rule: `${policyMinutes.shift_start || "10:00 AM"} to ${policyMinutes.shift_start || "10:14 AM"} — On Time 🟢`
    };
  }

  // Late Warning period
  if (minutes >= graceEnd && minutes < lateWarningEnd) {
    return {
      status: "Late Warning",
      label: "Late Warning 🟠",
      shortLabel: "Late Warning",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      colorKey: "amber",
      dot: "🟠",
      rule: `Late Warning period`
    };
  }

  // Salary Deduction period
  return {
    status: "Salary Deduction",
    label: "Salary Deduction 🔴",
    shortLabel: "Salary Deduction",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    colorKey: "rose",
    dot: "🔴",
    rule: `Salary Deduction starts at ${policyMinutes.shift_start || "10:30 AM"}`
  };
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
