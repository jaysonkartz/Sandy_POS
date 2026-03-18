import { useState, useEffect, useCallback } from "react";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "@/app/lib/supabaseClient";

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
    async (nextSession: Session | null) => {
      setSession(nextSession);
      await fetchUserRole(nextSession?.user?.id);
    },
    [fetchUserRole]
  );

  const forceRefreshSession = useCallback(async () => {
    setIsLoading(true);

    try {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      await syncSessionState(currentSession);
    } finally {
      setIsLoading(false);
    }
  }, [syncSessionState]);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (!isMounted) return;
        await syncSessionState(initialSession);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, nextSession: Session | null) => {
      if (!isMounted) return;
      await syncSessionState(nextSession);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [syncSessionState]);

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
