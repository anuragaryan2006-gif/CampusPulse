import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Play, CheckCircle2, Clock, Users } from 'lucide-react';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  async function fetchClasses() {
    setLoading(true);
    try {
      const res = await apiRequest('/teacher/classes');
      if (res.success) {
        setClasses(res.classes);
      }
    } catch (err) {
      console.error('Fetch teacher classes error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStartSession(classId) {
    setActionLoading(true);
    try {
      const res = await apiRequest('/teacher/sessions/start', {
        method: 'POST',
        body: JSON.stringify({ class_id: classId })
      });

      if (res.success && res.session_id) {
        navigate(`/teacher/session/${res.session_id}`);
      } else {
        alert(res.message || 'Failed to start attendance session.');
      }
    } catch (err) {
      console.error('Start session error:', err);
    } finally {
      setActionLoading(false);
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
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto space-y-5 animate-fadeIn">
      {/* Teacher Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
            <Users className="w-6 h-6 text-blue-200" />
          </div>
          <div>
            <h2 className="text-xl font-bold leading-tight">{user?.name}</h2>
            <p className="text-xs text-blue-200 font-medium">Faculty • Computer Science Dept</p>
          </div>
        </div>
      </div>

      {/* Classes Header */}
      <div className="flex justify-between items-center px-1">
        <h3 className="text-base font-bold text-gray-900">Today's Teaching Schedule</h3>
        <span className="text-xs text-blue-600 font-semibold">{classes.length} Classes</span>
      </div>

      {/* Class List */}
      <div className="space-y-3">
        {classes.map((cls) => {
          const isActive = Boolean(cls.active_session_id);

          return (
            <div
              key={cls.class_id}
              className={`bg-white rounded-3xl p-5 shadow-sm border transition-all ${
                isActive ? 'border-emerald-500/50 ring-2 ring-emerald-500/10' : 'border-gray-100'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md">
                    {cls.subject_code}
                  </span>
                  <h4 className="font-bold text-gray-900 text-base mt-1">{cls.subject_name}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Class: {cls.class_name}</p>
                </div>

                <div className="flex items-center space-x-1 text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-xl">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>{cls.schedule_time}</span>
                </div>
              </div>

              {/* Start / View Session Button */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                {isActive ? (
                  <button
                    onClick={() => navigate(`/teacher/session/${cls.active_session_id}`)}
                    className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 active:scale-[0.98] transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4 animate-pulse" />
                    <span>VIEW ACTIVE SESSION (LIVE)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartSession(cls.class_id)}
                    disabled={actionLoading}
                    className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>START ATTENDANCE</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
