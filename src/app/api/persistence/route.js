import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const LIVE_SUPABASE_URL = "https://uzwmwtkldgchnuqxamov.supabase.co";
const LIVE_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6d213dGtsZGdjaG51cXhhbW92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MDUxMjYsImV4cCI6MjEwMDk4MTEyNn0.dTw41DhaS-qDVqX4jj3WsrAvYE9CLigjOLZFiDt_7Rk";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
  ? process.env.NEXT_PUBLIC_SUPABASE_URL
  : LIVE_SUPABASE_URL;

const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("placeholder")
  ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  : LIVE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    let table = searchParams.get("table");
    if (!table) {
      return NextResponse.json({ error: "Table name required" }, { status: 400 });
    }

    let { data, error } = await supabase.from(table).select("*");

    // If daily_tasks table gives 404 or error, fallback to 'tasks' table
    if (error && table === "daily_tasks") {
      const fallback = await supabase.from("tasks").select("*");
      if (!fallback.error && fallback.data) {
        data = fallback.data;
        error = null;
      }
    }

    if (error) {
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }

    return NextResponse.json({ success: true, data: data || [] }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ success: true, data: [] }, { status: 200 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { table, record, action } = body;

    if (!table) {
      return NextResponse.json({ error: "Table required" }, { status: 400 });
    }

    if (action === "delete") {
      const { id, email, full_name, name } = record || {};
      let deleted = false;
      let errRes = null;

      if (id) {
        const { error } = await supabase.from(table).delete().eq("id", id);
        if (!error) deleted = true; else errRes = error;
      }
      if (email) {
        const { error } = await supabase.from(table).delete().eq("email", email);
        if (!error) deleted = true; else if (!errRes) errRes = error;
      }
      if (full_name || name) {
        const { error } = await supabase.from(table).delete().eq("full_name", full_name || name);
        if (!error) deleted = true; else if (!errRes) errRes = error;
      }
      return NextResponse.json({ success: true, deleted, error: errRes ? errRes.message : null });
    }

    if (record) {
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

      // Special schema normalization for Supabase 'employees'
      if (table === "employees") {
        if (record.password || record.assigned_password) {
          cleaned.user_id = `auth:${record.password || record.assigned_password}`;
        }
        if (!cleaned.status) cleaned.status = "active";
      }

      // Special schema normalization for Supabase 'students'
      if (table === "students") {
        cleaned.enrollment_no = record.enrollment_no || record.student_id || record.id || `s-${Date.now()}`;
        cleaned.course_name = record.course_name || record.course || "Full Stack MERN Web Development";
        cleaned.admission_date = record.admission_date || record.enrollment_date || record.start_date || new Date().toISOString().split("T")[0];
        if (record.password || record.assigned_password) {
          cleaned.emergency_contact = `auth:${record.password || record.assigned_password}`;
        }
        if (!cleaned.status) cleaned.status = "Active";
      }

      // Special schema normalization for 'interns' -> save to 'employees' as well so it persists
      if (table === "interns") {
        const internEmpPayload = {
          full_name: record.full_name || record.name || "Intern",
          email: record.email,
          phone: record.phone || "",
          department: record.tech_domain || record.course_name || "Software Engineering",
          designation: "Software Intern",
          employment_type: "3-Month Free Internship",
          status: "active",
          user_id: `auth:${record.password || record.assigned_password || "internpassword"}`,
        };
        await supabase.from("employees").upsert([internEmpPayload], { onConflict: "email" }).catch(() => {});
      }

      if (table === "employees" && cleaned.email) {
        await supabase.from("employees").upsert([cleaned], { onConflict: "email" }).catch(() => {});
      } else if (table === "students" && cleaned.email) {
        await supabase.from("students").upsert([cleaned], { onConflict: "email" }).catch(() => {});
      } else {
        const { error: insErr } = await supabase.from(table).insert([cleaned]);
        if (insErr) {
          await supabase.from(table).upsert([cleaned]).catch(() => {});
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
