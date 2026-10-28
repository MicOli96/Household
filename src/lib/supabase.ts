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

/**
 * Den inloggade användaren. Läses från den sparade sessionen, så det blir
 * inget extra anrop till servern före varje fråga. Databasen kontrollerar
 * ändå själv vem som frågar. Felmeddelandet visas i appen när ingen är inloggad.
 */
export async function requireUser() {
  const { data, error } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (error || !user) throw new Error("Du måste vara inloggad. Öppna Logga in och försök igen.");
  return user;
}
