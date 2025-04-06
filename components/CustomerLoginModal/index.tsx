'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { FormInput } from './FormInput';
import { FormTextArea } from './FormTextArea';
import { INITIAL_FORM_STATE, STYLES } from './constants';

// ... (keep the interface definition)

export default function CustomerLoginModal({ isOpen, onClose }: CustomerLoginModalProps) {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [sameAddress, setSameAddress] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // ... (keep the handleSubmit and handleSignUp functions)

  if (!isOpen) return null;

  const handleInputChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
      ...(field === 'companyAddress' && sameAddress && { deliveryAddress: e.target.value })
    }));
  };

  return (
    <div className={STYLES.modal}>
      <div className={STYLES.container}>
        <button onClick={onClose} className={STYLES.closeButton}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
          <h1 className="text-2xl font-bold text-center mb-8">
            {isRegistering ? 'Register Account' : 'Customer Login'}
          </h1>
          
          <form onSubmit={isRegistering ? handleSignUp : handleSubmit} className="space-y-6">
            {error && <div className={STYLES.errorMessage}>{error}</div>}
            
            {isRegistering && (
              <>
                <FormInput
                  id="name"
                  label="Full Name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  placeholder="Enter your full name"
                />

                <FormInput
                  id="phone"
                  label="Phone Number"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange('phone')}
                  placeholder="Enter your phone number"
                />

                <FormTextArea
                  id="companyAddress"
                  label="Company Address"
                  value={formData.companyAddress}
                  onChange={handleInputChange('companyAddress')}
                  placeholder="Enter company address"
                />
              </>
            )}

            {/* ... (keep the address checkbox and delivery address components) */}

            <FormInput
              id="email"
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              placeholder="Enter your email"
            />

            <FormInput
              id="password"
              label="Password"
              type="password"
              value={formData.password}
              onChange={handleInputChange('password')}
              placeholder="Enter your password"
            />

            <button
              type="submit"
              disabled={isLoading}
              className={STYLES.submitButton}
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