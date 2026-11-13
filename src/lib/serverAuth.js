import { createClient } from "@supabase/supabase-js";
import { supabaseUrl, supabasePublishableKey } from "@/lib/supabaseConfig";

export async function getRequestUser(request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return { error: "Sign in to continue.", status: 401 };

  const client = createClient(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user } = {}, error } = await client.auth.getUser(token);
  if (error || !user) return { error: "Your session is invalid or has expired. Sign in again.", status: 401 };

  const { data: profile, error: profileError } = await client
    .from("user_profiles")
    .select("id, role, status, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) return { error: "Your account profile is not ready. Contact the portal administrator.", status: 403 };
  if (profile.status !== "active" || profile.role === "pending") {
    return { error: "Your account is waiting for administrator approval.", status: 403 };
  }

  return { client, user, profile, role: profile.role };
}

export function isPortalAdmin(role) {
  return ["admin", "manager", "hr"].includes(role);
}
