import "react-native-url-polyfill/auto";
import "@/lib/localStorage";
import { createClient } from "@supabase/supabase-js";

// Adressen och nyckeln kommer från .env i projektets rot.

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(
    "EXPO_PUBLIC_SUPABASE_URL och EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY saknas i .env.",
  );
}

export const supabase = createClient(url, key, {
  auth: {
    // Webbexporten förbereder sidorna i Node, där localStorage saknas.
    storage: typeof localStorage !== "undefined" ? localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/** Felmeddelandet är skrivet för att visas i appen när ingen är inloggad. */
export async function requireUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Du måste vara inloggad. Öppna Logga in och försök igen.");
  return data.user;
}
