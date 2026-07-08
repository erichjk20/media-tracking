import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

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

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => data.subscription.unsubscribe();
}

export async function sendMagicLink(email) {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });

  if (error) throw error;
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
