import { supabase } from "./supabase";

export async function login(email, password) {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user_role");
    localStorage.removeItem("current_user_email");
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