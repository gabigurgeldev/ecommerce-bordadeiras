"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Role } from "@prisma/client";
import { createClient } from "@/lib/supabase/client";

export type ClientSessionUser = {
  id: string;
  email: string;
  name?: string | null;
  role?: Role;
};

type SessionContextValue = {
  user: ClientSessionUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue>({
  user: null,
  loading: true,
  refresh: async () => {},
});

export function useAppSession() {
  return useContext(SessionContext);
}

/** @deprecated Prefer `useAppSession`. */
export function useSession() {
  const { user, loading } = useAppSession();
  return {
    data: user ? { user } : null,
    status: loading ? "loading" : user ? "authenticated" : "unauthenticated",
  } as const;
}

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ClientSessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser?.email) {
        setUser(null);
        return;
      }
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = (await res.json()) as ClientSessionUser;
        setUser(data);
      } else {
        setUser({
          id: authUser.id,
          email: authUser.email,
          name:
            typeof authUser.user_metadata?.name === "string"
              ? authUser.user_metadata.name
              : null,
        });
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    void (async () => {
      await refresh();
      if (mounted) setLoading(false);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [refresh]);

  const value = useMemo(
    () => ({ user, loading, refresh }),
    [user, loading, refresh],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
