import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../utils/api';
import QRAttendanceModal from '../../components/QRAttendanceModal';
import { Square, RefreshCw, Users, CheckCircle2, ShieldCheck, Edit3, ArrowLeft, Camera, QrCode } from 'lucide-react';

export default function ActiveSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stopping, setStopping] = useState(false);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState(null);
  const [isQROpen, setIsQROpen] = useState(false);

  useEffect(() => {
    fetchSessionLive();
    const interval = setInterval(fetchSessionLive, 3000);
    return () => clearInterval(interval);
  }, [sessionId]);

  async function fetchSessionLive() {
    try {
      const res = await apiRequest(`/teacher/sessions/${sessionId}/live`);
      if (res.success) {
        setSessionData(res.session);
      }
    } catch (err) {
      console.error('Fetch live session error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStopSession() {
    if (!window.confirm('Are you sure you want to stop this attendance session?')) return;
    setStopping(true);
    try {
      const res = await apiRequest('/teacher/sessions/stop', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId })
      });
      if (res.success) {
        navigate('/teacher/dashboard');
      }
    } catch (err) {
      console.error('Stop session error:', err);
    } finally {
      setStopping(false);
    }
  }

  async function handleManualMark(studentId, newStatus) {
    try {
      const res = await apiRequest('/teacher/attendance/manual', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId,
          student_id: studentId,
          status: newStatus
        })
      });
      if (res.success) {
        setSelectedStudentForEdit(null);
        fetchSessionLive();
      }
    } catch (err) {
      console.error('Manual mark error:', err);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Session not found.</p>
        <button onClick={() => navigate('/teacher/dashboard')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const { present_count, total_enrolled, present_students, status } = sessionData;
  const isClosed = status === 'closed';

  return (
    <div className="pb-24 pt-4 px-4 max-w-xl mx-auto space-y-5 animate-fadeIn">
      <button
        onClick={() => navigate('/teacher/dashboard')}
        className="flex items-center space-x-1.5 text-xs text-gray-500 dark:text-slate-400 font-semibold hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </button>

      {/* Session Active Live Card */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-indigo-500/20">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isClosed ? 'bg-gray-500' : 'bg-emerald-500 animate-pulse'}`}></span>
              <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-400">
                {isClosed ? 'SESSION CLOSED' : 'ATTENDANCE SESSION ACTIVE'}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white mt-2">{sessionData.subject_name}</h2>
            <p className="text-xs text-gray-400">Class: {sessionData.class_name} • {sessionData.classroom}</p>
          </div>

          <div className="flex items-center space-x-2">
            {!isClosed && (
              <button
                onClick={() => setIsQROpen(true)}
                className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 hover:bg-indigo-500/30 transition-colors"
                title="Display QR Code for Classroom"
              >
                <QrCode className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Real-time Students Counter */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium">Students Present</p>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-3xl font-black text-emerald-400">{present_count}</span>
              <span className="text-gray-400 font-bold text-sm">/ {total_enrolled}</span>
            </div>
          </div>

          {!isClosed && (
            <button
              onClick={handleStopSession}
              disabled={stopping}
              className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 flex items-center space-x-2 transition-all active:scale-[0.98]"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>STOP ATTENDANCE</span>
            </button>
          )}
        </div>
      </div>

      {/* Present Students List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Present Students ({present_students.length})</h3>
          <span className="text-xs text-gray-400 flex items-center space-x-1">
            <RefreshCw className="w-3 h-3 animate-spin text-indigo-500" />
            <span>Auto-updating live</span>
          </span>
        </div>

        {present_students.length > 0 ? (
          <div className="space-y-2.5">
            {present_students.map((stu) => (
              <div
                key={stu.attendance_id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                    <img
                      src={stu.attendance_photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                      alt={stu.student_name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">{stu.student_name}</h4>
                    <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">ID: {stu.student_id}</p>
                    <p className="text-[11px] text-gray-400">
                      {new Date(stu.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[11px] font-bold rounded-full flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>PRESENT</span>
                  </span>

                  <button
                    onClick={() => setSelectedStudentForEdit(stu)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white"
                    title="Edit Record"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl text-center text-gray-400 border border-gray-100 dark:border-slate-800 text-xs space-y-2">
            <Camera className="w-8 h-8 mx-auto text-indigo-400 animate-bounce" />
            <p>Waiting for students to mark attendance via phone camera or QR token...</p>
          </div>
        )}
      </div>

      {/* Manual Edit Modal */}
      {selectedStudentForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Edit Attendance Record</h3>
            <p className="text-xs text-gray-500">Student: {selectedStudentForEdit.student_name}</p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleManualMark(selectedStudentForEdit.student_id, 'PRESENT')}
                className="py-3 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-500"
              >
                Mark Present
              </button>
              <button
                onClick={() => handleManualMark(selectedStudentForEdit.student_id, 'ABSENT')}
                className="py-3 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-500"
              >
                Mark Absent
              </button>
            </div>

            <button
              onClick={() => setSelectedStudentForEdit(null)}
              className="w-full py-2.5 text-xs text-gray-500 font-semibold border border-gray-200 dark:border-slate-700 rounded-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* QR Code Modal for Teacher */}
      <QRAttendanceModal
        isOpen={isQROpen}
        onClose={() => setIsQROpen(false)}
        sessionDetails={sessionData}
        isTeacher={true}
      />
    </div>
  );
}
