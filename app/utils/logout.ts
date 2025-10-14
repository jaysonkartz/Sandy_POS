import { supabase } from "@/app/lib/supabaseClient";

/**
 * Comprehensive logout function that clears all session data
 * This prevents the aggressive session recovery from logging users back in after logout
 */
export const performLogout = async (): Promise<void> => {
  try {
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear all session-related localStorage data
    const keys = Object.keys(localStorage);
    const supabaseKeys = keys.filter((key) => 
      key.includes("supabase") || key.includes("sb-") || key === "sandy_pos_session"
    );
    
    supabaseKeys.forEach((key) => localStorage.removeItem(key));
    
    // Clear any customer-related cache
    const customerKeys = keys.filter((key) => key.startsWith("customer_data_"));
    customerKeys.forEach((key) => localStorage.removeItem(key));
    
    console.log("Logout completed successfully");
  } catch (error) {
    console.error("Error during logout:", error);
    throw error;
  }
};

/**
 * Logout with page reload to ensure clean state
 */
export const performLogoutWithReload = async (): Promise<void> => {
  await performLogout();
  window.location.reload();
};
