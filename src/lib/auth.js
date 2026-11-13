import { supabase } from "./supabase";

export function clearLegacyCredentialCache() {
  if (typeof window === "undefined") return;
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("user_password_")) localStorage.removeItem(key);
    }
    localStorage.removeItem("registered_system_users");
    localStorage.removeItem("registered_accounts");
    for (const key of ["persistent_employees", "persistent_courses", "persistent_interns"]) {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      if (!Array.isArray(value)) continue;
      const sanitized = value.map((record) => {
        const safe = { ...record };
        for (const field of ["password", "password_hash", "assigned_password", "confirm_password"]) delete safe[field];
        if (typeof safe.user_id === "string" && safe.user_id.startsWith("auth:")) delete safe.user_id;
        if (typeof safe.emergency_contact === "string" && safe.emergency_contact.startsWith("auth:")) delete safe.emergency_contact;
        return safe;
      });
      localStorage.setItem(key, JSON.stringify(sanitized));
    }
  } catch (error) {
    // Invalid legacy cache entries are ignored and never used for authentication.
  }
}

export async function login(email, password) {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function logout() {
  if (typeof window !== "undefined") {
    clearLegacyCredentialCache();
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user_role");
    localStorage.removeItem("current_user_email");
    localStorage.removeItem("current_user_name");
  }
  try {
    return await supabase.auth.signOut();
  } catch(e) {}
}

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}
