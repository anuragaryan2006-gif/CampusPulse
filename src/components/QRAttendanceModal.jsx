import React, { useState } from 'react';
import { QrCode, RefreshCw, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiRequest } from '../utils/api';

export default function QRAttendanceModal({ isOpen, onClose, sessionDetails, isTeacher, onStudentSubmitSuccess }) {
  const [qrToken, setQrToken] = useState(sessionDetails?.qr_code_token || '');
  const [inputToken, setInputToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  async function handleRefreshQR() {
    if (!sessionDetails?.active_session_id && !sessionDetails?.id) return;
    setLoading(true);
    try {
      const sId = sessionDetails.active_session_id || sessionDetails.id;
      const res = await apiRequest(`/teacher/sessions/${sId}/qr`, { method: 'POST' });
      if (res.success) {
        setQrToken(res.qr_code_token);
      }
    } catch (err) {
      console.error('Refresh QR error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStudentSubmitToken(e) {
    e.preventDefault();
    setError(null);
    if (!inputToken) return;

    setLoading(true);
    try {
      const res = await apiRequest('/attendance/mark', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionDetails.active_session_id,
          qr_token: inputToken.trim()
        })
      });

      if (res.success) {
        onStudentSubmitSuccess && onStudentSubmitSuccess(res.record);
        onClose();
      } else {
        setError(res.message || 'Invalid QR code token.');
      }
    } catch (err) {
      setError('Failed to submit QR token.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-slate-800 text-center space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-gray-900 dark:text-white text-base">QR Attendance Mode</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isTeacher ? (
          /* Teacher View: Display QR Token */
          <div className="space-y-4">
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Display this session-specific QR token on classroom screen for students:
            </p>

            {/* Generated QR Box Display */}
            <div className="p-6 bg-slate-950 rounded-2xl border-2 border-dashed border-indigo-500/50 flex flex-col items-center justify-center space-y-2">
              <QrCode className="w-20 h-20 text-indigo-400 animate-pulse" />
              <span className="font-mono text-lg font-black text-white tracking-widest bg-indigo-900/60 px-3 py-1 rounded-lg border border-indigo-500/30">
                {qrToken || 'QR-SESSION-ACTIVE'}
              </span>
            </div>

            <button
              onClick={handleRefreshQR}
              disabled={loading}
              className="w-full py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-800 dark:text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh QR Token</span>
            </button>
          </div>
        ) : (
          /* Student View: Input QR Code Token */
          <form onSubmit={handleStudentSubmitToken} className="space-y-4 text-xs">
            <p className="text-gray-500 dark:text-slate-400">
              Enter the session QR code token displayed by faculty:
            </p>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <input
              type="text"
              required
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              placeholder="e.g. QR-JAVA-2026-XYZ"
              className="w-full p-3 font-mono text-center font-bold tracking-wider bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white uppercase focus:ring-2 focus:ring-indigo-500"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Validating...' : 'Submit QR Code'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
