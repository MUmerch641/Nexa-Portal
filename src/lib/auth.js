import { supabase } from "./supabase";

/**
 * Sign in user using Supabase Auth (Single Source of Truth).
 * Does not query users table directly for plain-text passwords.
 */
export async function login(email, password) {
  const cleanEmail = (email || "").trim().toLowerCase();
  return await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password: password,
  });
}

/**
 * Sign out user from Supabase and clear local session state.
 */
export async function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user_role");
    localStorage.removeItem("current_user_email");
    localStorage.removeItem("current_user_name");
    localStorage.removeItem("current_user_id");
    localStorage.removeItem("supabase_auth_token");
    window.dispatchEvent(new Event("roleChanged"));
  }
  try {
    return await supabase.auth.signOut();
  } catch (e) {
    console.warn("SignOut warning:", e);
  }
}

/**
 * Get current active Supabase Auth user.
 */
export async function getCurrentUser() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user || null;
  } catch (e) {
    return null;
  }
}

/**
 * Get current active Supabase Auth session.
 */
export async function getAuthSession() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session || null;
  } catch (e) {
    return null;
  }
}

/**
 * Resolves user role, full name, and profile data from Supabase Auth & Database Tables.
 * Priority order:
 * 1. Supabase Auth User Metadata (role, full_name)
 * 2. Supabase `profiles` table (matched by user.id)
 * 3. Supabase `employees` table (matched by auth_user_id or email)
 * 4. Supabase `students` table (matched by auth_user_id or email)
 * 5. Supabase `interns` table (matched by email)
 */
export async function resolveUserRoleAndProfile(user) {
  if (!user) return { role: "admin", fullName: "", email: "" };

  const userId = user.id;
  const userEmail = (user.email || "").trim().toLowerCase();

  let detectedRole = (user.user_metadata?.role || user.app_metadata?.role || "").toLowerCase().trim();
  let detectedName = user.user_metadata?.full_name || user.user_metadata?.name || "";
  let isRemote = false;

  // 1. Check profiles table by UUID
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profile) {
      if (profile.role) detectedRole = profile.role.toLowerCase().trim();
      if (profile.full_name) detectedName = profile.full_name;
    }
  } catch (e) {}

  // 2. Check employees table
  if (!detectedRole || detectedRole === "authenticated") {
    try {
      // Search by auth_user_id or email
      let empQuery = await supabase
        .from("employees")
        .select("*")
        .eq("auth_user_id", userId)
        .maybeSingle();

      if (!empQuery.data && userEmail) {
        empQuery = await supabase
          .from("employees")
          .select("*")
          .ilike("email", userEmail)
          .maybeSingle();
      }

      if (empQuery.data) {
        detectedRole = (empQuery.data.role || "employee").toLowerCase().trim();
        detectedName = detectedName || empQuery.data.full_name || empQuery.data.name || "";
        isRemote = (
          empQuery.data.is_remote === true ||
          (empQuery.data.work_mode && String(empQuery.data.work_mode).toLowerCase().includes("remote"))
        );
      }
    } catch (e) {}
  }

  // 3. Check students table
  if (!detectedRole || detectedRole === "authenticated") {
    try {
      let stuQuery = await supabase
        .from("students")
        .select("*")
        .eq("auth_user_id", userId)
        .maybeSingle();

      if (!stuQuery.data && userEmail) {
        stuQuery = await supabase
          .from("students")
          .select("*")
          .ilike("email", userEmail)
          .maybeSingle();
      }

      if (stuQuery.data) {
        detectedRole = "student";
        detectedName = detectedName || stuQuery.data.full_name || stuQuery.data.student_name || "";
      }
    } catch (e) {}
  }

  // 4. Check interns table
  if (!detectedRole || detectedRole === "authenticated") {
    try {
      if (userEmail) {
        const { data: intern } = await supabase
          .from("interns")
          .select("*")
          .ilike("email", userEmail)
          .maybeSingle();

        if (intern) {
          detectedRole = "intern";
          detectedName = detectedName || intern.full_name || intern.name || "";
        }
      }
    } catch (e) {}
  }

  // 5. Default fallback based on standard rules
  if (!detectedRole || detectedRole === "authenticated") {
    if (userEmail.includes("admin")) {
      detectedRole = "admin";
    } else if (userEmail.includes("student")) {
      detectedRole = "student";
    } else if (userEmail.includes("client")) {
      detectedRole = "client";
    } else if (userEmail.includes("intern")) {
      detectedRole = "intern";
    } else {
      detectedRole = "employee";
    }
  }

  if (!detectedName) {
    detectedName = userEmail.split("@")[0].replace(/[._-]+/g, " ");
  }

  return {
    userId,
    email: userEmail,
    role: detectedRole,
    fullName: detectedName,
    isRemote,
  };
}
