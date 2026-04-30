import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthCtx = {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

async function checkAdmin(accessToken?: string) {
  if (!accessToken) return false;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const res = await fetch("/api/admin-check", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const body = (await res.json().catch(() => null)) as { ok?: boolean } | null;

      if (res.ok && body?.ok === true) return true;
      if (res.status === 403) return false;
    } catch {
      // Retry transient network/backend warm-up failures before marking the user unauthorized.
    }

    await new Promise((resolve) => window.setTimeout(resolve, 350 * (attempt + 1)));
  }

  return false;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let seq = 0;

    const applySession = async (nextSession: Session | null) => {
      const ticket = ++seq;
      setSession(nextSession);
      if (!nextSession?.user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const admin = await checkAdmin(nextSession.access_token);
      if (!cancelled && ticket === seq) {
        setIsAdmin(admin);
        setLoading(false);
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setLoading(true);
      void applySession(s);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      void applySession(data.session);
    }).catch(() => {
      if (cancelled) return;
      setSession(null);
      setIsAdmin(false);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value: AuthCtx = {
    session,
    user: session?.user ?? null,
    isAdmin,
    loading,
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message };
    },
    signUp: async (email, password) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      return { error: error?.message };
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
