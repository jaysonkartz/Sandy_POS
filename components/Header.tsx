"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { CldImage } from "next-cloudinary";
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

// Helper to detect benign abort errors
const isAbortError = (error: any): boolean => {
  if (!error) return false;
  const message = String(error?.message || "");
  return error?.name === "AbortError" || message.includes("signal is aborted");
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
        if (!isAbortError(error)) {
          console.error("Header: Error in session recovery:", error);
        }
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
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b shadow-sm">
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="h-14 flex items-center justify-between gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 hover:opacity-90 transition-opacity"
              aria-label="Go to homepage"
            >
              <CldImage
                alt="Hong Guan"
                className="h-50 w-20 rounded-lg object-cover"
                src="/HongGuan_Icon.jpg"
                width={80}
                height={50}
                unoptimized
              />
              <span className="hidden sm:block font-semibold text-gray-900">Hong Guan</span>
            </Link>

            <div className="flex items-center gap-2">
              {(pathname === "/" || pathname.startsWith("/dashboard")) && (
                <a
                  className="hidden sm:inline-flex items-center justify-center text-sm text-gray-600 hover:text-gray-900"
                  href="https://wa.me/6593254825"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  WhatsApp
                </a>
              )}

              <TopBarLogin session={session} userRole={userRole} onLoginSuccess={handleLoginSuccess} />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
