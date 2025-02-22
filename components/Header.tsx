'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import CustomerLoginModal from './CustomerLoginModal';
import { FaWhatsapp } from 'react-icons/fa';
import TopBarLogin from './TopBarLogin';

export default function Header() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    setIsLoggedIn(!!token);
  }, []);

  return (
    <>
      <header className="flex justify-between items-center p-4 bg-white shadow-md">
        <Link href="/management" className="logo hover:opacity-80 transition-opacity">
          <img src="/HongGuan_Icon.jpg" alt="HongGuan Logo" className="h-12 rounded-lg" />
        </Link>
        {(pathname === '/dashboard' || pathname === '/') && (
          <>
            <a
              href="https://wa.me/6587520417"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center"
            >
              <FaWhatsapp size={24} className="text-green-500 hover:text-green-600" />
            </a>
            <TopBarLogin />
          </>
        )}
      </header>
    </>
  );
} 