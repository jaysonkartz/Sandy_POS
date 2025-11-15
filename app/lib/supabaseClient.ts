// lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

// Read environment variables dynamically at runtime to handle hot reload and Turbopack edge cases
const getSupabaseUrl = (): string => {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL || "") as string;
};

const getSupabaseAnonKey = (): string => {
  return (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "") as string;
};

// Get values for module-level initialization
const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();

// Validate environment variables - throw error early if missing
if (!supabaseUrl) {
  const error = "❌ NEXT_PUBLIC_SUPABASE_URL is not set. Please check your environment variables.";
  console.error(error);
  if (typeof window === "undefined") {
    // In server-side context, throw immediately
    throw new Error(error);
  }
}

if (!supabaseAnonKey) {
  const error = "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Please check your environment variables.";
  console.error(error);
  if (typeof window === "undefined") {
    // In server-side context, throw immediately
    throw new Error(error);
  }
}

// Validate URL format if provided
if (supabaseUrl && typeof window !== "undefined") {
  try {
    new URL(supabaseUrl);
  } catch (e) {
    console.error("❌ NEXT_PUBLIC_SUPABASE_URL appears to be invalid. Expected a valid URL (e.g., https://your-project.supabase.co)");
  }
}

// Custom fetch with better error handling and retry logic
const createCustomFetch = () => {
  const MAX_RETRIES = 3;
  
  return async (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
    // Check environment variables dynamically at runtime (important for Turbopack/hot reload)
    const currentUrl = getSupabaseUrl();
    const currentKey = getSupabaseAnonKey();
    
    // Check if we have valid environment variables before making requests
    if (!currentUrl || !currentKey) {
      const error = new Error("Supabase environment variables are not configured");
      console.error("❌", error.message);
      console.error("Debug info:", {
        hasUrl: !!currentUrl,
        hasKey: !!currentKey,
        urlLength: currentUrl?.length || 0,
        keyLength: currentKey?.length || 0,
        envVarCheck: {
          "NEXT_PUBLIC_SUPABASE_URL": currentUrl ? "✅ Set" : "❌ Missing",
          "NEXT_PUBLIC_SUPABASE_ANON_KEY": currentKey ? "✅ Set" : "❌ Missing"
        }
      });
      throw error;
    }

    const urlString = typeof url === "string" ? url : url.toString();
    // Check if this is an auth/token refresh request
    const isAuthRequest = urlString.includes("/auth/v1/token") || 
                         urlString.includes("/auth/v1/refresh") ||
                         urlString.includes("/auth/v1/user");

    // Helper to safely extract error message
    const getErrorMessage = (error: any): string => {
      if (error instanceof Error) {
        return error.message;
      }
      if (typeof error === "string") {
        return error;
      }
      if (error?.message) {
        return String(error.message);
      }
      if (error?.toString) {
        return error.toString();
      }
      return "Unknown error";
    };

    // Only retry for network errors, not for auth errors (4xx)
    const isRetryableError = (error: any) => {
      if (!(error instanceof TypeError)) {
        return false;
      }
      const errorMessage = getErrorMessage(error).toLowerCase();
      return errorMessage === "failed to fetch" || 
             errorMessage.includes("network") ||
             errorMessage.includes("networkerror") ||
             errorMessage.includes("load failed");
    };

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        // Ensure API key header is always present using runtime environment variables
        // This is important because Supabase client might have been created before env vars were loaded
        const headers = new Headers(options?.headers);
        
        // Add apikey header if not already present (Supabase requires this)
        if (!headers.has("apikey") && currentKey) {
          headers.set("apikey", currentKey);
        }
        
        // Add authorization header if not present and we have a key
        if (!headers.has("Authorization") && currentKey) {
          headers.set("Authorization", `Bearer ${currentKey}`);
        }
        
        const response = await fetch(url, {
          ...options,
          headers: headers,
        });

        // Log non-ok responses for debugging but still return them
        if (!response.ok) {
          // Don't log 401/403 errors as they're expected in some cases
          if (response.status !== 401 && response.status !== 403) {
            console.warn(`Supabase request warning: ${response.status} ${response.statusText}`);
          }
        }

        return response;
      } catch (error: any) {
        const errorMessage = getErrorMessage(error);
        const isRetryable = isRetryableError(error);
        
        // Detect if error is from browser extension interference
        // Extensions can interfere with fetch, check stack trace and error context
        const errorStack = error?.stack || "";
        const errorString = String(error);
        const isExtensionError = errorStack.includes("chrome-extension://") || 
                                 errorStack.includes("moz-extension://") ||
                                 errorStack.includes("safari-extension://") ||
                                 errorStack.includes("extension://") ||
                                 // Sometimes the error message indicates extension origin
                                 (errorMessage === "Failed to fetch" && 
                                  typeof errorStack === "string" && 
                                  errorStack.length > 0 && 
                                  errorStack.includes("window.fetch"));
        
        // For auth requests with extension interference, be more lenient
        // Extension failures shouldn't break the app - the session can continue
        if (isAuthRequest && isExtensionError && attempt === MAX_RETRIES - 1) {
          console.warn(
            "⚠️ Browser extension may be interfering with Supabase auth requests.",
            "The app will continue, but token refresh may be limited.",
            "Consider disabling browser extensions that modify network requests."
          );
          // Instead of throwing, return a response that indicates failure
          // This allows the app to continue, though auth operations may be limited
          throw error;
        }
        
        // If this is the last attempt or error is not retryable, throw
        if (attempt === MAX_RETRIES - 1 || !isRetryable) {
          // Use console.warn instead of console.error for auth requests to avoid UI errors
          // Network failures during token refresh are often temporary and expected
          const logMethod = isAuthRequest ? console.warn : console.error;
          
          if (isRetryable) {
            const logMessage = isAuthRequest 
              ? `⚠️ Network issue connecting to Supabase (attempt ${attempt + 1}/${MAX_RETRIES}): ${errorMessage}`
              : `❌ Network error connecting to Supabase (attempt ${attempt + 1}/${MAX_RETRIES}): ${errorMessage}`;
            
            logMethod(logMessage);
            
            // Log extension-specific guidance if detected
            if (isExtensionError) {
              logMethod(
                "💡 This appears to be caused by a browser extension.",
                "Try disabling extensions that modify network requests or use an incognito window."
              );
            }
            
            // Only log detailed info if not an auth request (to reduce noise)
            if (!isAuthRequest) {
              logMethod("Details:", {
                errorType: error?.constructor?.name || typeof error,
                errorMessage,
                url: urlString,
                hasSupabaseUrl: !!supabaseUrl,
                isExtensionError,
                possibleCauses: [
                  isExtensionError && "Browser extension interfering with network requests",
                  "Network connectivity issue",
                  "CORS configuration problem",
                  "Firewall or proxy blocking the request",
                  "Supabase project URL incorrect",
                ].filter(Boolean),
              });
            } else if (attempt === MAX_RETRIES - 1) {
              // Only log details on final failure for auth requests
              console.info("Auth request failed after retries. This may be a temporary network issue.");
              if (isExtensionError) {
                console.info("💡 Browser extension detected - this may be causing the failure.");
              }
              console.info("Check:", {
                url: urlString.substring(0, 50) + "...", // Truncate to avoid exposing full URL
                hasSupabaseUrl: !!supabaseUrl,
                extensionInterference: isExtensionError,
              });
            }
          }
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // This should never be reached, but TypeScript needs it
    throw new Error("Unexpected error in customFetch");
  };
};

const customFetch = createCustomFetch();

// Create Supabase client
// Note: Supabase client automatically adds the apikey header based on the anon key passed to createClient
// If env vars are missing, Supabase won't be able to add the key, causing "No API key found" errors
// The customFetch function will validate env vars before making requests and provide better error messages
export const supabase = createClient(
  supabaseUrl || "", 
  supabaseAnonKey || "", 
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
    global: {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      fetch: customFetch,
    },
  }
);

// Export a helper to check if Supabase is properly configured
// This reads environment variables dynamically at runtime
export const isSupabaseConfigured = (): boolean => {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  const isConfigured = !!(url && key && url.trim() && key.trim());
  
  // Debug logging in development
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development" && !isConfigured) {
    console.warn("⚠️ Supabase configuration check failed:", {
      hasUrl: !!url,
      hasKey: !!key,
      urlLength: url?.length || 0,
      keyLength: key?.length || 0,
      urlValue: url ? `${url.substring(0, 30)}...` : "empty",
    });
  }
  
  return isConfigured;
};
