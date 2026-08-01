"use client";

/**
 * Fetch client IP address using public IPify service
 */
export async function getCurrentIp() {
  const services = [
    "https://api.ipify.org?format=json",
    "https://ipapi.co/json/",
    "https://api.my-ip.io/v2/ip.json"
  ];

  for (const url of services) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) continue;
      const data = await res.json();
      const ip = data.ip || data.ip_address || data.query || "";
      if (ip) return ip;
    } catch (e) {
      // Continue to next service fallback
    }
  }
  return "192.168.1.100"; // Default local fallback IP if offline/blocked
}

/**
 * Returns total minutes elapsed since midnight today
 */
export function getCurrentMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * Full Attendance Logic Engine strictly following your prompt specification:
 * 
 * IP Match Rule:
 * - If detected IP does not match registered Office IP (set in Admin Settings), BLOCK attendance & check-out!
 * - Message: "You must be connected to the office network to mark attendance."
 * 
 * Office / Class Start Time: 10:00 AM (600 minutes)
 * 
 * Employees:
 * - Before 10:00 AM (< 600 min): Blocked. "Please wait until office hours begin at 10:00 AM."
 * - 10:00 AM - 10:15 AM (600 <= min < 615): On Time. 🟢 Green indicator. Modal: "You have successfully checked in on time."
 * - 10:15 AM - 10:30 AM (615 <= min < 630): Late. 🟢 Green indicator. Modal: "You are late. Please arrive on time to avoid salary deductions."
 * - 10:30 AM - 11:00 AM (630 <= min < 660): Very Late. 🟠 Orange indicator. Modal: "You are significantly late. A salary deduction may be applied according to company policy."
 * - After 11:00 AM (>= 660 min): 🔴 Red indicator. Modal: "You have arrived after 11:00 AM. One day's salary will be deducted according to company policy."
 * 
 * Students:
 * - Before 10:00 AM (< 600 min): Blocked. "Please wait until attendance opens at 10:00 AM."
 * - 10:00 AM - 10:15 AM (600 <= min < 615): 🟢 Green indicator. Modal: "You are slightly late. Please try to arrive on time."
 * - 10:15 AM - 10:30 AM (615 <= min < 630): 🟠 Orange indicator. Modal: "This is your final warning. Please avoid arriving late."
 * - 10:30 AM - 11:00 AM (630 <= min < 660): 🟠 Orange indicator. Modal: "This is your final warning. Please avoid arriving late."
 * - After 11:00 AM (>= 660 min): 🔴 Red indicator. Modal: "You have arrived after the allowed attendance time. Please pay the applicable late attendance fine."
 */
export function determineAttendanceState(role = "employee", minutes, ipMatch) {
  const isStudentOrIntern = role === "student" || role === "internship" || role === "intern";

  // IP verification check (IPify matched against Admin Settings office IP)
  if (!ipMatch) {
    return {
      allowed: false,
      modalMessage: "You must be connected to the office network to mark attendance.",
      status: "error",
      lightColor: "grey",
      label: "Blocked (Office Wi-Fi IP Required)"
    };
  }

  // Before 10:00 AM
  if (minutes < 600) {
    return {
      allowed: false,
      modalMessage: isStudentOrIntern
        ? "Please wait until attendance opens at 10:00 AM."
        : "Please wait until office hours begin at 10:00 AM.",
      status: "info",
      lightColor: "grey",
      label: "Closed (Before 10:00 AM)"
    };
  }

  // 10:00 AM – 10:15 AM
  if (minutes >= 600 && minutes < 615) {
    return {
      allowed: true,
      modalMessage: isStudentOrIntern
        ? "You are slightly late. Please try to arrive on time."
        : "You have successfully checked in on time.",
      status: "success",
      lightColor: "green",
      label: isStudentOrIntern ? "Slightly Late" : "On Time"
    };
  }

  // 10:15 AM – 10:30 AM
  if (minutes >= 615 && minutes < 630) {
    return {
      allowed: true,
      modalMessage: isStudentOrIntern
        ? "This is your final warning. Please avoid arriving late."
        : "You are late. Please arrive on time to avoid salary deductions.",
      status: isStudentOrIntern ? "warning" : "success",
      lightColor: isStudentOrIntern ? "orange" : "green",
      label: isStudentOrIntern ? "Final Warning" : "Late"
    };
  }

  // 10:30 AM – 11:00 AM
  if (minutes >= 630 && minutes < 660) {
    return {
      allowed: true,
      modalMessage: isStudentOrIntern
        ? "This is your final warning. Please avoid arriving late."
        : "You are significantly late. A salary deduction may be applied according to company policy.",
      status: "warning",
      lightColor: "orange",
      label: isStudentOrIntern ? "Final Warning" : "Very Late"
    };
  }

  // After 11:00 AM
  return {
    allowed: true,
    modalMessage: isStudentOrIntern
      ? "You have arrived after the allowed attendance time. Please pay the applicable late attendance fine."
      : "You have arrived after 11:00 AM. One day's salary will be deducted according to company policy.",
    status: "error",
    lightColor: "red",
    label: isStudentOrIntern ? "Late Fine Applicable" : "1 Day Salary Cut"
  };
}
