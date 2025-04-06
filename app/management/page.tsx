'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function ManagementSignIn() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (code === '1234') {
        router.push('/management/dashboard');
      } else {
        setError('Invalid code');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <h1 className="text-2xl font-bold text-center mb-8">Management Portal</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-md">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              Enter Access Code
            </label>
            <input
              type="password"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={4}
              placeholder="••••"
            />
          </div>

          <div className="flex gap-4">
            <Link
              href="/"
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-center"
            >
              Back
            </Link>
            
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              {isLoading ? 'Verifying...' : 'Access Dashboard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ManagementSignIn; 