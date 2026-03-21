import { createBrowserClient } from "@supabase/ssr";

const getSupabaseUrl = (): string => (process.env.NEXT_PUBLIC_SUPABASE_URL || "") as string;
const getSupabaseAnonKey = (): string =>
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "") as string;

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();

const createSafeFetch = () => {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    try {
      return await fetch(input, init);
    } catch (error: unknown) {
      const errorStack = error instanceof Error ? error.stack || "" : "";
      const isExtensionError =
        errorStack.includes("chrome-extension://") ||
        errorStack.includes("moz-extension://") ||
        errorStack.includes("safari-extension://") ||
        errorStack.includes("extension://");

      if (isExtensionError) {
        console.warn(
          "⚠️ Browser extension may be interfering with network requests.",
          "The app will continue, but some operations may be limited.",
          "Consider disabling extensions that modify network requests."
        );
        return new Response(
          JSON.stringify({
            error: "extension_fetch_failed",
            message: "Fetch failed due to browser extension interference.",
          }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        );
      }

      throw error;
    }
  };
};

if (!supabaseUrl) {
  const error = "NEXT_PUBLIC_SUPABASE_URL is not set. Please check your environment variables.";
  if (typeof window === "undefined") {
    throw new Error(error);
  }
  console.error(error);
}

if (!supabaseAnonKey) {
  const error =
    "NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Please check your environment variables.";
  if (typeof window === "undefined") {
    throw new Error(error);
  }
  console.error(error);
}

export const supabase = createBrowserClient(supabaseUrl || "", supabaseAnonKey || "", {
  auth: {
    flowType: "pkce",
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: createSafeFetch(),
  },
  cookieOptions: {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  },
});

export const supabasePublic = createBrowserClient(supabaseUrl || "", supabaseAnonKey || "", {
  auth: {
    flowType: "pkce",
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  global: {
    fetch: createSafeFetch(),
  },
  cookieOptions: {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  },
});

export const isSupabaseConfigured = (): boolean => {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return !!(url && key && url.trim() && key.trim());
};
