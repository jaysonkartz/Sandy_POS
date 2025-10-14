"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { useEffect, useState } from "react";
import { performLogout } from "@/app/utils/logout";

export default function Navbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkUser();
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
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <button
          className="text-xl font-bold text-blue-600 hover:text-blue-700"
          onClick={() => router.push("/")}
        >
          Your Store
        </button>

        <div className="flex items-center space-x-4">
          {isLoggedIn ? (
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
              onClick={handleLogout}
            >
              Logout
            </button>
          ) : (
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
              onClick={() => router.push("/login")}
            >
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
