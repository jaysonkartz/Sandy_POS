"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { CldImage } from "next-cloudinary";
import TopBarLogin from "./TopBarLogin";
import { supabase } from "@/app/lib/supabaseClient";

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

  const loadUserRole = async (userId?: string) => {
    if (!userId) {
      setUserRole("");
      return;
    }

    const { data: userData } = await supabase.from("users").select("role").eq("id", userId).single();
    setUserRole(userData?.role || "");
  };

  useEffect(() => {
    const token = localStorage.getItem("customerToken");
    setIsLoggedIn(!!token);

    // Read initial session from Supabase client state.
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        setSession(session);
        await loadUserRole(session?.user?.id);
      } catch (error) {
        if (!isAbortError(error)) {
          console.error("Header: Failed to load initial session:", error);
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
      loadUserRole(session?.user?.id);
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
        await loadUserRole(newSession.user.id);
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
