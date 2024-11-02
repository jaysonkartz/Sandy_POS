'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    setIsLoggedIn(!!session);
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    router.push('/');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <button 
          onClick={() => router.push('/')}
          className="text-xl font-bold text-blue-600 hover:text-blue-700"
        >
          Your Store
        </button>
        
        <div className="flex items-center space-x-4">
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
} 