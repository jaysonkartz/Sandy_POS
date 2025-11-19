"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import TopBarLogin from "./TopBarLogin";
import { supabase } from "@/app/lib/supabaseClient";

// Helper function to check if an error is a refresh token error
const isRefreshTokenError = (error: any): boolean => {
  if (!error) return false;

  const errorMessage = error?.message || "";
  const errorCode = error?.code || "";

  return (
    errorMessage.includes("Invalid Refresh Token") ||
    errorMessage.includes("Refresh Token Not Found") ||
    errorMessage.includes("refresh_token_not_found") ||
    errorCode === "refresh_token_not_found" ||
    errorMessage.includes("session_not_found") ||
    errorCode === "session_not_found"
  );
};

// Helper function to clear invalid session data
const clearInvalidSession = () => {
  try {
    const keys = Object.keys(localStorage);
    const supabaseKeys = keys.filter((key) => key.includes("supabase") || key.includes("sb-"));
    supabaseKeys.forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem("sandy_pos_session");
  } catch (error) {
    // Silently fail if localStorage is not available
  }
};

export default function Header() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("");
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("customerToken");
    setIsLoggedIn(!!token);

    // Get initial session with robust recovery
    const getInitialSession = async () => {
      try {
        // Method 1: Try to get session from Supabase
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (session?.user) {
          setSession(session);

          if (session.user.id) {
            // Fetch user role
            const { data: userData } = await supabase
              .from("users")
              .select("role")
              .eq("id", session.user.id)
              .single();

            if (userData) {
              setUserRole(userData.role);
            }
          }
          return;
        }

        // Method 2: Try to recover from localStorage
        const storedSession = localStorage.getItem("sandy_pos_session");

        if (storedSession) {
          try {
            const parsed = JSON.parse(storedSession);

            if (parsed?.user) {
              setSession(parsed);

              if (parsed.user.id) {
                // Fetch user role
                const { data: userData } = await supabase
                  .from("users")
                  .select("role")
                  .eq("id", parsed.user.id)
                  .single();

                if (userData) {
                  setUserRole(userData.role);
                }
              }
              return;
            }
          } catch (parseError) {
            // Failed to parse stored session
          }
        }

        // Method 3: Try to refresh session
        const {
          data: { session: refreshedSession },
          error: refreshError,
        } = await supabase.auth.refreshSession();

        if (isRefreshTokenError(refreshError)) {
          // Invalid refresh token, clear session data
          clearInvalidSession();
          setSession(null);
          setUserRole("");
          return;
        }

        if (!refreshError && refreshedSession?.user) {
          setSession(refreshedSession);

          if (refreshedSession.user.id) {
            // Fetch user role
            const { data: userData } = await supabase
              .from("users")
              .select("role")
              .eq("id", refreshedSession.user.id)
              .single();

            if (userData) {
              setUserRole(userData.role);
            }
          }
          return;
        }

        setSession(null);
        setUserRole("");
      } catch (error) {
        if (isRefreshTokenError(error)) {
          // Invalid refresh token, clear session data
          clearInvalidSession();
          setSession(null);
          setUserRole("");
          return;
        }
        console.error("Header: Error in session recovery:", error);
        setSession(null);
        setUserRole("");
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);

      // Persist session to localStorage for immediate recovery on refresh
      if (session?.user) {
        try {
          const sessionData = {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            user: session.user,
            expires_at: session.expires_at,
          };
          localStorage.setItem("sandy_pos_session", JSON.stringify(sessionData));
        } catch (persistError) {
          console.error("Header: Failed to persist session:", persistError);
        }

        // Fetch user role
        if (session.user.id) {
          supabase
            .from("users")
            .select("role")
            .eq("id", session.user.id)
            .single()
            .then(({ data: userData }) => {
              if (userData) {
                setUserRole(userData.role);
              }
            });
        }
      } else {
        // Clear persisted session if no session
        try {
          localStorage.removeItem("sandy_pos_session");
        } catch (clearError) {
          console.error("Header: Failed to clear persisted session:", clearError);
        }
        setUserRole("");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLoginSuccess = async () => {
    try {
      // Force refresh the session after successful login
      const {
        data: { session: newSession },
        error,
      } = await supabase.auth.getSession();

      if (newSession?.user && !error) {
        setSession(newSession);

        // Fetch user role
        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", newSession.user.id)
          .single();

        if (userData) {
          setUserRole(userData.role);
        }
      }
    } catch (error) {
      console.error("Error refreshing session after login:", error);
    }
  };

  return (
    <>
      <header className="flex justify-between items-center p-4 bg-white shadow-md">
        <div className="logo hover:opacity-80 transition-opacity">
          <img alt="HongGuan Logo" className="h-12 rounded-lg" src="/HongGuan_Icon.jpg" />
        </div>
        {(pathname === "/dashboard" || pathname === "/") && (
          <>
            <a
              className="inline-flex items-center justify-center"
              href="https://wa.me/6593254825"
              rel="noopener noreferrer"
              target="_blank"
            ></a>
            <TopBarLogin
              session={session}
              userRole={userRole}
              onLoginSuccess={handleLoginSuccess}
            />
          </>
        )}
      </header>
    </>
  );
}
