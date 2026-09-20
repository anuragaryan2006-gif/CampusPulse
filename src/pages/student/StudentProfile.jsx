import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Award, BookOpen, ShieldCheck, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StudentProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto space-y-5 animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center space-y-4">
        <img
          src={user.student?.profile_photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
          alt="Profile"
          className="w-24 h-24 mx-auto rounded-3xl object-cover ring-4 ring-blue-500/20 shadow-md"
        />

        <div>
          <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
          <p className="text-xs text-gray-500 font-medium">{user.email}</p>
          <span className="inline-block mt-2 px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-full border border-blue-200">
            {user.role.toUpperCase()} • {user.student?.student_id || 'STU-2026-001'}
          </span>
        </div>
      </div>

      {/* Details Card */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3 text-xs">
        <h3 className="font-bold text-gray-900 text-sm border-b pb-2">Academic Details</h3>
        <div className="flex justify-between py-1">
          <span className="text-gray-500 font-medium">Department</span>
          <span className="font-bold text-gray-800">{user.student?.department_name || 'Computer Applications'}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-gray-500 font-medium">Course</span>
          <span className="font-bold text-gray-800">{user.student?.course || 'BCA 2nd Year'}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-gray-500 font-medium">Semester</span>
          <span className="font-bold text-gray-800">Semester {user.student?.semester || 3}</span>
        </div>
      </div>

      <button
        onClick={() => {
          logout();
          navigate('/login');
        }}
        className="w-full py-3.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-2xl text-sm transition-colors flex items-center justify-center space-x-2 border border-red-200"
      >
        <LogOut className="w-4 h-4" />
        <span>Log Out</span>
      </button>
    </div>
  );
}
