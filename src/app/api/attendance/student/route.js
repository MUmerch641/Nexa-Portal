import { NextResponse } from "next/server";
import { getRequestUser, isPortalAdmin } from "@/lib/serverAuth";

function to24Hour(value) {
  if (!value || value === "--:--" || String(value).includes("Not Checked Out")) return null;
  const text = String(value).trim();
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(text)) return text.length === 5 ? `${text}:00` : text;
  const match = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  if (match[4].toUpperCase() === "PM" && hours < 12) hours += 12;
  if (match[4].toUpperCase() === "AM" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${match[2]}:${match[3] || "00"}`;
}

function to12Hour(value) {
  if (!value) return "Not Checked Out";
  const [hourText, minute] = String(value).split(":");
  const hour = Number(hourText);
  if (!Number.isFinite(hour) || !minute) return String(value);
  return `${String(hour % 12 || 12).padStart(2, "0")}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
}

function normalizeStatus(value) {
  const status = String(value || "Present").toLowerCase();
  if (status.includes("absent")) return "Absent";
  if (status.includes("late")) return "Late";
  if (status.includes("leave")) return "Leave";
  return "Present";
}

async function readAttendance(context) {
  const { data, error } = await context.client.from("app_records")
    .select("id, payload")
    .eq("module", "attendance")
    .limit(2000);
  if (error) throw error;
  return data || [];
}

export async function GET(request) {
  const context = await getRequestUser(request);
  if (context.error) return NextResponse.json({ error: context.error }, { status: context.status });
  try {
    const params = new URL(request.url).searchParams;
    const targetDate = params.get("date");
    const startDate = params.get("from");
    const endDate = params.get("to");
    const targetStudent = String(params.get("studentId") || "").toLowerCase();
    const limit = Math.max(1, Math.min(Number.parseInt(params.get("limit") || "30", 10) || 30, 500));
    if ((startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) || (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate))) {
      return NextResponse.json({ error: "Attendance date range must use YYYY-MM-DD." }, { status: 400 });
    }
    const rows = (await readAttendance(context)).map(({ payload }) => payload || {})
      .filter((item) => !targetDate || String(item.attendance_date || item.date || "") === targetDate)
      .filter((item) => !startDate || String(item.attendance_date || item.date || "") >= startDate)
      .filter((item) => !endDate || String(item.attendance_date || item.date || "") <= endDate)
      .filter((item) => !targetStudent || [item.student_id, item.user_email, item.user_id, item.email].some((value) => String(value || "").toLowerCase() === targetStudent))
      .sort((a, b) => String(b.created_at || b.timestamp || "").localeCompare(String(a.created_at || a.timestamp || "")))
      .slice(0, limit)
      .map((item) => ({
        id: item.id,
        student_id: item.student_id || item.user_email || item.user_id || item.email || "",
        student_name: item.student_name || item.user_name || item.name || "",
        date: item.attendance_date || item.date || "",
        status: normalizeStatus(item.attendance_status || item.status),
        check_in: item.check_in_time ? to12Hour(item.check_in_time) : item.check_in ? to12Hour(item.check_in) : "--:--",
        check_out: item.check_out_time ? to12Hour(item.check_out_time) : item.check_out ? to12Hour(item.check_out) : "Not Checked Out",
        ip_address: item.ip_address || item.public_ip || "",
        created_at: item.created_at || item.timestamp || "",
      }));
    return NextResponse.json({ success: true, data: rows }, { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Could not load attendance." }, { status: 400 });
  }
}

export async function POST(request) {
  const context = await getRequestUser(request);
  if (context.error) return NextResponse.json({ error: context.error }, { status: context.status });
  try {
    const body = await request.json();
    if (!['save', 'bulk_save', 'delete'].includes(body.action)) return NextResponse.json({ error: "Unsupported attendance action." }, { status: 400 });
    const admin = isPortalAdmin(context.role);
    if (!admin) {
      return NextResponse.json({ error: "Attendance corrections are restricted to administrators. Use the live attendance clock for check-in and check-out." }, { status: 403 });
    }
    const userEmail = String(context.user.email || "").trim().toLowerCase();

    if (body.action === "delete") {
      const record = body.records || {};
      const rows = await readAttendance(context);
      const targetId = record.id ? String(record.id) : "";
      const targetEmail = String(record.studentId || record.student_id || userEmail).trim().toLowerCase();
      const targetDate = String(record.date || body.date || "");
      const ids = rows.filter(({ payload = {} }) => {
        if (targetId) return String(payload.id) === targetId;
        const matchesOwner = [payload.student_id, payload.user_email, payload.user_id, payload.email].some((value) => String(value || "").toLowerCase() === targetEmail);
        return matchesOwner && (!targetDate || String(payload.attendance_date || payload.date || "") === targetDate);
      }).map(({ id }) => id);
      if (!admin && targetEmail !== userEmail) return NextResponse.json({ error: "You can only delete your own attendance." }, { status: 403 });
      if (ids.length) {
        const { error } = await context.client.from("app_records").delete().in("id", ids);
        if (error) return NextResponse.json({ error: error.message }, { status: 403 });
      }
      return NextResponse.json({ success: true, deleted: ids.length > 0, count: ids.length });
    }

    const records = Array.isArray(body.records) ? body.records : body.records ? [body.records] : [];
    if (!records.length || records.length > 200) return NextResponse.json({ error: "Send between 1 and 200 attendance rows." }, { status: 400 });
    const rows = records.map((record) => {
      const email = admin
        ? String(record.student_id || record.user_email || record.user_id || record.email || userEmail).trim().toLowerCase()
        : userEmail;
      const date = String(record.date || record.attendance_date || body.date || new Date().toISOString().slice(0, 10));
      const status = normalizeStatus(record.status || record.attendance_status);
      const id = record.id || `attendance:${email}:${date}`;
      const checkIn = to24Hour(record.check_in || record.check_in_time) || "--:--";
      const checkOut = to24Hour(record.check_out || record.check_out_time);
      const payload = {
        id: String(id), student_id: email, user_email: email, user_name: admin
          ? String(record.student_name || record.user_name || record.name || email.split("@")[0])
          : String(record.student_name || context.profile.full_name || email.split("@")[0]),
        attendance_date: date, date, status, attendance_status: status,
        check_in: checkIn, check_in_time: checkIn, check_out: checkOut, check_out_time: checkOut,
        ip_address: admin ? String(record.ip_address || record.public_ip || "") : "",
        updated_at: new Date().toISOString(),
      };
      return { module: "attendance", record_key: payload.id, payload, created_by: context.user.id };
    });

    const { data, error } = await context.client.from("app_records")
      .upsert(rows, { onConflict: "module,record_key" })
      .select("payload");
    if (error) return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ success: true, saved: data?.length || 0, records: (data || []).map((row) => row.payload) });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Could not save attendance." }, { status: 400 });
  }
}
