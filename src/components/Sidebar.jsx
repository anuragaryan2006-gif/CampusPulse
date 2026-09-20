import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home, BookOpen, Clock, User, CheckSquare, BarChart2, Shield, Settings, FileEdit, LogOut, Zap
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const studentItems = [
    { label: 'Dashboard', path: '/student/dashboard', icon: Home },
    { label: 'My Subjects', path: '/student/subjects', icon: BookOpen },
    { label: 'Attendance History', path: '/student/history', icon: Clock },
    { label: 'Profile', path: '/student/profile', icon: User },
  ];

  const teacherItems = [
    { label: 'Dashboard', path: '/teacher/dashboard', icon: Home },
    { label: 'Teaching Schedule', path: '/teacher/classes', icon: BookOpen },
    { label: 'Reports & Export', path: '/teacher/reports', icon: BarChart2 },
    { label: 'Profile', path: '/student/profile', icon: User },
  ];

  const adminItems = [
    { label: 'Command Center', path: '/admin', icon: Shield },
  ];

  const navItems =
    user.role === 'admin'
      ? adminItems
      : user.role === 'teacher'
      ? teacherItems
      : studentItems;

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 min-h-[calc(100vh-65px)] p-4 space-y-6">
      <div className="flex-1 space-y-1">
        <p className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
          {user.role} Navigation
        </p>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 text-xs">
        <div className="flex items-center space-x-2 text-indigo-700 dark:text-indigo-300 font-bold mb-1">
          <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>CampusPulse v2.0</span>
        </div>
        <p className="text-[11px] text-gray-500 dark:text-slate-400">
          Smart Attendance Platform
        </p>
      </div>
    </aside>
  );
}
