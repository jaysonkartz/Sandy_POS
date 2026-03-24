"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";
import TopBarLogin from "./TopBarLogin";
import { supabase } from "../app/lib/supabaseClient";

const isAbortError = (error: unknown): boolean => {
  if (!error) return false;
  const maybeError = error as { name?: string; message?: string };
  const message = String(maybeError.message || "");
  return maybeError.name === "AbortError" || message.includes("signal is aborted");
};

export default function Header() {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const pathname = usePathname();

  const loadUserRole = async (userId?: string) => {
    if (!userId) {
      setUserRole("");
      return;
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();
    setUserRole(userData?.role || "");
  };

  useEffect(() => {
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setSession(session);
      loadUserRole(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLoginSuccess = async () => {
    try {
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
              aria-label="Go to homepage"
              className="flex items-center gap-2 hover:opacity-90 transition-opacity"
              href="/"
            >
              <Image
                priority
                alt="Hong Guan"
                className="h-50 w-20 rounded-lg object-cover"
                height={50}
                src="/HongGuan_Icon.jpg"
                width={80}
              />
            </Link>

            <div className="flex items-center gap-2">
              <TopBarLogin
                session={session}
                userRole={userRole}
                onLoginSuccess={handleLoginSuccess}
              />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
