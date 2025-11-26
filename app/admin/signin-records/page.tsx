"use client";

import { useState, useEffect } from 'react';
import SignInHistory from '@/app/components/SignInHistory';
import SignInStats from '@/app/components/SignInStats';
import { SignInLogger } from '@/app/lib/signin-logger';
import { Database } from '@/types/supabase';

type SignInRecord = Database['public']['Tables']['sign_in_records']['Row'];

export default function SignInRecordsPage() {
  const [selectedTab, setSelectedTab] = useState<'stats' | 'history' | 'recent'>('stats');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [recentRecords, setRecentRecords] = useState<SignInRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedTab === 'recent') {
      fetchRecentRecords();
    }
  }, [selectedTab]);

  const fetchRecentRecords = async () => {
    setLoading(true);
    try {
      const records = await SignInLogger.getRecentSignIns(100);
      setRecentRecords(records);
    } catch (error) {
      console.error('Error fetching recent records:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Email', 'Status', 'Date', 'IP Address', 'Device', 'Failure Reason'];
    const csvContent = [
      headers.join(','),
      ...recentRecords.map(record => [
        record.email,
        record.success ? 'Success' : 'Failed',
        new Date(record.sign_in_at).toLocaleString(),
        record.ip_address || 'N/A',
        record.device_info ? `${(record.device_info as any)?.browser || 'Unknown'} (${(record.device_info as any)?.os || 'Unknown'})` : 'N/A',
        record.failure_reason || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signin-records-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sign-in Records</h1>
          <p className="mt-2 text-gray-600">Monitor and analyze user authentication activities</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setSelectedTab('stats')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'stats'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Statistics
            </button>
            <button
              onClick={() => setSelectedTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Sign-in History
            </button>
            <button
              onClick={() => setSelectedTab('recent')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'recent'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Recent Records
            </button>
          </nav>
        </div>

        {/* Date Range Filter */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setDateRange({ startDate: '', endDate: '' })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {selectedTab === 'stats' && (
          <div className="space-y-6">
            <SignInStats 
              startDate={dateRange.startDate || undefined}
              endDate={dateRange.endDate || undefined}
              title="Sign-in Statistics"
            />
          </div>
        )}

        {selectedTab === 'history' && (
          <div className="space-y-6">
            <SignInHistory showAll={true} limit={50} />
          </div>
        )}

        {selectedTab === 'recent' && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Recent Sign-in Records
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={exportToCSV}
                      className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
                    >
                      Export CSV
                    </button>
                  </div>
                </div>
                
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User ID
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recentRecords.map((record) => (
                          <tr key={record.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {record.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                record.success 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {record.success ? 'Success' : 'Failed'}
                              </span>
                              {record.failure_reason && (
                                <div className="text-xs text-red-600 mt-1 max-w-xs truncate">
                                  {record.failure_reason}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(record.sign_in_at).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                              {record.ip_address || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {record.device_info ? (
                    <div className="text-xs">
                      <div>{(record.device_info as any)?.browser || 'Unknown'}</div>
                      <div>{(record.device_info as any)?.os || 'Unknown'}</div>
                    </div>
                  ) : (
                    'N/A'
                  )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                              {record.user_id.substring(0, 8)}...
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {recentRecords.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No sign-in records found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
