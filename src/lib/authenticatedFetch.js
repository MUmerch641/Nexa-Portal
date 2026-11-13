import { supabase } from "@/lib/supabase";

export async function authenticatedFetch(input, init = {}) {
  const { data: { session } = {} } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Sign in to continue.");
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${session.access_token}`);
  return fetch(input, { ...init, headers, cache: init.cache || "no-store" });
}
