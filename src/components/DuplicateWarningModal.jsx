import React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function DuplicateWarningModal({ isOpen, onClose, details }) {
  if (!isOpen || !details) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-amber-100 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-900">Attendance Already Marked</h3>
          <p className="text-xs text-gray-500 mt-1">Your attendance has already been recorded for this class session.</p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 text-left border border-gray-200 text-xs space-y-2">
          <div className="flex justify-between border-b border-gray-200 pb-1.5">
            <span className="text-gray-500 font-medium">Subject</span>
            <span className="font-bold text-gray-900">{details.subject_name || 'Java Programming'}</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 pb-1.5">
            <span className="text-gray-500 font-medium">Date</span>
            <span className="font-semibold text-gray-800">{details.date || 'Today'}</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 pb-1.5">
            <span className="text-gray-500 font-medium">Time</span>
            <span className="font-semibold text-gray-800">{details.time || '09:42 AM'}</span>
          </div>
          <div className="flex justify-between items-center pt-0.5">
            <span className="text-gray-500 font-medium">Status</span>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded-full text-[11px] flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{details.status || 'PRESENT'}</span>
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl text-sm transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
