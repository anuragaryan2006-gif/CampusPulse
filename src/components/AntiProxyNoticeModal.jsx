import React from 'react';
import { ShieldCheck, Lock, Camera, MapPin, Eye, Check } from 'lucide-react';

export default function AntiProxyNoticeModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-5">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 leading-tight">Camera & Privacy Policy</h3>
            <p className="text-xs text-gray-500 font-medium">Anti-Proxy Security Transparency</p>
          </div>
        </div>

        <div className="bg-blue-50/70 rounded-2xl p-4 text-xs text-blue-900 leading-relaxed border border-blue-100 space-y-2">
          <p className="font-semibold text-blue-950">How your camera & data are used:</p>
          <ul className="space-y-1.5 list-disc pl-4 text-blue-900">
            <li>Your camera is activated <strong>only when you explicitly click "Take Attendance"</strong>.</li>
            <li>Photos are captured live to verify identity and prevent proxy attendance.</li>
            <li>No continuous background video recording occurs.</li>
            <li>Attendance records store live timestamp, active session ID, and device session metadata according to college policies.</li>
          </ul>
        </div>

        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Encrypted server transmission</span>
          </div>
          <div className="flex items-center space-x-2">
            <Camera className="w-4 h-4 text-blue-600" />
            <span>Direct live camera capture only (no gallery uploads)</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-md shadow-blue-500/20"
        >
          I Understand
        </button>
      </div>
    </div>
  );
}
