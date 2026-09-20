import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { BookOpen, CheckCircle, XCircle, AlertCircle, Percent } from 'lucide-react';

export default function SubjectAttendance() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjects();
  }, []);

  async function fetchSubjects() {
    try {
      const res = await apiRequest('/student/subjects');
      if (res.success) {
        setSubjects(res.subjects);
      }
    } catch (err) {
      console.error('Fetch subjects error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto space-y-4 animate-fadeIn">
      <div className="px-1">
        <h2 className="text-xl font-bold text-gray-900">MY ATTENDANCE</h2>
        <p className="text-xs text-gray-500">Subject-wise percentage breakdown</p>
      </div>

      <div className="space-y-3">
        {subjects.map((sub) => {
          const isGood = sub.status_level === 'good';
          const isWarning = sub.status_level === 'warning';

          const badgeClass = isGood
            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
            : isWarning
            ? 'bg-amber-100 text-amber-800 border-amber-200'
            : 'bg-red-100 text-red-800 border-red-200';

          const progressBg = isGood ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-red-500';

          return (
            <div key={sub.subject_id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md">
                    {sub.subject_code}
                  </span>
                  <h3 className="text-base font-bold text-gray-900 mt-1">{sub.subject_name}</h3>
                </div>
                <div className={`px-3 py-1 text-xs font-bold rounded-full border ${badgeClass}`}>
                  {sub.percentage}%
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${progressBg} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(sub.percentage, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Counts */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 text-center text-xs">
                <div className="bg-gray-50 p-2 rounded-2xl">
                  <p className="text-gray-400 text-[10px] font-medium">Total Classes</p>
                  <p className="font-bold text-gray-900 mt-0.5">{sub.total_classes}</p>
                </div>
                <div className="bg-emerald-50/60 p-2 rounded-2xl text-emerald-900">
                  <p className="text-emerald-600 text-[10px] font-medium">Present</p>
                  <p className="font-bold text-emerald-700 mt-0.5">{sub.present_count}</p>
                </div>
                <div className="bg-red-50/60 p-2 rounded-2xl text-red-900">
                  <p className="text-red-600 text-[10px] font-medium">Absent</p>
                  <p className="font-bold text-red-700 mt-0.5">{sub.absent_count}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
