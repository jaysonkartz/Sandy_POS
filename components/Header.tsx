'use client';

import { useState } from 'react';
import Link from 'next/link';
import CustomerLoginModal from './CustomerLoginModal';
import { FaWhatsapp } from 'react-icons/fa';
export default function Header() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <>
      <header className="flex justify-between items-center p-4 bg-white shadow-md">
        <Link href="/management" className="logo hover:opacity-80 transition-opacity">
          <img src="/logo.png" alt="Sandy POS Logo" className="h-12" />
        </Link>
        <a
          href="https://wa.me/6587520417"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center"
        >
          <FaWhatsapp size={24} className="text-green-500 hover:text-green-600" />
        </a>
        <button 
          onClick={() => setIsLoginModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Customer Login
        </button>
      </header>
      <CustomerLoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
} 