import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';

// Pages
import Login from './pages/Login';
import StudentDashboard from './pages/student/StudentDashboard';
import SubjectAttendance from './pages/student/SubjectAttendance';
import AttendanceHistory from './pages/student/AttendanceHistory';
import StudentProfile from './pages/student/StudentProfile';

import TeacherDashboard from './pages/teacher/TeacherDashboard';
import ActiveSession from './pages/teacher/ActiveSession';
import TeacherReports from './pages/teacher/TeacherReports';

import AdminDashboard from './pages/admin/AdminDashboard';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }

  return children;
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 font-sans transition-colors">
            <Navbar />
            <div className="flex">
              <Sidebar />
              <main className="flex-1 max-w-6xl mx-auto w-full">
                <Routes>
                  <Route path="/" element={<HomeRedirect />} />
                  <Route path="/login" element={<Login />} />

                  {/* Student Routes */}
                  <Route
                    path="/student/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['student']}>
                        <StudentDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/student/subjects"
                    element={
                      <ProtectedRoute allowedRoles={['student']}>
                        <SubjectAttendance />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/student/history"
                    element={
                      <ProtectedRoute allowedRoles={['student']}>
                        <AttendanceHistory />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/student/profile"
                    element={
                      <ProtectedRoute allowedRoles={['student', 'teacher']}>
                        <StudentProfile />
                      </ProtectedRoute>
                    }
                  />

                  {/* Teacher Routes */}
                  <Route
                    path="/teacher/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['teacher']}>
                        <TeacherDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/teacher/classes"
                    element={
                      <ProtectedRoute allowedRoles={['teacher']}>
                        <TeacherDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/teacher/session/:sessionId"
                    element={
                      <ProtectedRoute allowedRoles={['teacher']}>
                        <ActiveSession />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/teacher/reports"
                    element={
                      <ProtectedRoute allowedRoles={['teacher']}>
                        <TeacherReports />
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin Routes */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />

                  <Route path="*" element={<HomeRedirect />} />
                </Routes>
              </main>
            </div>
            <BottomNav />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
