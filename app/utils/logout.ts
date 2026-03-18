import { supabase } from "@/app/lib/supabaseClient";

/**
 * Standard logout flow for Supabase SSR cookie sessions.
 */
export const performLogout = async (): Promise<void> => {
  try {
    await supabase.auth.signOut({ scope: "global" });

    // Keep non-auth app cache cleanup only.
    const customerKeys = Object.keys(localStorage).filter((key) => key.startsWith("customer_data_"));
    customerKeys.forEach((key) => localStorage.removeItem(key));

    console.log("Logout completed successfully");
  } catch (error) {
    console.error("Error during logout:", error);
    throw error;
  }
};

/**
 * Logout with full-page redirect to ensure clean state
 */
export const performLogoutWithReload = async (redirectTo: string = "/"): Promise<void> => {
  await performLogout();
  window.location.replace(redirectTo);
};
