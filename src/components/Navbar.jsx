import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import NotificationCenterModal from './NotificationCenterModal';
import { Zap, Sun, Moon, Bell, LogOut, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  if (!user) return null;

  const roleColor =
    user.role === 'admin'
      ? 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
      : user.role === 'teacher'
      ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
      : 'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800';

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* Brand Logo & Tagline */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Zap className="w-6 h-6 fill-current text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-gray-900 dark:text-white leading-tight text-base sm:text-lg tracking-tight">
              Campus<span className="text-indigo-600 dark:text-indigo-400">Pulse</span>
            </h1>
            <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium hidden sm:block">
              Every Class. Every Presence. One Campus.
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2.5">
          {/* Theme Toggle (Light / Dark) */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-gray-500 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon className="w-5 h-5 text-slate-700" /> : <Sun className="w-5 h-5 text-amber-400" />}
          </button>

          {/* Notifications Button */}
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="relative p-2 rounded-xl text-gray-500 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600"></span>
          </button>

          {/* Role Badge */}
          <span className={`px-2.5 py-1 text-xs font-bold rounded-full border capitalize ${roleColor}`}>
            {user.role}
          </span>

          <div className="hidden sm:flex items-center space-x-2 border-l border-gray-200 dark:border-slate-800 pl-3">
            <span className="text-xs font-semibold text-gray-700 dark:text-slate-200">{user.name}</span>
          </div>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            title="Log out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <NotificationCenterModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </header>
  );
}
