import type { Session } from "@supabase/supabase-js";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { queryClient } from "../lib/queryClient";
import { supabase } from "../lib/supabase";

// Den inloggade användaren för hela appen (#75). _layout.tsx använder den
// för att välja vilka skärmar som går att öppna.

type AuthSessionValue = {
  /** undefined medan sessionen läses in, null när ingen är inloggad. */
  session: Session | null | undefined;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    // Anropas direkt med den sparade sessionen och sedan vid varje in- och utloggning.
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      // Nästa användare på samma telefon ska inte se den förras data.
      if (event === "SIGNED_OUT") queryClient.clear();
      setSession(next);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function signOut() {
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
