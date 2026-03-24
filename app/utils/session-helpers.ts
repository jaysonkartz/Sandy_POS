import { Session } from "@supabase/supabase-js";
import { supabase } from "@/app/lib/supabaseClient";
import { STORAGE_KEYS } from "@/app/constants/app-constants";

export interface RefreshTokenError {
  message?: string;
  code?: string;
}

export const isRefreshTokenError = (error: unknown): boolean => {
  if (!error) return false;

  const err = error as RefreshTokenError;
  const errorMessage = err?.message || "";
  const errorCode = err?.code || "";

  return (
    errorMessage.includes("Invalid Refresh Token") ||
    errorMessage.includes("Refresh Token Not Found") ||
    errorMessage.includes("refresh_token_not_found") ||
    errorCode === "refresh_token_not_found" ||
    errorMessage.includes("session_not_found") ||
    errorCode === "session_not_found"
  );
};

export const clearInvalidSession = (): void => {
  try {
    const keys = Object.keys(localStorage);
    const supabaseKeys = keys.filter(
      (key) => key.includes("supabase") || key.includes(STORAGE_KEYS.SUPABASE_PREFIX)
    );
    supabaseKeys.forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  } catch {
    void 0;
  }
};

export const refreshSession = async (): Promise<Session | null> => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession();

    if (isRefreshTokenError(error)) {
      return null;
    }

    if (!error && session) {
      return session;
    }

    return null;
  } catch (error) {
    if (isRefreshTokenError(error)) {
      return null;
    }
    return null;
  }
};

export const handleRefreshTokenError = (
  setSession: (session: Session | null) => void,
  setUserRole: (role: string) => void
): void => {
  clearInvalidSession();
  setSession(null);
  setUserRole("");
};

export const persistSession = (session: Session | null): void => {
  try {
    if (session?.user) {
      const sessionData = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        user: session.user,
        expires_at: session.expires_at,
      };
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessionData));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  } catch {
    void 0;
  }
};
