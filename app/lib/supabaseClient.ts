import { createBrowserClient } from "@supabase/ssr";

const getSupabaseUrl = (): string => (process.env.NEXT_PUBLIC_SUPABASE_URL || "") as string;
const getSupabaseAnonKey = (): string => (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "") as string;

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();

if (!supabaseUrl) {
  const error = "NEXT_PUBLIC_SUPABASE_URL is not set. Please check your environment variables.";
  if (typeof window === "undefined") {
    throw new Error(error);
  }
  console.error(error);
}

if (!supabaseAnonKey) {
  const error = "NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Please check your environment variables.";
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
