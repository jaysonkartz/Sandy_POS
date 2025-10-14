import { useState, useEffect, useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/app/lib/supabaseClient";
import { 
  SESSION_REFRESH_INTERVAL, 
  SESSION_CHECK_INTERVAL, 
  USER_ACTIVITY_TIMEOUT,
  SESSION_RETRY_DELAY,
  MAX_SESSION_RETRIES,
  LOADING_TIMEOUT,
  STORAGE_KEYS
} from "@/app/constants/app-constants";

interface UseSessionReturn {
  session: Session | null;
  userRole: string;
  isLoading: boolean;
  isSessionValid: boolean;
  forceRefreshSession: () => Promise<void>;
}

export const useSession = (): UseSessionReturn => {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to check if session is valid
  const isSessionValid = useCallback(() => {
    return !!(session && session.user && session.user.id && session.user.email);
  }, [session]);

  // Function to fetch user role
  const fetchUserRole = useCallback(async (userId: string) => {
    try {
      const { data: userData, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

      if (userData && !error) {
        setUserRole(userData.role);
      } else {
        setUserRole("");
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      setUserRole("");
    }
  }, []);

  // Function to fetch user role with retry
  const fetchUserRoleWithRetry = useCallback(async (userId: string, retries = MAX_SESSION_RETRIES) => {
    for (let i = 0; i < retries; i++) {
      try {
        const { data: userData, error } = await supabase
          .from("users")
          .select("role")
          .eq("id", userId)
          .single();

        if (userData && !error) {
          setUserRole(userData.role);
          return userData.role;
        } else if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, SESSION_RETRY_DELAY));
        }
      } catch (error) {
        console.error(`Attempt ${i + 1} error:`, error);
        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, SESSION_RETRY_DELAY));
        }
      }
    }
    setUserRole("");
    return null;
  }, []);

  // Aggressive session recovery function
  const aggressiveSessionRecovery = useCallback(async () => {
    // Method 1: Try refreshSession
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();

      if (error?.message?.includes("session_not_found") || error?.code === "session_not_found") {
        // Clear all invalid session data
        const keys = Object.keys(localStorage);
        const supabaseKeys = keys.filter((key) => 
          key.includes("supabase") || key.includes(STORAGE_KEYS.SUPABASE_PREFIX)
        );

        supabaseKeys.forEach((key) => localStorage.removeItem(key));
        localStorage.removeItem(STORAGE_KEYS.SESSION);

        setSession(null);
        setUserRole("");
        return false;
      }

      if (!error && session?.user) {
        setSession(session);
        if (session.user.id) {
          await fetchUserRole(session.user.id);
        }
        return true;
      }
    } catch (error) {
      // Session refresh failed
    }

    // Method 2: Check localStorage for stored session
    try {
      const keys = Object.keys(localStorage);
      const supabaseKeys = keys.filter((key) => 
        key.includes("supabase") || key.includes(STORAGE_KEYS.SUPABASE_PREFIX)
      );

      for (const key of supabaseKeys) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const parsed = JSON.parse(value);
            if (parsed?.user || parsed?.access_token) {
              if (parsed.access_token) {
                try {
                  const { data: { session: restoredSession }, error } = await supabase.auth.setSession({
                    access_token: parsed.access_token,
                    refresh_token: parsed.refresh_token || "",
                  });

                  if (error?.message?.includes("session_not_found") || error?.code === "session_not_found") {
                    localStorage.removeItem(key);
                    return false;
                  }

                  if (!error && restoredSession?.user) {
                    setSession(restoredSession);
                    if (restoredSession.user.id) {
                      await fetchUserRole(restoredSession.user.id);
                    }
                    return true;
                  }
                } catch (setSessionError) {
                  // Failed to set Supabase session
                }
              }

              if (parsed.user) {
                setSession(parsed);
                if (parsed.user.id) {
                  await fetchUserRole(parsed.user.id);
                }
                return true;
              }
            }
          }
        } catch (parseError) {
          // Failed to parse localStorage key
        }
      }
    } catch (error) {
      // Method 2 failed
    }

    return false;
  }, [fetchUserRole]);

  // Function to force refresh session and role
  const forceRefreshSession = useCallback(async () => {
    try {
      console.log("Force refreshing session");
      
      // Get current session
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Error getting session:", error);
        setSession(null);
        setUserRole("");
        return;
      }

      if (currentSession?.user) {
        console.log("Session found, updating state");
        setSession(currentSession);
        if (currentSession.user.id) {
          await fetchUserRole(currentSession.user.id);
        }
        return;
      }

      // No session found, try to refresh
      console.log("No session found, attempting refresh");
      try {
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();

        if (!refreshError && refreshedSession?.user) {
          console.log("Session refreshed successfully");
          setSession(refreshedSession);
          if (refreshedSession.user.id) {
            await fetchUserRole(refreshedSession.user.id);
          }
          return;
        }
      } catch (refreshError) {
        console.log("Session refresh failed:", refreshError);
      }

      // No session available
      console.log("No session available after refresh");
      setSession(null);
      setUserRole("");
    } catch (error) {
      console.error("Error in force refresh:", error);
      setSession(null);
      setUserRole("");
    }
  }, [fetchUserRole]);

  // Initialize session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        console.log("Starting session initialization");
        
        // Set a maximum timeout for session initialization
        const timeoutPromise = new Promise<void>((resolve) => {
          setTimeout(() => {
            console.log("Session initialization timeout reached");
            setIsLoading(false);
            resolve();
          }, 5000); // Increased to 5 second timeout
        });

        const sessionPromise = (async () => {
          // Try to get current session first (most reliable)
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) {
            console.error("Error getting initial session:", error);
            setIsLoading(false);
            return;
          }

          if (session?.user) {
            console.log("Session found, setting session and fetching role");
            setSession(session);
            if (session.user.id) {
              await fetchUserRole(session.user.id);
            }
            setIsLoading(false);
            return;
          }

          // If no session found, check for stored session
          const storedSession = localStorage.getItem(STORAGE_KEYS.SESSION);
          if (storedSession) {
            try {
              const parsed = JSON.parse(storedSession);
              if (parsed?.access_token && parsed?.user) {
                console.log("Attempting to restore stored session");
                const { data: { session: restoredSession }, error: restoreError } = await supabase.auth.setSession({
                  access_token: parsed.access_token,
                  refresh_token: parsed.refresh_token || "",
                });

                if (!restoreError && restoredSession?.user) {
                  console.log("Stored session restored successfully");
                  setSession(restoredSession);
                  if (restoredSession.user.id) {
                    await fetchUserRole(restoredSession.user.id);
                  }
                  setIsLoading(false);
                  return;
                } else {
                  console.log("Failed to restore stored session, clearing it");
                  localStorage.removeItem(STORAGE_KEYS.SESSION);
                }
              }
            } catch (parseError) {
              console.log("Failed to parse stored session:", parseError);
              localStorage.removeItem(STORAGE_KEYS.SESSION);
            }
          }

          // No session found anywhere
          console.log("No session found, setting loading to false");
          setSession(null);
          setUserRole("");
          setIsLoading(false);
        })();

        // Race between session initialization and timeout
        await Promise.race([sessionPromise, timeoutPromise]);
        setIsLoading(false);
      } catch (error) {
        console.error("Error in initializeSession:", error);
        setIsLoading(false);
      }
    };

    initializeSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);

      // Persist session to localStorage
      if (session?.user) {
        try {
          const sessionData = {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            user: session.user,
            expires_at: session.expires_at,
          };
          localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessionData));
        } catch (persistError) {
          console.error("Failed to persist session:", persistError);
        }
      } else {
        try {
          localStorage.removeItem(STORAGE_KEYS.SESSION);
        } catch (clearError) {
          console.error("Failed to clear persisted session:", clearError);
        }
      }

      if (session?.user?.id) {
        await fetchUserRole(session.user.id);
      } else {
        setUserRole("");
      }
    });

    return () => {
      clearTimeout(fallbackTimeout);
      subscription.unsubscribe();
    };
  }, [aggressiveSessionRecovery, fetchUserRole]);

  // Auto-refresh session
  useEffect(() => {
    if (!session?.user) return;

    const refreshInterval = setInterval(async () => {
      try {
        const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();

        if (error) {
          console.error("Error refreshing session:", error);
          return;
        }

        if (refreshedSession) {
          setSession(refreshedSession);
        }
      } catch (error) {
        console.error("Exception refreshing session:", error);
      }
    }, SESSION_REFRESH_INTERVAL);

    return () => clearInterval(refreshInterval);
  }, [session?.user]);

  // Session monitoring
  useEffect(() => {
    const sessionCheckInterval = setInterval(async () => {
      try {
        if (session?.user) {
          const { data: { session: currentSession }, error } = await supabase.auth.getSession();

          if (error || !currentSession?.user) {
            const recovered = await aggressiveSessionRecovery();
            if (!recovered) {
              setSession(null);
              setUserRole("");
            }
          } else {
            // Proactively refresh session
            try {
              const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
              if (!refreshError && refreshedSession) {
                setSession(refreshedSession);
              }
            } catch (refreshError) {
              // Proactive refresh failed
            }
          }
        } else {
          const recovered = await aggressiveSessionRecovery();
          // Session recovered during periodic check
        }
      } catch (error) {
        console.error("Error in periodic session check:", error);
      }
    }, SESSION_CHECK_INTERVAL);

    return () => clearInterval(sessionCheckInterval);
  }, [session?.user, aggressiveSessionRecovery]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        if (!session?.user) {
          await aggressiveSessionRecovery();
        } else {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (!currentSession?.user) {
            const recovered = await aggressiveSessionRecovery();
            if (!recovered) {
              setSession(null);
              setUserRole("");
            }
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [session?.user, aggressiveSessionRecovery]);

  // User activity detection
  useEffect(() => {
    let activityTimeout: ReturnType<typeof setTimeout> | undefined;

    const handleUserActivity = async () => {
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }

      activityTimeout = setTimeout(async () => {
        if (session?.user) {
          try {
            const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
            if (!error && refreshedSession) {
              setSession(refreshedSession);
            }
          } catch (error) {
            // Failed to refresh session on user activity
          }
        }
      }, USER_ACTIVITY_TIMEOUT);
    };

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"];
    events.forEach((event) => {
      document.addEventListener(event, handleUserActivity, true);
    });

    return () => {
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
      events.forEach((event) => {
        document.removeEventListener(event, handleUserActivity, true);
      });
    };
  }, [session?.user]);

  return {
    session,
    userRole,
    isLoading,
    isSessionValid: isSessionValid(),
    forceRefreshSession,
  };
};

