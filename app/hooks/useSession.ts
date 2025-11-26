import { useState, useEffect, useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/app/lib/supabaseClient";
import {
  SESSION_REFRESH_INTERVAL,
  SESSION_CHECK_INTERVAL,
  USER_ACTIVITY_TIMEOUT,
  STORAGE_KEYS,
} from "@/app/constants/app-constants";
import {
  isRefreshTokenError,
  clearInvalidSession,
  refreshSession,
  handleRefreshTokenError,
  persistSession,
} from "@/app/utils/session-helpers";

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

  // Aggressive session recovery function
  const aggressiveSessionRecovery = useCallback(async () => {
    // Method 1: Try refreshSession
    const refreshedSession = await refreshSession();
    
    if (!refreshedSession) {
      // Check if it was a refresh token error
      handleRefreshTokenError(setSession, setUserRole);
      return false;
    }

    if (refreshedSession?.user) {
      setSession(refreshedSession);
      if (refreshedSession.user.id) {
        await fetchUserRole(refreshedSession.user.id);
      }
      return true;
    }

    // Method 2: Check localStorage for stored session
    try {
      const keys = Object.keys(localStorage);
      const supabaseKeys = keys.filter(
        (key) => key.includes("supabase") || key.includes(STORAGE_KEYS.SUPABASE_PREFIX)
      );

      for (const key of supabaseKeys) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const parsed = JSON.parse(value);
            if (parsed?.user || parsed?.access_token) {
              if (parsed.access_token) {
                try {
                  const {
                    data: { session: restoredSession },
                    error,
                  } = await supabase.auth.setSession({
                    access_token: parsed.access_token,
                    refresh_token: parsed.refresh_token || "",
                  });

                  if (isRefreshTokenError(error)) {
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
      // Get current session
      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        setSession(null);
        setUserRole("");
        return;
      }

      if (currentSession?.user) {
        setSession(currentSession);
        if (currentSession.user.id) {
          await fetchUserRole(currentSession.user.id);
        }
        return;
      }

      // No session found, try to refresh
      const refreshedSession = await refreshSession();

      if (!refreshedSession) {
        handleRefreshTokenError(setSession, setUserRole);
        return;
      }

      if (refreshedSession?.user) {
        setSession(refreshedSession);
        if (refreshedSession.user.id) {
          await fetchUserRole(refreshedSession.user.id);
        }
      } else {
        setSession(null);
        setUserRole("");
      }
    } catch (error) {
      // Error handled silently - session state will be cleared
      setSession(null);
      setUserRole("");
    }
  }, [fetchUserRole]);

  // Initialize session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Set a maximum timeout for session initialization
        const timeoutPromise = new Promise<void>((resolve) => {
          setTimeout(() => {
            setIsLoading(false);
            resolve();
          }, 5000); // 5 second timeout
        });

        const sessionPromise = (async () => {
          // Try to get current session first (most reliable)
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();

          if (error) {
            setIsLoading(false);
            return;
          }

          if (session?.user) {
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
                const {
                  data: { session: restoredSession },
                  error: restoreError,
                } = await supabase.auth.setSession({
                  access_token: parsed.access_token,
                  refresh_token: parsed.refresh_token || "",
                });

                if (isRefreshTokenError(restoreError)) {
                  // Invalid refresh token, clear session data
                  clearInvalidSession();
                  setSession(null);
                  setUserRole("");
                  setIsLoading(false);
                  return;
                }

                if (!restoreError && restoredSession?.user) {
                  setSession(restoredSession);
                  if (restoredSession.user.id) {
                    await fetchUserRole(restoredSession.user.id);
                  }
                  setIsLoading(false);
                  return;
                } else {
                  localStorage.removeItem(STORAGE_KEYS.SESSION);
                }
              }
            } catch (parseError) {
              localStorage.removeItem(STORAGE_KEYS.SESSION);
            }
          }

          // No session found anywhere
          setSession(null);
          setUserRole("");
          setIsLoading(false);
        })();

        // Race between session initialization and timeout
        await Promise.race([sessionPromise, timeoutPromise]);
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
      }
    };

    initializeSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: any, session: { user: { id: string } | null }) => {
      setSession(session as Session);

      // Persist session to localStorage
      persistSession(session as Session);

      if (session?.user?.id) {
        await fetchUserRole(session.user.id);
      } else {
        setUserRole("");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [aggressiveSessionRecovery, fetchUserRole]);

  // Auto-refresh session
  useEffect(() => {
    if (!session?.user) return;

    const refreshInterval = setInterval(async () => {
      const refreshedSession = await refreshSession();
      
      if (!refreshedSession) {
        handleRefreshTokenError(setSession, setUserRole);
        return;
      }

      if (refreshedSession) {
        setSession(refreshedSession);
      }
    }, SESSION_REFRESH_INTERVAL);

    return () => clearInterval(refreshInterval);
  }, [session?.user]);

  // Session monitoring
  useEffect(() => {
    const sessionCheckInterval = setInterval(async () => {
      try {
        if (session?.user) {
          const {
            data: { session: currentSession },
            error,
          } = await supabase.auth.getSession();

          if (error || !currentSession?.user) {
            const recovered = await aggressiveSessionRecovery();
            if (!recovered) {
              setSession(null);
              setUserRole("");
            }
          } else {
            // Proactively refresh session
            const refreshedSession = await refreshSession();
            
            if (!refreshedSession) {
              handleRefreshTokenError(setSession, setUserRole);
              return;
            }

            if (refreshedSession) {
              setSession(refreshedSession);
            }
          }
        } else {
          const recovered = await aggressiveSessionRecovery();
          // Session recovered during periodic check
        }
      } catch (error) {
        // Error in periodic session check - silently continue
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
          const {
            data: { session: currentSession },
          } = await supabase.auth.getSession();
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
          const refreshedSession = await refreshSession();
          
          if (!refreshedSession) {
            handleRefreshTokenError(setSession, setUserRole);
            return;
          }

          if (refreshedSession) {
            setSession(refreshedSession);
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

  // Function to handle sign out
  const signOut = useCallback(async () => {
    try {
      // First, clear all Supabase-related items from localStorage
      const keys = Object.keys(localStorage);
      const supabaseKeys = keys.filter(
        (key) => key.includes("supabase") || key.includes(STORAGE_KEYS.SUPABASE_PREFIX)
      );
      supabaseKeys.forEach((key) => localStorage.removeItem(key));
      localStorage.removeItem(STORAGE_KEYS.SESSION);

      // Call Supabase signOut
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear local state
      setSession(null);
      setUserRole("");

      // Force a page reload to clear any cached state
      window.location.href = "/";
    } catch (error) {
      // If normal signout fails, try aggressive cleanup
      try {
        await supabase.auth.signOut();
        localStorage.clear(); // Clear everything as a last resort
        window.location.href = "/";
      } catch (finalError) {
        window.location.href = "/";
      }
    }
  }, []);

  return {
    session,
    userRole,
    isLoading,
    isSessionValid: isSessionValid(),
    forceRefreshSession,
    signOut, // Add signOut to the returned object
  };
};
