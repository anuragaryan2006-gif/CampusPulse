import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { Calendar, CheckCircle, XCircle, Filter, Clock } from 'lucide-react';

export default function AttendanceHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchHistory();
  }, [statusFilter]);

  async function fetchHistory() {
    setLoading(true);
    try {
      let endpoint = '/student/history';
      if (statusFilter) endpoint += `?status=${statusFilter}`;
      const res = await apiRequest(endpoint);
      if (res.success) {
        setHistory(res.history);
      }
    } catch (err) {
      console.error('Fetch history error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto space-y-4 animate-fadeIn">
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Attendance History</h2>
          <p className="text-xs text-gray-500">Log of recorded class attendances</p>
        </div>

        {/* Filter Pills */}
        <div className="flex bg-gray-100 p-1 rounded-xl text-xs">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              statusFilter === '' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('present')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              statusFilter === 'present' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500'
            }`}
          >
            Present
          </button>
          <button
            onClick={() => setStatusFilter('absent')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              statusFilter === 'absent' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-500'
            }`}
          >
            Absent
          </button>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : history.length > 0 ? (
        <div className="space-y-2.5">
          {history.map((item) => {
            const isPresent = item.status === 'PRESENT';
            const dateObj = new Date(item.timestamp);
            const formattedDate = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
            const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isPresent ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}
                  >
                    {isPresent ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{item.subject_name}</h4>
                    <div className="flex items-center space-x-2 text-xs text-gray-400 mt-0.5">
                      <span>{formattedDate}</span>
                      <span>•</span>
                      <span>{formattedTime}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                      isPresent ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 bg-white rounded-3xl text-center text-gray-400 border border-gray-100 text-xs">
          No attendance records found for this selection.
        </div>
      )}
    </div>
  );
}
