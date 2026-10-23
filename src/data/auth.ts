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
