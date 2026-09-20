import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { Download, FileText, Filter, Users } from 'lucide-react';

export default function TeacherReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    try {
      const res = await apiRequest('/teacher/reports');
      if (res.success) {
        setReports(res.reports);
      }
    } catch (err) {
      console.error('Fetch reports error:', err);
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    if (!reports || reports.length === 0) return;
    const headers = ['Student ID', 'Student Name', 'Course', 'Total Classes', 'Present', 'Absent', 'Percentage (%)'];
    const rows = reports.map(r => [
      r.student_id,
      `"${r.student_name}"`,
      `"${r.course}"`,
      r.total_classes,
      r.present,
      r.absent,
      r.attendance_percentage
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Attendance Reports</h2>
          <p className="text-xs text-gray-500">Class performance & attendance percentage</p>
        </div>

        <button
          onClick={exportCSV}
          className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl flex items-center space-x-2 shadow-md shadow-emerald-600/20"
        >
          <Download className="w-4 h-4" />
          <span>DOWNLOAD REPORT</span>
        </button>
      </div>

      {loading ? (
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r, idx) => (
            <div key={idx} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-bold text-gray-900">{r.student_name}</h3>
                  <p className="text-xs text-gray-500">ID: {r.student_id} • {r.course}</p>
                </div>
                <div className="px-3 py-1 bg-blue-50 text-blue-700 font-extrabold text-xs rounded-full border border-blue-200">
                  {r.attendance_percentage}%
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 text-center text-xs">
                <div className="bg-gray-50 p-2 rounded-xl">
                  <p className="text-gray-400 text-[10px]">Total Classes</p>
                  <p className="font-bold text-gray-900">{r.total_classes}</p>
                </div>
                <div className="bg-emerald-50 p-2 rounded-xl text-emerald-900">
                  <p className="text-emerald-600 text-[10px]">Present</p>
                  <p className="font-bold text-emerald-700">{r.present}</p>
                </div>
                <div className="bg-red-50 p-2 rounded-xl text-red-900">
                  <p className="text-red-600 text-[10px]">Absent</p>
                  <p className="font-bold text-red-700">{r.absent}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
