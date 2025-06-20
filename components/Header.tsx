"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import CustomerLoginModal from "./CustomerLoginModal";

import TopBarLogin from "./TopBarLogin";

export default function Header() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("customerToken");
    setIsLoggedIn(!!token);
  }, []);

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
              href="https://wa.me/6587520417"
              rel="noopener noreferrer"
              target="_blank"
            ></a>
            <TopBarLogin />
          </>
        )}
      </header>
    </>
  );
}
