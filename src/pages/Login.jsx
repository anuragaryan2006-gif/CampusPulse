import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Zap, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegistering) {
        const res = await register({
          name,
          email,
          password,
          student_id: studentId,
          course: 'BCA 2nd Year',
          semester: 3
        });
        if (res.success) {
          setIsRegistering(false);
          setError('Registration successful! Please log in.');
        } else {
          setError(res.message);
        }
      } else {
        const res = await login(email, password);
        if (res.success) {
          if (res.user.role === 'admin') navigate('/admin');
          else if (res.user.role === 'teacher') navigate('/teacher/dashboard');
          else navigate('/student/dashboard');
        } else {
          setError(res.message);
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function fillDemoAccount(demoEmail) {
    setEmail(demoEmail);
    setPassword('password123');
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-white relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 mb-4">
          <Zap className="w-10 h-10 fill-current text-white" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Campus<span className="text-indigo-400">Pulse</span>
        </h2>
        <p className="mt-1.5 text-xs text-indigo-200/80 font-medium tracking-wide">
          Every Class. Every Presence. One Campus.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl border border-slate-800 sm:px-10 space-y-5">
          
          {/* Form Mode Selector */}
          <div className="flex rounded-2xl bg-slate-950/80 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => { setIsRegistering(false); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                !isRegistering ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegistering(true); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                isRegistering ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Student Register
            </button>
          </div>

          {error && (
            <div className={`p-3.5 rounded-2xl text-xs font-medium border ${
              error.includes('successful')
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {isRegistering && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rahul Kumar"
                    className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Student ID</label>
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="STU-2026-001"
                    className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">College Email / ID</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@college.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Mail className="w-5 h-5 text-slate-500 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Lock className="w-5 h-5 text-slate-500 absolute left-3 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 active:scale-[0.99] disabled:opacity-50"
            >
              <span>{loading ? 'Processing...' : isRegistering ? 'Complete Registration' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Presets */}
          {!isRegistering && (
            <div className="pt-4 border-t border-slate-800">
              <p className="text-[11px] font-bold text-slate-400 mb-2 text-center uppercase tracking-wider">Demo Presets:</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemoAccount('student@college.com')}
                  className="py-2 px-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-[11px] font-bold rounded-xl border border-indigo-500/20 transition-colors"
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoAccount('teacher@college.com')}
                  className="py-2 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[11px] font-bold rounded-xl border border-emerald-500/20 transition-colors"
                >
                  Teacher
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoAccount('admin@college.com')}
                  className="py-2 px-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-[11px] font-bold rounded-xl border border-purple-500/20 transition-colors"
                >
                  Admin
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
