import type { Session } from "@supabase/supabase-js";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

// Den inloggade användaren för hela appen (#75). Sessionen läses från
// telefonen när appen startar och uppdateras när man loggar in eller ut,
// så att _layout.tsx kan välja vilka skärmar som går att öppna.

type AuthSessionValue = {
  /** undefined medan sessionen läses in, null när ingen är inloggad. */
  session: Session | null | undefined;
  /** Om sessionen fortfarande läses in när appen startar. */
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let current = true;

    import("../lib/supabase")
      .then(({ supabase }) => {
        if (!current) return;
        // Anropas direkt med den sparade sessionen och sedan vid varje in- och utloggning.
        const { data } = supabase.auth.onAuthStateChange((_event, next) => {
          if (current) setSession(next);
        });
        unsubscribe = () => data.subscription.unsubscribe();
      })
      // Saknas .env.local går det inte att logga in, då visas inloggningen.
      .catch(() => { if (current) setSession(null); });

    return () => {
      current = false;
      unsubscribe?.();
    };
  }, []);

  async function signOut() {
    const { supabase } = await import("../lib/supabase");
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  return (
    <AuthSessionContext.Provider value={{ session, loading: session === undefined, signOut }}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const value = useContext(AuthSessionContext);
  if (!value) throw new Error("useAuthSession must be used inside AuthSessionProvider");
  return value;
}
