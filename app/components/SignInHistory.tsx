"use client";

import { useState, useEffect } from 'react';
import { SignInLogger } from '@/app/lib/signin-logger';
import { Database } from '@/types/supabase';

type SignInRecord = Database['public']['Tables']['sign_in_records']['Row'];

interface SignInHistoryProps {
  userId?: string;
  limit?: number;
  showAll?: boolean;
}

export default function SignInHistory({ userId, limit = 10, showAll = false }: SignInHistoryProps) {
  const [records, setRecords] = useState<SignInRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        let data: SignInRecord[];
        
        if (showAll) {
          data = await SignInLogger.getRecentSignIns(limit);
        } else if (userId) {
          data = await SignInLogger.getUserSignInHistory(userId, limit);
        } else {
          data = [];
        }
        
        setRecords(data);
      } catch (err) {
        setError('Failed to fetch sign-in history');
        console.error('Error fetching sign-in history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [userId, limit, showAll]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (success: boolean) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        success 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {success ? 'Success' : 'Failed'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-center p-4">
        {error}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-gray-500 text-center p-4">
        No sign-in records found
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          {showAll ? 'Recent Sign-ins' : 'Sign-in History'}
        </h3>
        
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Device
                </th>
                {showAll && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User ID
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(record.success)}
                    {record.failure_reason && (
                      <div className="text-xs text-red-600 mt-1">
                        {record.failure_reason}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(record.sign_in_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.ip_address || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.device_info ? (
                      <div className="text-xs">
                        <div>{(record.device_info as any)?.browser || 'Unknown'}</div>
                        <div>{(record.device_info as any)?.os || 'Unknown'}</div>
                        <div>{(record.device_info as any)?.deviceType || 'Unknown'}</div>
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  {showAll && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {record.user_id.substring(0, 8)}...
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
