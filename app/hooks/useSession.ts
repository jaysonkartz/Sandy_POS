import { useState, useEffect, useCallback } from "react";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "@/app/lib/supabaseClient";
import { SESSION_TIMEOUT_MS } from "../constants/app-constants";

interface UseSessionReturn {
  session: Session | null;
  userRole: string;
  isLoading: boolean;
  isSessionValid: boolean;
  forceRefreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useSession = (): UseSessionReturn => {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const withTimeout = useCallback(
    async <T,>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
      let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      });

      try {
        return await Promise.race([promise, timeoutPromise]);
      } finally {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
      }
    },
    []
  );

  const fetchUserRole = useCallback(async (userId?: string) => {
    if (!userId) {
      setUserRole("");
      return;
    }

    try {
      const { data: userData, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

      if (!error && userData?.role) {
        setUserRole(userData.role);
        return;
      }

      setUserRole("");
    } catch {
      setUserRole("");
    }
  }, []);

  const syncSessionState = useCallback(
    (nextSession: Session | null) => {
      setSession(nextSession);
      void fetchUserRole(nextSession?.user?.id);
    },
    [fetchUserRole]
  );

  const forceRefreshSession = useCallback(async () => {
    setIsLoading(true);

    try {
      const {
        data: { session: currentSession },
      } = await withTimeout(
        supabase.auth.getSession(),
        SESSION_TIMEOUT_MS,
        "getSession(forceRefresh)"
      );

      syncSessionState(currentSession);
    } finally {
      setIsLoading(false);
    }
  }, [syncSessionState, withTimeout]);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await withTimeout(supabase.auth.getSession(), SESSION_TIMEOUT_MS, "getSession(init)");

        if (!isMounted) return;
        syncSessionState(initialSession);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, nextSession: Session | null) => {
      if (!isMounted) return;
      syncSessionState(nextSession);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [syncSessionState, withTimeout]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setSession(null);
      setUserRole("");
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  }, []);

  return {
    session,
    userRole,
    isLoading,
    isSessionValid: !!(session?.user?.id && session?.user?.email),
    forceRefreshSession,
    signOut,
  };
};
