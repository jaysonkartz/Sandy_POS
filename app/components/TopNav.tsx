"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { useEffect, useState } from "react";
import { performLogout } from "@/app/utils/logout";

export default function TopNav() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkUser();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setIsLoggedIn(!!session);
  }

  const handleLogout = async () => {
    try {
      // Reset local state first
      setIsLoggedIn(false);
      
      // Perform comprehensive logout
      await performLogout();
      
      // Navigate to home page
      router.push("/");
    } catch (error) {
      console.error("Error during logout:", error);
      // Even if there's an error, try to clear local state and navigate
      setIsLoggedIn(false);
      router.push("/");
    }
  };

  return (
    <div className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-2 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            className="text-blue-600 hover:text-blue-700 font-medium"
            onClick={() => router.push("/")}
          >
            Home
          </button>
        </div>

        <div className="flex items-center space-x-4">
          {isLoggedIn ? (
            <button className="text-sm text-red-600 hover:text-red-700" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <button
              className="text-sm text-blue-600 hover:text-blue-700"
              onClick={() => router.push("/login")}
            >
              Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
