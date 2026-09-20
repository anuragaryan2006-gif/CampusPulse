import React from 'react';
import { CheckCircle2, ArrowLeft, Calendar, Clock, User, BookOpen, ShieldCheck } from 'lucide-react';

export default function AttendanceSuccess({ record, onBack }) {
  if (!record) return null;

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 max-w-md mx-auto animate-fadeIn">
      <div className="w-full bg-white rounded-3xl p-6 shadow-2xl border border-emerald-100 text-center space-y-6">
        
        {/* Animated Check Icon */}
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-25"></div>
          <div className="relative w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <CheckCircle2 className="w-12 h-12" />
          </div>
        </div>

        <div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full uppercase tracking-wider">
            VERIFIED & STORED
          </span>
          <h2 className="text-2xl font-extrabold text-gray-900 mt-2">Attendance Marked Successfully</h2>
          <p className="text-xs text-gray-500 mt-1">Stored securely in college database</p>
        </div>

        {/* Captured Photo Container */}
        {record.photo && (
          <div className="relative w-36 h-36 mx-auto rounded-2xl overflow-hidden border-4 border-emerald-500/30 shadow-lg">
            <img src={record.photo} alt="Captured Attendance" className="w-full h-full object-cover" />
            <div className="absolute bottom-1 right-1 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3" />
              <span>LIVE CAPTURE</span>
            </div>
          </div>
        )}

        {/* Record Details Card */}
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-left text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <div className="flex items-center space-x-2 text-gray-500 font-medium">
              <User className="w-4 h-4 text-blue-600" />
              <span>Student Name</span>
            </div>
            <span className="font-bold text-gray-900 text-sm">{record.student_name}</span>
          </div>

          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <div className="flex items-center space-x-2 text-gray-500 font-medium">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Subject</span>
            </div>
            <span className="font-bold text-gray-900">{record.subject_name}</span>
          </div>

          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <div className="flex items-center space-x-2 text-gray-500 font-medium">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Date</span>
            </div>
            <span className="font-semibold text-gray-800">{record.date}</span>
          </div>

          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <div className="flex items-center space-x-2 text-gray-500 font-medium">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Time</span>
            </div>
            <span className="font-semibold text-gray-800">{record.time}</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-gray-500 font-medium">Status</span>
            <span className="px-3 py-1 bg-emerald-500 text-white font-extrabold rounded-full text-xs tracking-wider shadow-sm">
              {record.status}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onBack}
          className="w-full py-3.5 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm transition-all flex items-center justify-center space-x-2 active:scale-[0.99]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO DASHBOARD</span>
        </button>
      </div>
    </div>
  );
}
