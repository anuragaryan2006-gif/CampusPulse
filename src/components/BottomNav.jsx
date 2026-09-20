import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, BookOpen, Clock, User, CheckSquare, BarChart2, Shield } from 'lucide-react';

export default function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user || user.role === 'admin') return null; // Admin uses sidebar/tabs

  const studentLinks = [
    { label: 'Home', path: '/student/dashboard', icon: Home },
    { label: 'Attendance', path: '/student/subjects', icon: BookOpen },
    { label: 'History', path: '/student/history', icon: Clock },
    { label: 'Profile', path: '/student/profile', icon: User },
  ];

  const teacherLinks = [
    { label: 'Home', path: '/teacher/dashboard', icon: Home },
    { label: 'Classes', path: '/teacher/classes', icon: BookOpen },
    { label: 'Attendance', path: '/teacher/dashboard', icon: CheckSquare },
    { label: 'Reports', path: '/teacher/reports', icon: BarChart2 },
    { label: 'Profile', path: '/student/profile', icon: User },
  ];

  const navItems = user.role === 'student' ? studentLinks : teacherLinks;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg md:hidden">
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-1 py-2 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition-colors ${
                isActive
                  ? 'text-blue-600 bg-blue-50 font-semibold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[11px] mt-0.5">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
