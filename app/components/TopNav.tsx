'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { useEffect, useState } from 'react';

export default function TopNav() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkUser();
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    setIsLoggedIn(!!session);
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-2 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Home
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 