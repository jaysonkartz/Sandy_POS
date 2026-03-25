import { supabase } from "../lib/supabaseClient";
import { LOGOUT_TIMEOUT_MS, STORAGE_KEYS } from "../constants/app-constants";

const AUTH_STORAGE_PREFIXES = ["sb-", "supabase.auth", "customerToken"];

const hasAuthPrefix = (key: string): boolean =>
  AUTH_STORAGE_PREFIXES.some((prefix) => key === prefix || key.startsWith(prefix));

const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> => {
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
};

const clearClientAuthState = (): void => {
  const storageKeys = Object.keys(localStorage);
  storageKeys.forEach((key) => {
    if (hasAuthPrefix(key) || key.startsWith("customer_data_")) {
      localStorage.removeItem(key);
    }
  });

  localStorage.removeItem(STORAGE_KEYS.PENDING_ORDER);

  document.cookie
    .split(";")
    .map((cookie) => cookie.trim().split("=")[0])
    .filter(Boolean)
    .forEach((name) => {
      if (name.startsWith("sb-") || name.startsWith("supabase")) {
        document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      }
    });
};

export const performLogout = async (): Promise<void> => {
  const signOutErrors: unknown[] = [];

  try {
    await withTimeout(
      supabase.auth.signOut({ scope: "local" }),
      LOGOUT_TIMEOUT_MS,
      "local signOut"
    );
  } catch (error) {
    signOutErrors.push(error);
  }

  try {
    await withTimeout(
      supabase.auth.signOut({ scope: "global" }),
      LOGOUT_TIMEOUT_MS,
      "global signOut"
    );
  } catch (error) {
    signOutErrors.push(error);
  }

  try {
    await withTimeout(
      fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      }),
      LOGOUT_TIMEOUT_MS,
      "server logout"
    );
  } catch (error) {
    signOutErrors.push(error);
  }

  clearClientAuthState();

  if (signOutErrors.length > 0) {
    console.warn("Logout completed with recoverable errors:", signOutErrors);
  } else {
    console.warn("Logout completed successfully");
  }
};

export const performLogoutWithReload = async (redirectTo: string = "/"): Promise<void> => {
  await performLogout();
  window.location.replace(redirectTo);
};
