import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role key for write operations (has full access)
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6d213dGtsZGdjaG51cXhhbW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTQwNTEyNiwiZXhwIjoyMTAwOTgxMTI2fQ.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W3YpPv1ZI";

const supabase = createClient("https://uzwmwtkldgchnuqxamov.supabase.co", serviceRoleKey);

function convertTo24HourTime(timeStr) {
  if (!timeStr || timeStr === "--:--" || String(timeStr).includes("Not Checked Out")) return null;
  const str = String(timeStr).trim();
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(str)) return str.length === 5 ? `${str}:00` : str;

  const match = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const seconds = match[3] || "00";
  const modifier = match[4].toUpperCase();

  if (modifier === "PM" && hours < 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  return `${String(hours).padStart(2, "0")}:${minutes}:${seconds}`;
}

function convertTo12HourTime(timeStr) {
  if (!timeStr || timeStr === "--:--" || timeStr === "Not Checked Out") return "Not Checked Out";
  const parts = String(timeStr).split(":");
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const modifier = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, "0")}:${minutes} ${modifier}`;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    let table = searchParams.get("table");
    if (!table) {
      return NextResponse.json({ error: "Table name required" }, { status: 400 });
    }

    let { data, error } = await supabase.from(table).select("*");

    if (error && table === "daily_tasks") {
      const fallback = await supabase.from("tasks").select("*");
      if (!fallback.error && fallback.data) {
        data = fallback.data;
        error = null;
      }
    }

    if (table === "attendance" && Array.isArray(data)) {
      try {
        const { data: allEmps } = await supabase.from("employees").select("id, full_name, email");
        const empMap = new Map((allEmps || []).map(e => [e.id, e]));

        data = data.map(item => {
          const emp = empMap.get(item.employee_id);
          const email = emp?.email || item.employee_id || "employee@example.com";
          const name = emp?.full_name || "";
          return {
            id: item.id,
            employee_id: email,
            user_email: email,
            email: email,
            user_name: name,
            name: name,
            attendance_date: item.date,
            date: item.date,
            check_in_time: item.check_in ? convertTo12HourTime(item.check_in) : "--:--",
            check_out_time: item.check_out ? convertTo12HourTime(item.check_out) : "Not Checked Out",
            attendance_status: item.status || (item.check_out ? "Present (Completed)" : "Present (On Time)"),
            status: item.status,
            public_ip: item.ip_address || "127.0.0.1",
            timestamp: `${item.date}T${item.check_in || "00:00:00"}`
          };
        });
      } catch (e) { }
    }

    if (error) {
      return NextResponse.json({ success: true, data: [] }, {
        status: 200,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" }
      });
    }

    return NextResponse.json({ success: true, data: data || [] }, {
      status: 200,
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" }
    });
  } catch (e) {
    return NextResponse.json({ success: true, data: [] }, {
      status: 200,
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" }
    });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { table, record, action } = body;

    if (!table) {
      return NextResponse.json({ error: "Table required" }, { status: 400 });
    }

    // 1. DELETE ACTION
    if (action === "delete") {
      const { id, email, full_name, name } = record || {};
      const cleanEmail = email ? email.toLowerCase().trim() : "";
      let deleted = false;
      let errRes = null;

      // Special handling for attendance table - delete by multiple possible fields
      if (table === "attendance") {
        // Try deleting by id first
        if (id) {
          const { error } = await supabase.from("attendance").delete().eq("id", id);
          if (!error) deleted = true; else errRes = error;
        }
        
        // Also try deleting by user_email/date combination (for student attendance)
        if (!deleted && cleanEmail) {
          // Check if this is a student attendance record
          const { data: existing } = await supabase.from("attendance").select("id").or(`student_id.eq.${cleanEmail},user_email.eq.${cleanEmail}`).limit(1);
          if (existing && existing.length > 0) {
            const { error } = await supabase.from("attendance").delete().eq("id", existing[0].id);
            if (!error) deleted = true; else errRes = error;
          }
        }
      } else {
        // For other tables, use standard deletion
        if (cleanEmail) {
          const { error } = await supabase.from(table).delete().eq("email", cleanEmail);
          if (!error) deleted = true; else errRes = error;
        }
        if (id && String(id).includes("-") && isNaN(Number(id))) {
          const { error } = await supabase.from(table).delete().eq("id", id);
          if (!error) deleted = true; else if (!errRes) errRes = error;
        }
        if (full_name || name) {
          const { error } = await supabase.from(table).delete().eq("full_name", full_name || name);
          if (!error) deleted = true; else if (!errRes) errRes = error;
        }
      }

      if (cleanEmail && (table === "employees" || table === "students" || table === "interns")) {
        await supabase.from("app_users").delete().eq("email", cleanEmail).catch(() => { });
        await supabase.from("payrolls").delete().eq("email", cleanEmail).catch(() => { });
        await supabase.from("performances").delete().eq("email", cleanEmail).catch(() => { });
      }

      return NextResponse.json({ success: true, deleted, error: errRes ? errRes.message : null });
    }

    // 2. SAVE ACTION
    if (record) {
      // 2.1 Attendance
      if (table === "attendance") {
        const attDate = record.date || record.attendance_date || (record.timestamp ? record.timestamp.split("T")[0] : new Date().toISOString().split("T")[0]);
        const checkInTime = convertTo24HourTime(record.check_in || record.check_in_time) || "09:00:00";
        const checkOutTime = convertTo24HourTime(record.check_out || record.check_out_time);

        let empUuid = null;
        const targetEmail = (record.employee_id || record.user_email || record.email || "").toLowerCase().trim();
        if (targetEmail) {
          const { data: empData } = await supabase.from("employees").select("id").eq("email", targetEmail).limit(1);
          if (empData && empData[0]) {
            empUuid = empData[0].id;
          }
        }

        const attPayload = {
          employee_id: empUuid,
          date: attDate,
          status: record.status || record.attendance_status || (checkOutTime ? "Present (Completed)" : "Present (On Time)"),
          check_in: checkInTime,
          check_out: checkOutTime,
          ip_address: record.ip_address || record.public_ip || "127.0.0.1"
        };

        let existingQuery = supabase.from("attendance").select("id").eq("date", attDate);
        if (empUuid) {
          existingQuery = existingQuery.eq("employee_id", empUuid);
        }
        const { data: existingRows } = await existingQuery.limit(1);

        if (existingRows && existingRows.length > 0) {
          await supabase.from("attendance").update(attPayload).eq("id", existingRows[0].id);
        } else {
          await supabase.from("attendance").insert([attPayload]);
        }
        return NextResponse.json({ success: true });
      }

      // 2.2 Students (Student Attendance support)
      if (table === "students") {
        const cleanEmail = (record.email || "").toLowerCase().trim();
        const passVal = record.password || record.assigned_password || "studentpassword123";
        const stuPayload = {
          full_name: record.full_name || cleanEmail.split("@")[0],
          email: cleanEmail,
          phone: record.phone || "",
          course_name: record.course_name || "Full Stack MERN Web Development",
          status: record.status || "Active"
        };

        if (cleanEmail) {
          try {
            const { data: existS } = await supabase.from("students").select("id").eq("email", cleanEmail).limit(1);
            if (existS && existS.length > 0) {
              await supabase.from("students").update(stuPayload).eq("id", existS[0].id);
            } else {
              await supabase.from("students").insert([stuPayload]);
            }
          } catch (e) { }

          try {
            const userPayload = {
              email: cleanEmail,
              password: passVal,
              full_name: stuPayload.full_name,
              role: "student",
              status: "active"
            };
            const { data: existU } = await supabase.from("app_users").select("id").eq("email", cleanEmail).limit(1);
            if (existU && existU.length > 0) {
              await supabase.from("app_users").update(userPayload).eq("id", existU[0].id);
            } else {
              await supabase.from("app_users").insert([userPayload]);
            }
          } catch (e) { }
        }

        return NextResponse.json({ success: true });
      }

      // 2.3 Student Attendance
      if (table === "attendance" && record.student_id) {
        const attDate = record.date || record.attendance_date || new Date().toISOString().split("T")[0];
        const studentEmail = (record.student_id || record.user_email || record.user_id || "").toLowerCase().trim();
        const studentName = record.student_name || record.user_name || record.name || studentEmail.split("@")[0];
        
        let attendanceStatus = "Present";
        if ((record.status || "").toLowerCase().includes("absent")) {
          attendanceStatus = "Absent";
        } else if ((record.status || "").toLowerCase().includes("late")) {
          attendanceStatus = "Late";
        } else if ((record.status || "").toLowerCase().includes("leave")) {
          attendanceStatus = "Leave";
        }

        const checkInTime = convertTo24HourTime(record.check_in || record.check_in_time) || "09:00:00";
        const checkOutTime = convertTo24HourTime(record.check_out || record.check_out_time);

        const attPayload = {
          student_id: studentEmail,
          user_email: studentEmail,
          user_name: studentName,
          attendance_date: attDate,
          date: attDate,
          status: attendanceStatus,
          attendance_status: attendanceStatus,
          check_in: checkInTime,
          check_in_time: checkInTime,
          check_out: checkOutTime,
          check_out_time: checkOutTime,
          ip_address: record.ip_address || "127.0.0.1",
          public_ip: record.ip_address || "127.0.0.1"
        };

        // Check for existing record
        const { data: existingRows } = await supabase
          .from("attendance")
          .select("id")
          .or(`student_id.eq.${studentEmail},user_email.eq.${studentEmail}`)
          .eq("attendance_date", attDate)
          .limit(1);

        if (existingRows && existingRows.length > 0) {
          await supabase.from("attendance").update(attPayload).eq("id", existingRows[0].id);
        } else {
          await supabase.from("attendance").insert([attPayload]);
        }
        
        // Also update student attendance percentage
        try {
          const { data: studentData } = await supabase
            .from("students")
            .select("id, attendance")
            .eq("email", studentEmail)
            .limit(1);

          if (studentData && studentData[0]) {
            const { data: recentAttendance } = await supabase
              .from("attendance")
              .select("status")
              .or(`student_id.eq.${studentEmail},user_email.eq.${studentEmail}`)
              .gte("attendance_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);

            if (recentAttendance && recentAttendance.length > 0) {
              const presentCount = recentAttendance.filter(a => 
                (a.status || "").toLowerCase().includes("present") || 
                (a.status || "").toLowerCase().includes("on time") ||
                (a.status || "").toLowerCase().includes("leave")
              ).length;
              const newAttendanceRate = Math.round((presentCount / recentAttendance.length) * 100);

              await supabase
                .from("students")
                .update({ attendance: newAttendanceRate })
                .eq("id", studentData[0].id);
            }
          }
        } catch (e) {
          console.debug(`Could not update student attendance for ${studentEmail}:`, e);
        }

        return NextResponse.json({ success: true });
      }

      // 2.4 General Tables (Projects, Incomes, Expenses, etc.)
      const cleaned = {};
      const invalidColumns = [
        "cnic", "internship_mode", "resources_url", "screen_access_url",
        "start_date", "end_date", "daily_logs", "work_mode", "is_remote",
        "course_mode", "reminder_sent", "assigned_password", "enrollment_mode",
        "auth_user_id", "blood_group", "guardian_phone", "emergency_phone",
        "total_fee", "course_fee", "submitted_fee", "fee_paid", "remaining_fee"
      ];

      Object.keys(record).forEach((key) => {
        if (invalidColumns.includes(key)) return;
        const val = record[key];
        if (typeof val === "function" || typeof val === "symbol") return;
        if (val && typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) return;
        if (key === "id" && typeof val === "string" && isNaN(Number(val))) return;
        cleaned[key] = val;
      });

      const { error: insErr } = await supabase.from(table).insert([cleaned]).catch(() => ({}));
      if (insErr) {
        await supabase.from(table).upsert([cleaned]).catch(() => { });
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
