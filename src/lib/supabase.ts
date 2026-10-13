import "react-native-url-polyfill/auto";
import "expo-sqlite/localStorage/install";
import { createClient } from "@supabase/supabase-js";

// Klienten som appen använder för att prata med Supabase (databas, inloggning och filer).
// Adressen och nyckeln hämtas från .env.local, se .env.example.

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(
    "EXPO_PUBLIC_SUPABASE_URL och EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY saknas. Kopiera .env.example till .env.local och fyll i värdena.",
  );
}

export const supabase = createClient(url, key, {
  auth: {
    // Sparar inloggningen i telefonen så att man förblir inloggad mellan starter.
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
