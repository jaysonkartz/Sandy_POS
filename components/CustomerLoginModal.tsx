'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import type { User } from '@supabase/auth-helpers-nextjs';

interface CustomerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomerLoginModal({ isOpen, onClose }: CustomerLoginModalProps) {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'USER'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        throw signInError;
      }

      if (data?.user) {
        router.refresh();
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const cleanEmail = formData.email.toLowerCase().trim();
    console.log('Selected role before signup:', formData.role);

    try {
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (checkError) {
        console.error('Check Error:', checkError);
      }

      if (existingUser) {
        console.log('User exists, updating role to:', formData.role);
        
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ role: formData.role })
          .eq('email', cleanEmail)
          .select()
          .single();

        if (updateError) {
          console.error('Update Error:', updateError);
          throw updateError;
        }

        console.log('Successfully updated user:', updatedUser);
        alert('User role updated successfully!');
        onClose();
        router.refresh();
        return;
      }

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: formData.password,
      });

      if (signUpError) {
        console.error('Auth Signup Error:', signUpError);
        throw signUpError;
      }

      if (!authData?.user?.id) {
        throw new Error('No user ID returned from auth signup');
      }

      const userData = {
        id: authData.user.id,
        email: cleanEmail,
        role: formData.role,
        avatar_url: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
        created_at: new Date().toISOString(),
      };

      console.log('Creating new user with data:', userData);

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .upsert([userData], {
          onConflict: 'email',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert Error:', insertError);
        // If it's a duplicate error, try updating instead
        if (insertError.code === '23505') {
          console.log('Duplicate detected, updating role instead');
          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({ role: formData.role })
            .eq('email', cleanEmail)
            .select()
            .single();

          if (updateError) throw updateError;
          
          console.log('Successfully updated user:', updatedUser);
          alert('User role updated successfully!');
          onClose();
          router.refresh();
          return;
        }
        throw insertError;
      }

      console.log('Successfully created new user:', newUser);
      alert('Account created successfully!');
      onClose();
      router.refresh();

    } catch (err) {
      console.error('Final Error:', err);
      setError(err instanceof Error ? err.message : 'Error creating account');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
          <h1 className="text-2xl font-bold text-center mb-8">
            {isRegistering ? 'Register Account' : 'Customer Login'}
          </h1>
          
          <form onSubmit={isRegistering ? handleSignUp : handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center">
                {error}
              </div>
            )}
            
            {isRegistering && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => {
                      console.log('Role changed to:', e.target.value);
                      setFormData(prev => {
                        const newState = { ...prev, role: e.target.value };
                        console.log('New form data state:', newState);
                        return newState;
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                required
                pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value.toLowerCase().trim() }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              {isLoading ? 'Processing...' : (isRegistering ? 'Sign Up' : 'Sign In')}
            </button>

            <div className="text-center text-sm text-gray-600">
              <button 
                type="button" 
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-blue-600 hover:underline"
              >
                {isRegistering ? 'Already have an account? Sign in' : 'New customer? Register here'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 