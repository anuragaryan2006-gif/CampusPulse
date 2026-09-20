import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import CameraModal from '../../components/CameraModal';
import AntiProxyNoticeModal from '../../components/AntiProxyNoticeModal';
import DuplicateWarningModal from '../../components/DuplicateWarningModal';
import PulseInsightsCard from '../../components/PulseInsightsCard';
import CorrectionRequestModal from '../../components/CorrectionRequestModal';
import QRAttendanceModal from '../../components/QRAttendanceModal';
import AttendanceSuccess from './AttendanceSuccess';
import {
  Calendar, CheckCircle, XCircle, Clock, Camera, ShieldCheck, BookOpen, Flame, QrCode, FileEdit, AlertTriangle
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);

  // Modals
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isPrivacyNoticeOpen, setIsPrivacyNoticeOpen] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const [duplicateDetails, setDuplicateDetails] = useState(null);
  const [successRecord, setSuccessRecord] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    setLoading(true);
    try {
      const res = await apiRequest('/student/dashboard');
      if (res.success) {
        setDashboard(res.dashboard);
      }
    } catch (err) {
      console.error('Fetch dashboard failed:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleTakeAttendance(cls) {
    if (cls.already_marked) {
      setDuplicateDetails({
        subject_name: cls.subject_name,
        date: 'Today',
        time: cls.marked_timestamp ? new Date(cls.marked_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : cls.schedule_time,
        status: cls.marked_status || 'PRESENT'
      });
      return;
    }
    setSelectedClass(cls);
    setIsCameraOpen(true);
  }

  function handleOpenQR(cls) {
    setSelectedClass(cls);
    setIsQROpen(true);
  }

  async function handleConfirmAttendancePhoto(capturedPhotoBase64) {
    if (!selectedClass) return;

    const res = await apiRequest('/attendance/mark', {
      method: 'POST',
      body: JSON.stringify({
        session_id: selectedClass.active_session_id,
        photo_base64: capturedPhotoBase64,
        location_data: { lat: 28.6139, lng: 77.2090 }
      })
    });

    setIsCameraOpen(false);

    if (res.success && res.record) {
      setSuccessRecord(res.record);
      fetchDashboard();
    } else if (res.code === 'ALREADY_MARKED') {
      setDuplicateDetails(res.details || {
        subject_name: selectedClass.subject_name,
        date: 'Today',
        time: 'Active Session',
        status: 'PRESENT'
      });
      fetchDashboard();
    } else {
      alert(res.message || 'Failed to record attendance.');
    }
  }

  if (successRecord) {
    return (
      <AttendanceSuccess
        record={successRecord}
        onBack={() => setSuccessRecord(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-gray-500 font-medium">Loading CampusPulse Dashboard...</p>
        </div>
      </div>
    );
  }

  const { stats, today_classes } = dashboard || {};
  const percentage = stats?.percentage || 100;
  
  const riskStatus = stats?.risk_status || 'SAFE';
  const riskColor =
    riskStatus === 'SAFE'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
      : riskStatus === 'WARNING'
      ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
      : 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-300';

  return (
    <div className="pb-24 pt-4 px-4 max-w-xl mx-auto space-y-5 animate-fadeIn">
      
      {/* Student Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-slate-800 flex items-center justify-between transition-colors">
        <div className="flex items-center space-x-3.5">
          <img
            src={dashboard?.profile_photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
            alt="Profile"
            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/20 shadow-sm"
          />
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{dashboard?.student_name}</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">ID: {dashboard?.student_id}</p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{dashboard?.course} • Sem {dashboard?.semester}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsPrivacyNoticeOpen(true)}
            className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors"
            title="Privacy & Security Policy"
          >
            <ShieldCheck className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Date & Risk Status Row */}
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center space-x-1.5 text-gray-500 dark:text-slate-400 font-medium">
          <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>{dashboard?.today_date}</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${riskColor}`}>
            Status: {riskStatus}
          </span>
        </div>
      </div>

      {/* Primary Stats Widget */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-indigo-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-indigo-200 font-medium">Overall Attendance</p>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-4xl font-extrabold text-white">{percentage}%</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                <Flame className="w-4 h-4 fill-amber-400" />
                <span>{dashboard?.streak_count} Class Streak</span>
              </span>
            </div>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
            <BookOpen className="w-8 h-8 text-indigo-300" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-slate-800">
          <div className="flex items-center space-x-3 bg-white/5 p-3 rounded-2xl border border-white/5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400">Present Classes</p>
              <p className="text-lg font-bold text-white">{stats?.present_count}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-white/5 p-3 rounded-2xl border border-white/5">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400">Absent Classes</p>
              <p className="text-lg font-bold text-white">{stats?.absent_count}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pulse Insights Analytics Component */}
      <PulseInsightsCard />

      {/* Today's Schedule */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Today's Schedule</h3>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{today_classes?.length || 0} Classes</span>
        </div>

        <div className="space-y-3">
          {today_classes && today_classes.length > 0 ? (
            today_classes.map((cls) => {
              const isActive = cls.has_active_session;
              const isMarked = cls.already_marked;

              return (
                <div
                  key={cls.class_id}
                  className={`bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border transition-all ${
                    isActive
                      ? 'border-indigo-500/50 ring-2 ring-indigo-500/10'
                      : 'border-gray-100 dark:border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-md">
                          {cls.subject_code}
                        </span>
                        {isActive && !isMarked && (
                          <span className="flex items-center space-x-1 text-[11px] font-bold text-red-600 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-full animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                            <span>SESSION LIVE</span>
                          </span>
                        )}
                        {isMarked && (
                          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>ATTENDANCE MARKED</span>
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-base mt-1.5">{cls.subject_name}</h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Faculty: {cls.teacher_name} • {cls.classroom}</p>
                    </div>

                    <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-slate-400 font-medium bg-gray-50 dark:bg-slate-800 px-2.5 py-1 rounded-xl">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>{cls.schedule_time}</span>
                    </div>
                  </div>

                  {/* Attendance Actions */}
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center space-x-2">
                    {isActive ? (
                      isMarked ? (
                        <button
                          onClick={() => handleTakeAttendance(cls)}
                          className="w-full py-2.5 px-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold text-xs border border-emerald-200 dark:border-emerald-800 flex items-center justify-center space-x-2"
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span>Attendance Recorded (Tap Details)</span>
                        </button>
                      ) : (
                        <div className="grid grid-cols-4 gap-2 w-full">
                          {/* Primary Instant Camera Button */}
                          <button
                            onClick={() => handleTakeAttendance(cls)}
                            className="col-span-3 py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 active:scale-[0.98] transition-all"
                          >
                            <Camera className="w-4.5 h-4.5" />
                            <span className="tracking-wide uppercase text-[11px]">TAKE ATTENDANCE</span>
                          </button>

                          {/* Optional QR Code Button */}
                          <button
                            onClick={() => handleOpenQR(cls)}
                            className="p-3 rounded-2xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-slate-200 font-bold flex items-center justify-center"
                            title="Scan QR Code Mode"
                          >
                            <QrCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="flex justify-between items-center w-full">
                        <span className="text-xs text-gray-400 italic">Session not active</span>
                        <button
                          onClick={() => { setSelectedClass(cls); setIsCorrectionOpen(true); }}
                          className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center space-x-1 hover:underline"
                        >
                          <FileEdit className="w-3.5 h-3.5" />
                          <span>Correction Request</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl text-center text-gray-400 border border-gray-100 dark:border-slate-800 text-xs">
              No classes scheduled for today.
            </div>
          )}
        </div>
      </div>

      {/* Camera Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onConfirmAttendance={handleConfirmAttendancePhoto}
        sessionDetails={selectedClass}
      />

      {/* Anti-Proxy Privacy Notice */}
      <AntiProxyNoticeModal
        isOpen={isPrivacyNoticeOpen}
        onClose={() => setIsPrivacyNoticeOpen(false)}
      />

      {/* Duplicate Warning Modal */}
      <DuplicateWarningModal
        isOpen={!!duplicateDetails}
        onClose={() => setDuplicateDetails(null)}
        details={duplicateDetails}
      />

      {/* Optional QR Attendance Modal */}
      <QRAttendanceModal
        isOpen={isQROpen}
        onClose={() => setIsQROpen(false)}
        sessionDetails={selectedClass}
        isTeacher={false}
        onStudentSubmitSuccess={(rec) => {
          setSuccessRecord(rec);
          fetchDashboard();
        }}
      />

      {/* Correction Request Modal */}
      <CorrectionRequestModal
        isOpen={isCorrectionOpen}
        onClose={() => setIsCorrectionOpen(false)}
        sessionDetails={selectedClass}
        onSuccess={() => fetchDashboard()}
      />
    </div>
  );
}
