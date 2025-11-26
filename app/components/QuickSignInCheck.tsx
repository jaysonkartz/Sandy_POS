"use client";

import { useState, useEffect, useCallback } from 'react';
import { SignInLogger } from '@/app/lib/signin-logger';
import { Database } from '@/types/supabase';

type SignInRecord = Database['public']['Tables']['sign_in_records']['Row'];

interface QuickSignInCheckProps {
  limit?: number;
  showFailedOnly?: boolean;
}

export default function QuickSignInCheck({ limit = 10, showFailedOnly = false }: QuickSignInCheckProps) {
  const [records, setRecords] = useState<SignInRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch more records if filtering to ensure we have enough after filtering
      const fetchLimit = showFailedOnly ? limit * 3 : limit;
      const allRecords = await SignInLogger.getRecentSignIns(fetchLimit);
      
      let filteredRecords = allRecords;
      if (showFailedOnly) {
        filteredRecords = allRecords.filter(record => !record.success);
      }
      
      setRecords(filteredRecords.slice(0, limit));
    } catch (err) {
      setError('Failed to fetch records');
    } finally {
      setLoading(false);
    }
  }, [limit, showFailedOnly]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800 text-sm">{error}</div>
        <button 
          onClick={fetchRecords}
          className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">
            {showFailedOnly ? 'Recent Failed Sign-ins' : 'Recent Sign-ins'}
          </h3>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200">
        {records.length === 0 ? (
          <div className="px-4 py-3 text-sm text-gray-500 text-center">
            No records found
          </div>
        ) : (
          records.map((record) => (
            <div key={record.id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {record.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(record.sign_in_at).toLocaleString()}
                  </p>
                  {record.failure_reason && (
                    <p className="text-xs text-red-600 mt-1">
                      {record.failure_reason}
                    </p>
                  )}
                </div>
                <div className="ml-4 flex-shrink-0">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    record.success 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {record.success ? 'Success' : 'Failed'}
                  </span>
                </div>
              </div>
              {record.device_info && typeof record.device_info === 'object' && 'browser' in record.device_info && 'os' in record.device_info && (
                <div className="mt-1 text-xs text-gray-500">
                  {String(record.device_info.browser)} on {String(record.device_info.os)}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {records.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 text-center">
          Showing {records.length} {records.length === 1 ? 'record' : 'records'}
        </div>
      )}
    </div>
  );
}
