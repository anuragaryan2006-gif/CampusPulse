import React, { useState } from 'react';
import { apiRequest } from '../utils/api';
import { FileEdit, X, Send, AlertCircle } from 'lucide-react';

export default function CorrectionRequestModal({ isOpen, onClose, sessionDetails, onSuccess }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!reason || reason.trim().length < 5) {
      setError('Please provide a detailed explanation (at least 5 characters).');
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest('/corrections', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionDetails.session_id || sessionDetails.class_id,
          reason: reason.trim()
        })
      });

      if (res.success) {
        alert(res.message);
        onSuccess && onSuccess();
        onClose();
      } else {
        setError(res.message || 'Failed to submit correction request.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-slate-800 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <FileEdit className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Request Attendance Correction</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {sessionDetails && (
          <div className="bg-gray-50 dark:bg-slate-800/60 p-3 rounded-2xl text-xs space-y-1 text-gray-600 dark:text-slate-300">
            <p><strong className="text-gray-900 dark:text-white">Subject:</strong> {sessionDetails.subject_name}</p>
            <p><strong className="text-gray-900 dark:text-white">Faculty:</strong> {sessionDetails.teacher_name || 'Assigned Faculty'}</p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-700 dark:text-slate-300 font-medium mb-1">Reason for Correction Request</label>
            <textarea
              required
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Technical camera error, medical leave approved by HOD, or official college event duty..."
              className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Submitting...' : 'Submit Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
