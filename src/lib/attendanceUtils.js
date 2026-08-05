"use client";

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
 * Before 10:00 AM (< 600 min):
 * - White Status ("white"). Attendance Closed.
 * 
 * 10:00 AM – 10:14 AM (600 <= min < 615):
 * - Green Status ("green"). On-Time Check-In. Status: "Present".
 * 
 * 10:15 AM – 10:29 AM (615 <= min < 630):
 * - Orange Status ("orange"). Late Warning: "You are late. Please mark your attendance immediately."
 * 
 * 10:30 AM and After (>= 630 min):
 * - Red Status ("red").
 *   - Students: "You are very late. A late attendance fine may apply according to institute policy."
 *   - Employees: "You are very late. One day's salary will be deducted according to company policy."
 */
export function determineAttendanceState(role = "employee", minutes) {
  const isStudent = role === "student" || role === "course_student" || role === "intern" || role === "internship";

  // 1. Before 10:00 AM (< 600 min): White Status, Attendance Disabled / Closed
  if (minutes < 600) {
    return {
      allowed: false,
      modalMessage: "Attendance is disabled before 10:00 AM.",
      status: "info",
      lightColor: "white",
      label: "Attendance Closed (Before 10:00 AM)",
      attendanceStatus: "Closed",
      salaryDeductionStatus: "No Deduction"
    };
  }

  // 2. 10:00 AM – 10:14 AM (600 <= min < 615): Green Status, On Time
  if (minutes >= 600 && minutes < 615) {
    return {
      allowed: true,
      modalMessage: "Attendance marked as On Time!",
      status: "success",
      lightColor: "green",
      label: "On Time (Green)",
      attendanceStatus: "Present",
      salaryDeductionStatus: "No Deduction"
    };
  }

  // 3. 10:15 AM – 10:29 AM (615 <= min < 630): Orange Status, Late Warning
  if (minutes >= 615 && minutes < 630) {
    return {
      allowed: true,
      modalMessage: "You are late. Please mark your attendance immediately.",
      status: "warning",
      lightColor: "orange",
      label: "Late Warning (Orange)",
      attendanceStatus: "Late",
      salaryDeductionStatus: "Warning Issued"
    };
  }

  // 4. 10:30 AM and After (>= 630 min): Red Status
  if (isStudent) {
    return {
      allowed: true,
      modalMessage: "You are very late. A late attendance fine may apply according to institute policy.",
      status: "error",
      lightColor: "red",
      label: "Red Status (Late Fine Applicable)",
      attendanceStatus: "Late",
      salaryDeductionStatus: "Late Fine Policy"
    };
  } else {
    return {
      allowed: true,
      modalMessage: "You are very late. One day's salary will be deducted according to company policy.",
      status: "error",
      lightColor: "red",
      label: "Red Status (1-Day Salary Deducted)",
      attendanceStatus: "Late",
      salaryDeductionStatus: "1-Day Salary Deducted"
    };
  }
}
