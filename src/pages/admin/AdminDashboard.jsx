import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import {
  Users, BookOpen, Building, ShieldCheck, Download, Trash2, Edit, Plus, CheckCircle, RefreshCw, Sliders, FileEdit, History, Check, X, Camera, BarChart2
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'academics' | 'attendance' | 'reports' | 'corrections' | 'audit' | 'settings'
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [reports, setReports] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showAddDepartmentModal, setShowAddDepartmentModal] = useState(false);

  // Form states
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('student');
  const [newUserStudentId, setNewUserStudentId] = useState('');

  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');

  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjCode, setNewSubjCode] = useState('');
  const [newSubjDeptId, setNewSubjDeptId] = useState('');
  const [newSubjSemester, setNewSubjSemester] = useState(1);

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  async function fetchAdminData() {
    setLoading(true);
    try {
      const statsRes = await apiRequest('/admin/stats');
      if (statsRes.success) setStats(statsRes.stats);

      if (activeTab === 'users' || activeTab === 'overview') {
        const usersRes = await apiRequest('/admin/users');
        if (usersRes.success) setUsers(usersRes.users);
      }

      if (activeTab === 'academics' || activeTab === 'overview') {
        const deptRes = await apiRequest('/admin/departments');
        if (deptRes.success) setDepartments(deptRes.departments);

        const subjRes = await apiRequest('/admin/subjects');
        if (subjRes.success) setSubjects(subjRes.subjects);
      }

      if (activeTab === 'attendance' || activeTab === 'overview') {
        const logsRes = await apiRequest('/admin/attendance');
        if (logsRes.success) setAttendanceLogs(logsRes.logs);
      }

      if (activeTab === 'reports' || activeTab === 'overview') {
        const repRes = await apiRequest('/admin/reports');
        if (repRes.success) setReports(repRes.reports);
      }

      if (activeTab === 'corrections' || activeTab === 'overview') {
        const corrRes = await apiRequest('/corrections');
        if (corrRes.success) setCorrections(corrRes.requests);
      }

      if (activeTab === 'audit' || activeTab === 'overview') {
        const auditRes = await apiRequest('/admin/audit-logs');
        if (auditRes.success) setAuditLogs(auditRes.logs);
      }

      if (activeTab === 'settings') {
        const setRes = await apiRequest('/admin/settings');
        if (setRes.success) setSettings(setRes.settings);
      }
    } catch (err) {
      console.error('Fetch admin data error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddUser(e) {
    e.preventDefault();
    const res = await apiRequest('/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        name: newUserName,
        email: newUserEmail,
        password: 'password123',
        role: newUserRole,
        student_id: newUserStudentId || `STU-${Date.now().toString().slice(-4)}`
      })
    });
    if (res.success) {
      setShowAddUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      fetchAdminData();
    } else alert(res.message);
  }

  async function handleDeleteUser(userId) {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    const res = await apiRequest(`/admin/users/${userId}`, { method: 'DELETE' });
    if (res.success) fetchAdminData();
    else alert(res.message);
  }

  async function handleAddDepartment(e) {
    e.preventDefault();
    const res = await apiRequest('/admin/departments', {
      method: 'POST',
      body: JSON.stringify({ name: newDeptName, code: newDeptCode })
    });
    if (res.success) {
      setShowAddDepartmentModal(false);
      setNewDeptName('');
      setNewDeptCode('');
      fetchAdminData();
    } else alert(res.message);
  }

  async function handleDeleteDepartment(deptId) {
    if (!window.confirm('Delete this department?')) return;
    const res = await apiRequest(`/admin/departments/${deptId}`, { method: 'DELETE' });
    if (res.success) fetchAdminData();
    else alert(res.message);
  }

  async function handleAddSubject(e) {
    e.preventDefault();
    const deptId = newSubjDeptId || (departments[0]?.id || 1);
    const res = await apiRequest('/admin/subjects', {
      method: 'POST',
      body: JSON.stringify({
        subject_name: newSubjName,
        subject_code: newSubjCode,
        semester: parseInt(newSubjSemester, 10) || 1,
        department_id: deptId
      })
    });
    if (res.success) {
      setShowAddSubjectModal(false);
      setNewSubjName('');
      setNewSubjCode('');
      fetchAdminData();
    } else alert(res.message);
  }

  async function handleDeleteSubject(subjId) {
    if (!window.confirm('Delete this subject?')) return;
    const res = await apiRequest(`/admin/subjects/${subjId}`, { method: 'DELETE' });
    if (res.success) fetchAdminData();
    else alert(res.message);
  }

  async function handleReviewCorrection(requestId, action) {
    const res = await apiRequest(`/corrections/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action, review_note: `Reviewed by Admin.` })
    });
    if (res.success) fetchAdminData();
    else alert(res.message);
  }

  async function handleToggleSetting(key, currentValue) {
    const updated = typeof currentValue === 'boolean' ? !currentValue : currentValue;
    const res = await apiRequest('/admin/settings', {
      method: 'POST',
      body: JSON.stringify({ [key]: updated })
    });
    if (res.success) {
      setSettings(prev => ({ ...prev, [key]: updated }));
    }
  }

  function exportAdminCSV() {
    if (!reports || reports.length === 0) {
      alert('No report data available to export.');
      return;
    }
    const headers = ['Student ID', 'Student Name', 'Email', 'Department', 'Course', 'Semester', 'Total Classes', 'Present', 'Absent', 'Percentage (%)'];
    const rows = reports.map(r => [
      r.student_id,
      `"${r.student_name}"`,
      `"${r.student_email}"`,
      `"${r.department_name}"`,
      `"${r.course}"`,
      r.semester,
      r.total_classes,
      r.present,
      r.absent,
      r.attendance_percentage
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CampusPulse_Institutional_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="pb-24 pt-4 px-4 max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">CampusPulse Command Center</h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">Institutional administration, policy controls & audit trail</p>
        </div>

        {/* Tab Selector Pills */}
        <div className="flex flex-wrap bg-gray-200/70 dark:bg-slate-800 p-1 rounded-2xl text-xs font-semibold">
          {['overview', 'users', 'academics', 'attendance', 'reports', 'corrections', 'audit', 'settings'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-xl capitalize transition-all ${
                activeTab === tab
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
                  <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Total Students</p>
                  <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">{stats?.students}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
                  <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Total Faculty</p>
                  <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{stats?.teachers}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
                  <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Pending Corrections</p>
                  <p className="text-2xl font-extrabold text-amber-500 mt-1">{stats?.pending_corrections}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
                  <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Campus Attendance</p>
                  <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{stats?.overall_attendance_percentage}%</p>
                </div>
              </div>

              {/* Quick Navigation Cards */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-3xl text-white shadow-lg space-y-3">
                  <h3 className="text-base font-bold">Manage Accounts</h3>
                  <p className="text-xs text-indigo-100">Student & teacher database management.</p>
                  <button onClick={() => setActiveTab('users')} className="px-4 py-2 bg-white text-indigo-700 font-bold text-xs rounded-xl">
                    View Users
                  </button>
                </div>
                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-lg space-y-3">
                  <h3 className="text-base font-bold">Correction Requests</h3>
                  <p className="text-xs text-indigo-200">Review pending student attendance exceptions.</p>
                  <button onClick={() => setActiveTab('corrections')} className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl">
                    Review ({stats?.pending_corrections || 0})
                  </button>
                </div>
                <div className="bg-gradient-to-br from-slate-900 to-gray-900 p-6 rounded-3xl text-white shadow-lg space-y-3">
                  <h3 className="text-base font-bold">System Audit Logs</h3>
                  <p className="text-xs text-gray-300">Track administrative and faculty actions.</p>
                  <button onClick={() => setActiveTab('audit')} className="px-4 py-2 bg-gray-800 text-white font-bold text-xs rounded-xl border border-gray-700">
                    Audit Trail
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Registered Users</h3>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="py-2 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add User</span>
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-600 dark:text-slate-300">
                    <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-800 text-gray-700 dark:text-slate-200 uppercase font-bold text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">ID / Emp No</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/50">
                          <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{u.name}</td>
                          <td className="px-4 py-3">{u.email}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                              {u.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono">{u.student_id || u.employee_id || '-'}</td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ACADEMICS TAB */}
          {activeTab === 'academics' && (
            <div className="space-y-6">
              {/* Departments Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Academic Departments</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Manage colleges, divisions, and branches</p>
                  </div>
                  <button
                    onClick={() => setShowAddDepartmentModal(true)}
                    className="py-2 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Department</span>
                  </button>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  {departments.map(dept => (
                    <div key={dept.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded">
                          {dept.code}
                        </span>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm mt-1">{dept.name}</h4>
                      </div>
                      <button
                        onClick={() => handleDeleteDepartment(dept.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg"
                        title="Delete Department"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subjects Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Course Subjects & Curriculum</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Class modules, semester associations, and course codes</p>
                  </div>
                  <button
                    onClick={() => setShowAddSubjectModal(true)}
                    className="py-2 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Subject</span>
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-gray-600 dark:text-slate-300">
                      <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-800 text-gray-700 dark:text-slate-200 uppercase font-bold text-[10px]">
                        <tr>
                          <th className="px-4 py-3">Code</th>
                          <th className="px-4 py-3">Subject Name</th>
                          <th className="px-4 py-3">Semester</th>
                          <th className="px-4 py-3">Department</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {subjects.map(subj => (
                          <tr key={subj.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/50">
                            <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{subj.subject_code}</td>
                            <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{subj.subject_name}</td>
                            <td className="px-4 py-3">Semester {subj.semester}</td>
                            <td className="px-4 py-3">{subj.department_name || 'Computer Science'}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleDeleteSubject(subj.id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg"
                                title="Delete Subject"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ATTENDANCE AUDIT LOG TAB */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Attendance Audit Log</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Complete institutional record of live student check-ins</p>
                </div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                  {attendanceLogs.length} Total Records
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-600 dark:text-slate-300">
                    <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-800 text-gray-700 dark:text-slate-200 uppercase font-bold text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Student</th>
                        <th className="px-4 py-3">Subject</th>
                        <th className="px-4 py-3">Faculty</th>
                        <th className="px-4 py-3">Timestamp</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Verification</th>
                        <th className="px-4 py-3">Device / IP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                      {attendanceLogs.map(log => (
                        <tr key={log.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2.5">
                              {log.attendance_photo ? (
                                <img
                                  src={log.attendance_photo}
                                  alt="Captured"
                                  className="w-8 h-8 rounded-full object-cover ring-1 ring-indigo-400/30"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                                  {log.student_name?.charAt(0) || 'S'}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-gray-900 dark:text-white leading-tight">{log.student_name}</p>
                                <p className="text-[10px] font-mono text-gray-400">{log.student_id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900 dark:text-white">{log.subject_name}</p>
                            <p className="text-[10px] text-gray-400">{log.subject_code}</p>
                          </td>
                          <td className="px-4 py-3">{log.teacher_name || 'Faculty'}</td>
                          <td className="px-4 py-3 text-[11px]">
                            {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              log.status === 'PRESENT'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                              {log.verification_status || 'VERIFIED'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[10px] text-gray-400 max-w-[140px] truncate" title={`${log.device_info || 'Mobile'} • ${log.ip_address || '127.0.0.1'}`}>
                            {log.ip_address || '127.0.0.1'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* REPORTS TAB */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Institutional Attendance Reports</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Student standing, percentage metrics & university exports</p>
                </div>
                <button
                  onClick={exportAdminCSV}
                  className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl flex items-center space-x-1.5 shadow-md shadow-emerald-600/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Download College CSV Report</span>
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-600 dark:text-slate-300">
                    <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-800 text-gray-700 dark:text-slate-200 uppercase font-bold text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Student Name</th>
                        <th className="px-4 py-3">Student ID</th>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3">Course / Sem</th>
                        <th className="px-4 py-3 text-center">Total</th>
                        <th className="px-4 py-3 text-center">Present</th>
                        <th className="px-4 py-3 text-center">Absent</th>
                        <th className="px-4 py-3 text-right">Attendance %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                      {reports.map((r, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/50">
                          <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{r.student_name}</td>
                          <td className="px-4 py-3 font-mono">{r.student_id}</td>
                          <td className="px-4 py-3">{r.department_name}</td>
                          <td className="px-4 py-3">{r.course} (Sem {r.semester})</td>
                          <td className="px-4 py-3 text-center">{r.total_classes}</td>
                          <td className="px-4 py-3 text-center text-emerald-600 font-bold">{r.present}</td>
                          <td className="px-4 py-3 text-center text-red-600 font-bold">{r.absent}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                              r.attendance_percentage >= 80
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : r.attendance_percentage >= 75
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                            }`}>
                              {r.attendance_percentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* CORRECTION REQUESTS TAB */}
          {activeTab === 'corrections' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Attendance Correction Requests</h3>
              <div className="space-y-3">
                {corrections.length > 0 ? (
                  corrections.map(req => (
                    <div key={req.id} className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-slate-800 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                            {req.subject_code}
                          </span>
                          <h4 className="font-bold text-gray-900 dark:text-white text-base mt-1">{req.student_name} ({req.student_id})</h4>
                          <p className="text-xs text-gray-500">Subject: {req.subject_name}</p>
                        </div>
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {req.status}
                        </span>
                      </div>

                      <div className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-2xl text-xs text-gray-700 dark:text-slate-300">
                        <p className="font-semibold text-gray-900 dark:text-white">Student Reason:</p>
                        <p className="mt-0.5">{req.reason}</p>
                      </div>

                      {req.status === 'PENDING' && (
                        <div className="flex space-x-2 pt-1">
                          <button
                            onClick={() => handleReviewCorrection(req.id, 'APPROVE')}
                            className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1"
                          >
                            <Check className="w-4 h-4" />
                            <span>Approve Request</span>
                          </button>
                          <button
                            onClick={() => handleReviewCorrection(req.id, 'REJECT')}
                            className="py-2 px-4 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1"
                          >
                            <X className="w-4 h-4" />
                            <span>Reject Request</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl text-center text-gray-400 border border-gray-100 text-xs">
                    No correction requests pending.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AUDIT LOGS TAB */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Administrative Audit Logs</h3>
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-600 dark:text-slate-300">
                    <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-800 text-gray-700 dark:text-slate-200 uppercase font-bold text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Timestamp</th>
                        <th className="px-4 py-3">Actor</th>
                        <th className="px-4 py-3">Action</th>
                        <th className="px-4 py-3">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                      {auditLogs.map(log => (
                        <tr key={log.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/50">
                          <td className="px-4 py-3 text-[11px]">
                            {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                            {log.actor_name || 'System'} ({log.actor_role || 'system'})
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {log.action}
                          </td>
                          <td className="px-4 py-3">{log.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm space-y-5 max-w-xl">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Campus Policy & Anti-Proxy Settings</h3>
              
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/60 rounded-2xl">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">Require Live Camera Capture</h4>
                    <p className="text-gray-500 dark:text-slate-400 mt-0.5">Disallow photo gallery uploads during attendance</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.require_live_camera ?? true}
                    onChange={() => handleToggleSetting('require_live_camera', settings.require_live_camera)}
                    className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/60 rounded-2xl">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">Enable QR Attendance Mode</h4>
                    <p className="text-gray-500 dark:text-slate-400 mt-0.5">Allow teachers to generate session QR code tokens</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enable_qr_attendance ?? true}
                    onChange={() => handleToggleSetting('enable_qr_attendance', settings.enable_qr_attendance)}
                    className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </div>

                <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-2xl space-y-2">
                  <h4 className="font-bold text-gray-900 dark:text-white">Campus Attendance Thresholds</h4>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-gray-500 font-medium">Safe Threshold (%)</label>
                      <input
                        type="number"
                        value={settings.attendance_threshold || 80}
                        onChange={(e) => handleToggleSetting('attendance_threshold', e.target.value)}
                        className="mt-1 w-full p-2 bg-white dark:bg-slate-900 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-gray-500 font-medium">Critical Threshold (%)</label>
                      <input
                        type="number"
                        value={settings.critical_threshold || 75}
                        onChange={(e) => handleToggleSetting('critical_threshold', e.target.value)}
                        className="mt-1 w-full p-2 bg-white dark:bg-slate-900 border rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleAddUser} className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Add New User</h3>
            <div>
              <label className="block text-gray-600 dark:text-slate-300 font-medium">Name</label>
              <input
                type="text"
                required
                value={newUserName}
                onChange={e => setNewUserName(e.target.value)}
                className="mt-1 w-full p-3 bg-gray-50 dark:bg-slate-800 border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-gray-600 dark:text-slate-300 font-medium">Email</label>
              <input
                type="email"
                required
                value={newUserEmail}
                onChange={e => setNewUserEmail(e.target.value)}
                className="mt-1 w-full p-3 bg-gray-50 dark:bg-slate-800 border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-gray-600 dark:text-slate-300 font-medium">Role</label>
              <select
                value={newUserRole}
                onChange={e => setNewUserRole(e.target.value)}
                className="mt-1 w-full p-3 bg-gray-50 dark:bg-slate-800 border rounded-xl"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button type="button" onClick={() => setShowAddUserModal(false)} className="px-4 py-2 border rounded-xl">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold">
                Save User
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Department Modal */}
      {showAddDepartmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleAddDepartment} className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Add Academic Department</h3>
            <div>
              <label className="block text-gray-600 dark:text-slate-300 font-medium">Department Name</label>
              <input
                type="text"
                required
                value={newDeptName}
                onChange={e => setNewDeptName(e.target.value)}
                placeholder="e.g. Electrical Engineering"
                className="mt-1 w-full p-3 bg-gray-50 dark:bg-slate-800 border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-gray-600 dark:text-slate-300 font-medium">Department Code</label>
              <input
                type="text"
                required
                value={newDeptCode}
                onChange={e => setNewDeptCode(e.target.value)}
                placeholder="e.g. EE"
                className="mt-1 w-full p-3 bg-gray-50 dark:bg-slate-800 border rounded-xl uppercase font-mono"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button type="button" onClick={() => setShowAddDepartmentModal(false)} className="px-4 py-2 border rounded-xl">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold">
                Save Department
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Subject Modal */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleAddSubject} className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Add Curriculum Subject</h3>
            <div>
              <label className="block text-gray-600 dark:text-slate-300 font-medium">Subject Name</label>
              <input
                type="text"
                required
                value={newSubjName}
                onChange={e => setNewSubjName(e.target.value)}
                placeholder="e.g. Operating Systems"
                className="mt-1 w-full p-3 bg-gray-50 dark:bg-slate-800 border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-gray-600 dark:text-slate-300 font-medium">Subject Code</label>
              <input
                type="text"
                required
                value={newSubjCode}
                onChange={e => setNewSubjCode(e.target.value)}
                placeholder="e.g. CS-205"
                className="mt-1 w-full p-3 bg-gray-50 dark:bg-slate-800 border rounded-xl uppercase font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-600 dark:text-slate-300 font-medium">Semester</label>
                <select
                  value={newSubjSemester}
                  onChange={e => setNewSubjSemester(e.target.value)}
                  className="mt-1 w-full p-3 bg-gray-50 dark:bg-slate-800 border rounded-xl"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-600 dark:text-slate-300 font-medium">Department</label>
                <select
                  value={newSubjDeptId}
                  onChange={e => setNewSubjDeptId(e.target.value)}
                  className="mt-1 w-full p-3 bg-gray-50 dark:bg-slate-800 border rounded-xl"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button type="button" onClick={() => setShowAddSubjectModal(false)} className="px-4 py-2 border rounded-xl">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold">
                Save Subject
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
