import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { getSession, onSessionChange } from "./auth";

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  error: string;
  retry: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    let receivedEvent = false;

    const unsubscribe = onSessionChange((nextSession) => {
      if (!active) return;
      receivedEvent = true;
      setSession(nextSession);
      setError("");
      setLoading(false);
    });

    getSession()
      .then(({ data, error: sessionError }) => {
        if (!active || receivedEvent) return;
        if (sessionError) throw sessionError;
        setSession(data.session);
        setLoading(false);
      })
      .catch(() => {
        if (!active || receivedEvent) return;
        setError("Kunde inte kontrollera inloggningen. Försök igen.");
        setLoading(false);
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [attempt]);

  function retry() {
    setError("");
    setLoading(true);
    setAttempt((value) => value + 1);
  }

  return (
    <AuthContext.Provider value={{ session, loading, error, retry }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth måste användas inuti AuthProvider.");
  return auth;
}
