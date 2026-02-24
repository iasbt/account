import React, { useEffect, useState } from 'react';
import { adminService, type EmailStats } from '../../../services/adminService';
import { Loader2, Mail, XCircle, Clock, BarChart3 } from 'lucide-react';

export const EmailStatsView: React.FC = () => {
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await adminService.getEmailStats();
      setStats(data.stats);
      setError(null);
    } catch (err) {
      setError('Failed to load email statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">{error}</div>;
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Sent */}
      <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Mail className="h-6 w-6 text-gray-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">总发送量</dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900">{stats.total}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Success Rate */}
      <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-6 w-6 text-green-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">成功率</dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900">{stats.success_rate}%</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Failed */}
      <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircle className="h-6 w-6 text-red-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">失败数</dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900">{stats.failed}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Pending */}
      <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">队列中</dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900">{stats.pending}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
