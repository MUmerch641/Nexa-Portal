import { authenticatedFetch } from "@/lib/authenticatedFetch";

export async function clockAttendance(action) {
  const response = await authenticatedFetch("/api/attendance/clock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success || !result.record) {
    throw new Error(result.error || "The attendance action was not confirmed by the server.");
  }
  return result.record;
}
