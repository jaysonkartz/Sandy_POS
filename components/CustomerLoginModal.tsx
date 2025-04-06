'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

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
    companyName: '',
    role: 'USER',
    companyAddress: '',
    deliveryAddress: '',
    phone: ''
  });
  const [sameAddress, setSameAddress] = useState(false);
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
  
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });
  
      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('No user was returned after sign-up');
  
      const userId = authData.user.id;
  
      console.log('✅ Auth user created with ID:', userId);
  
      await new Promise((resolve) => setTimeout(resolve, 1000)); // wait 1 second
  
      // ✅ Insert into `users` table
      const { error: userInsertError } = await supabase
        .from('users')
        .insert([
          {
            id: userId,
            email: formData.email,
            role: formData.role,
            created_at: new Date().toISOString(),
          }
        ]);
  
      if (userInsertError) throw userInsertError;
  
      // ✅ Insert into `customers` table
      const { error: customerError } = await supabase
        .from('customers')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            user_id: userId,
            status: true,
            created_at: new Date().toISOString(),
            address: formData.companyAddress,
            delivery_address: formData.deliveryAddress,
            phone: formData.phone,
            company_name: formData.companyName,
          }
        ]);
  
      if (customerError) throw customerError;
  
      router.refresh();
      onClose();
    } catch (err) {
      console.error('🔴 Sign-up error details:');
      console.error(JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
      const message = err instanceof Error ? err.message : 'Unexpected error occurred.';
      setError(message);
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

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
                required
              />
            </div>

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
                    required
                  />
                </div>

                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your company name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your phone number"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700 mb-2">
                    Company Address
                  </label>
                  <textarea
                    id="companyAddress"
                    value={formData.companyAddress}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        companyAddress: e.target.value,
                        ...(sameAddress && { deliveryAddress: e.target.value })
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter company address"
                    rows={3}
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="sameAddress"
                    checked={sameAddress}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setSameAddress(isChecked);
                      if (isChecked) {
                        setFormData(prev => ({
                          ...prev,
                          deliveryAddress: prev.companyAddress
                        }));
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <label htmlFor="sameAddress" className="text-sm text-gray-700">
                    Delivery address is the same as company address
                  </label>
                </div>

                <div>
                  <label htmlFor="deliveryAddress" className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Address
                  </label>
                  <textarea
                    id="deliveryAddress"
                    value={formData.deliveryAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                    disabled={sameAddress}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${sameAddress ? 'bg-gray-100' : ''
                      }`}
                    placeholder="Enter delivery address"
                    rows={3}
                    required
                  />
                </div>
              </>
            )}

            

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
                required
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
