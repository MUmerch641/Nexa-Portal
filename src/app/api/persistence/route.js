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
    const table = searchParams.get("table");
    if (!table) {
      return NextResponse.json({ error: "Table name required" }, { status: 400 });
    }

    const { data, error } = await supabase.from(table).select("*");
    if (error) {
      return NextResponse.json({ error: error.message, data: [] }, { status: 200 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (e) {
    return NextResponse.json({ error: e.message, data: [] }, { status: 200 });
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
      const { id } = record || {};
      if (!id) return NextResponse.json({ error: "ID required for deletion" }, { status: 400 });
      await supabase.from(table).delete().eq("id", id);
      return NextResponse.json({ success: true });
    }

    if (record) {
      // Clean non-numeric string IDs before DB insert
      const cleaned = {};
      Object.keys(record).forEach((key) => {
        const val = record[key];
        if (typeof val === "function" || typeof val === "symbol") return;
        if (val && typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) return;
        if (key === "id" && typeof val === "string" && isNaN(Number(val))) return;
        cleaned[key] = val;
      });

      const { error: insErr } = await supabase.from(table).insert([cleaned]);
      if (insErr) {
        await supabase.from(table).upsert([cleaned]).catch(() => {});
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
