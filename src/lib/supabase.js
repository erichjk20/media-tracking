import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const PASSWORD_RESET_PENDING_KEY = "shelvd-password-reset-pending";
const authUrlAtLoad =
  typeof window === "undefined"
    ? ""
    : `${window.location.search}${window.location.hash}`;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const hasPasswordRecoveryRedirect =
  authUrlAtLoad.includes("auth_action=password-reset")
  || authUrlAtLoad.includes("type=recovery")
  || (
    authUrlAtLoad.includes("code=")
    && typeof window !== "undefined"
    && window.localStorage.getItem(PASSWORD_RESET_PENDING_KEY) === "true"
  );

function getAuthRedirectUrl(action) {
  const url = new URL(window.location.origin);
  url.searchParams.set("auth_action", action);
  return url.toString();
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function getCurrentSession() {
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function subscribeToAuthChanges(callback) {
  if (!supabase) return () => {};

  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session, event);
  });

  return () => data.subscription.unsubscribe();
}

export async function signInWithPassword(email, password) {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
}

export async function signUpWithPassword(email, password) {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });

  if (error) throw error;
  return data;
}

export async function sendPasswordReset(email) {
  if (!supabase) throw new Error("Supabase is not configured.");

  window.localStorage.setItem(PASSWORD_RESET_PENDING_KEY, "true");

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getAuthRedirectUrl("password-reset"),
  });

  if (error) {
    window.localStorage.removeItem(PASSWORD_RESET_PENDING_KEY);
    throw error;
  }
}

export async function updatePassword(password) {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
  window.localStorage.removeItem(PASSWORD_RESET_PENDING_KEY);
}

export async function signOut() {
  if (!supabase) return;

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function ensureUserProfile(user) {
  if (!supabase || !user) return null;

  const email = user.email || "";
  const displayName =
    user.user_metadata?.display_name
    || user.user_metadata?.full_name
    || email.split("@")[0]
    || "";

  const { data, error } = await supabase
    .from("user_profiles")
    .upsert(
      {
        id: user.id,
        email,
        display_name: displayName,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserProfileDisplayName(userId, displayName) {
  if (!supabase) throw new Error("Supabase is not configured.");
  if (!userId) throw new Error("Sign in before updating your profile.");

  const { data, error } = await supabase
    .from("user_profiles")
    .update({
      display_name: displayName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
