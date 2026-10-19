import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { normalizeUsername, usernameToEmail } from "../utils/auth";

export async function register(username: string, password: string) {
  return supabase.auth.signUp({
    email: usernameToEmail(username),
    password,
    options: {
      data: {
        username: normalizeUsername(username),
      },
    },
  });
}

export async function login(username: string, password: string) {
  return supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });
}

export function getSession() {
  return supabase.auth.getSession();
}

export function onSessionChange(callback: (session: Session | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => data.subscription.unsubscribe();
}

export function logout() {
  return supabase.auth.signOut();
}
