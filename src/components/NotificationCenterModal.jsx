import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { Bell, Check, X, Flame, ShieldAlert, BookOpen, Clock } from 'lucide-react';

export default function NotificationCenterModal({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen]);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const res = await apiRequest('/notifications');
      if (res.success) {
        setNotifications(res.notifications);
      }
    } catch (err) {
      console.error('Fetch notifications error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(id) {
    await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: 1 } : n));
  }

  async function handleMarkAllRead() {
    await apiRequest('/notifications/read-all', { method: 'POST' });
    setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-2 sm:p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-gray-100 dark:border-slate-800 space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Notifications</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {loading ? (
            <div className="p-8 text-center text-xs text-gray-400">Loading notifications...</div>
          ) : notifications.length > 0 ? (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => !n.read && handleMarkRead(n.id)}
                className={`p-3.5 rounded-2xl border text-xs transition-all cursor-pointer ${
                  n.read
                    ? 'bg-gray-50/60 dark:bg-slate-800/40 border-gray-100 dark:border-slate-800/60 opacity-75'
                    : 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/60 font-medium'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-gray-900 dark:text-white">{n.title}</h4>
                  <span className="text-[10px] text-gray-400">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-slate-300 mt-1 leading-relaxed">{n.message}</p>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-gray-400">No notifications yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
