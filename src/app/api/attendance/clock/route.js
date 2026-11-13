import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/serverAuth";

export async function POST(request) {
  const context = await getRequestUser(request);
  if (context.error) return NextResponse.json({ error: context.error }, { status: context.status });

  try {
    const { action } = await request.json();
    if (!["check_in", "check_out"].includes(action)) {
      return NextResponse.json({ error: "Choose check_in or check_out." }, { status: 400 });
    }

    const { data, error } = await context.client.rpc("clock_attendance", { p_action: action });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data?.success || !data?.record) {
      return NextResponse.json({ error: data?.error || "The attendance action was not saved." }, { status: 409 });
    }

    return NextResponse.json({ success: true, record: data.record }, {
      headers: { "Cache-Control": "no-store, private" },
    });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Could not record attendance." }, { status: 400 });
  }
}
