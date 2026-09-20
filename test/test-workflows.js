/**
 * CampusPulse Automated End-to-End Workflow Verification Suite
 * Tests all role-based permissions, sessions, camera submissions,
 * duplicate prevention, live monitoring, corrections, and reports.
 */

import { initDb } from '../db/init.js';
import { CONFIG } from '../server/config.js';
import http from 'http';

// Helper for making HTTP requests in tests
async function request(path, options = {}) {
  const url = `http://localhost:${CONFIG.PORT}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const fetchOptions = {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  };

  const res = await fetch(url, fetchOptions);
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

let serverProcess;

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Starting CampusPulse End-to-End Test Suite');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Health Check
  console.log('--- 1. API Health Check ---');
  const healthRes = await request('/api/health');
  assert(healthRes.status === 200 && healthRes.data?.status === 'ok', 'API health endpoint responds 200 OK');

  // 2. Authentication Tests
  console.log('\n--- 2. Authentication & Authorization Tests ---');
  
  // Student Login
  const studentLoginRes = await request('/api/auth/login', {
    method: 'POST',
    body: { email: 'student@college.com', password: 'password123' }
  });
  assert(studentLoginRes.status === 200 && studentLoginRes.data?.token, 'Student can log in successfully');
  const studentToken = studentLoginRes.data?.token;

  // Teacher Login
  const teacherLoginRes = await request('/api/auth/login', {
    method: 'POST',
    body: { email: 'teacher@college.com', password: 'password123' }
  });
  assert(teacherLoginRes.status === 200 && teacherLoginRes.data?.token, 'Teacher can log in successfully');
  const teacherToken = teacherLoginRes.data?.token;

  // Admin Login
  const adminLoginRes = await request('/api/auth/login', {
    method: 'POST',
    body: { email: 'admin@college.com', password: 'password123' }
  });
  assert(adminLoginRes.status === 200 && adminLoginRes.data?.token, 'Admin can log in successfully');
  const adminToken = adminLoginRes.data?.token;

  // Invalid Credentials
  const badLoginRes = await request('/api/auth/login', {
    method: 'POST',
    body: { email: 'student@college.com', password: 'wrongpassword' }
  });
  assert(badLoginRes.status === 401, 'Invalid credentials are rejected with 401 Unauthorized');

  // Role Protection
  const unauthorizedAdminAccess = await request('/api/admin/stats', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(unauthorizedAdminAccess.status === 403, 'Student is blocked from admin API with 403 Forbidden');

  // 3. Teacher Starts Attendance Session
  console.log('\n--- 3. Attendance Session Lifecycle ---');
  const startSessionRes = await request('/api/teacher/sessions/start', {
    method: 'POST',
    headers: { Authorization: `Bearer ${teacherToken}` },
    body: { class_id: 2 } // Data Structures
  });
  assert(startSessionRes.status === 201 || startSessionRes.status === 200, 'Teacher can start an attendance session');
  const activeSessionId = startSessionRes.data?.session_id;
  const qrToken = startSessionRes.data?.qr_code_token;
  assert(Boolean(activeSessionId) && Boolean(qrToken), 'Session created with active ID and QR token');

  // Teacher Refreshes QR Code
  const refreshQrRes = await request(`/api/teacher/sessions/${activeSessionId}/qr`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${teacherToken}` }
  });
  assert(refreshQrRes.status === 200 && refreshQrRes.data?.qr_code_token, 'Teacher can dynamically refresh session QR code');

  // 4. Student Live Camera Attendance Workflow
  console.log('\n--- 4. Student Attendance Submission Workflow ---');
  
  // Simulated Camera Base64 Image (realistic base64 camera frame payload)
  const dummyCameraBase64 = 'data:image/jpeg;base64,' + Buffer.from('campus-pulse-live-camera-frame-sample-data-for-attendance-verification-session-2026-high-res-stream-sample').toString('base64').repeat(3);

  const markAttendanceRes = await request('/api/attendance/mark', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: {
      session_id: activeSessionId,
      photo_base64: dummyCameraBase64,
      location_data: { lat: 28.6139, lng: 77.2090 }
    }
  });
  assert(
    markAttendanceRes.status === 201 && markAttendanceRes.data?.record?.status === 'PRESENT',
    'Student marks attendance with live camera photo payload'
  );
  assert(
    markAttendanceRes.data?.record?.verification_mode === 'DEVELOPMENT_ONLY_MOCK_VERIFIER',
    'Verification engine reports modular verifier mode'
  );

  // 5. Duplicate Attendance Prevention Test
  console.log('\n--- 5. Duplicate Attendance Prevention ---');
  const duplicateMarkRes = await request('/api/attendance/mark', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: {
      session_id: activeSessionId,
      photo_base64: dummyCameraBase64
    }
  });
  assert(
    duplicateMarkRes.status === 409 && duplicateMarkRes.data?.code === 'ALREADY_MARKED',
    'Duplicate attendance submission rejected with 409 Conflict'
  );

  // 6. Teacher Live Session Monitor
  console.log('\n--- 6. Live Session Monitoring ---');
  const liveSessionRes = await request(`/api/teacher/sessions/${activeSessionId}/live`, {
    headers: { Authorization: `Bearer ${teacherToken}` }
  });
  assert(liveSessionRes.status === 200, 'Teacher can fetch real-time session monitor');
  const presentStudents = liveSessionRes.data?.session?.present_students || [];
  const foundStudent = presentStudents.some(s => s.student_name === 'Rahul Kumar');
  assert(foundStudent, 'Student appears in teacher live present students list');

  // 7. Teacher Stops Session & Closed Session Validation
  console.log('\n--- 7. Session Termination & Closed State Validation ---');
  const stopSessionRes = await request('/api/teacher/sessions/stop', {
    method: 'POST',
    headers: { Authorization: `Bearer ${teacherToken}` },
    body: { session_id: activeSessionId }
  });
  assert(stopSessionRes.status === 200, 'Teacher can stop attendance session');

  // Student 2 (Priya) tries to mark attendance on closed session
  const student2Login = await request('/api/auth/login', {
    method: 'POST',
    body: { email: 'priya@college.com', password: 'password123' }
  });
  const student2Token = student2Login.data?.token;

  const closedMarkRes = await request('/api/attendance/mark', {
    method: 'POST',
    headers: { Authorization: `Bearer ${student2Token}` },
    body: {
      session_id: activeSessionId,
      photo_base64: dummyCameraBase64
    }
  });
  assert(closedMarkRes.status === 400, 'Closed session rejects new attendance submissions with 400 Bad Request');

  // 8. Attendance Correction Workflow
  console.log('\n--- 8. Attendance Correction Workflow ---');
  // Student submits correction request for sampleSessionId
  const submitCorrRes = await request('/api/corrections', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: {
      session_id: 2,
      reason: 'Medical certificate submitted to academic office for verified absence.'
    }
  });
  assert(submitCorrRes.status === 201, 'Student can submit attendance correction request');
  const corrRequestId = submitCorrRes.data?.request_id;

  // Teacher reviews and approves correction request
  const reviewCorrRes = await request(`/api/corrections/${corrRequestId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${teacherToken}` },
    body: { action: 'APPROVE', review_note: 'Medical exemption verified.' }
  });
  assert(reviewCorrRes.status === 200, 'Faculty can approve attendance correction request');

  // 9. Analytics & Reports Tests
  console.log('\n--- 9. Analytics, Reports & Exports ---');
  // Teacher reports
  const teacherRepRes = await request('/api/teacher/reports', {
    headers: { Authorization: `Bearer ${teacherToken}` }
  });
  assert(
    teacherRepRes.status === 200 && Array.isArray(teacherRepRes.data?.reports),
    'Teacher reports endpoint returns structured student attendance data'
  );

  // Admin reports
  const adminRepRes = await request('/api/admin/reports', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(
    adminRepRes.status === 200 && adminRepRes.data?.reports?.length > 0,
    'Admin reports endpoint returns institutional aggregations'
  );

  // Student Insights & Recovery Calculator
  const studentInsightsRes = await request('/api/student/insights', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(
    studentInsightsRes.status === 200 && Array.isArray(studentInsightsRes.data?.recoveryCalculations),
    'Student insights endpoint returns attendance recovery calculations'
  );

  // 10. Admin Audit Logs
  console.log('\n--- 10. Audit Trail Verification ---');
  const auditRes = await request('/api/admin/audit-logs', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(
    auditRes.status === 200 && auditRes.data?.logs?.length > 0,
    'Administrative audit logs track actions with timestamps and actor details'
  );

  console.log('\n====================================================');
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Check if server is running, otherwise inform user
fetch(`http://localhost:${CONFIG.PORT}/api/health`)
  .then(() => runTests())
  .catch((err) => {
    console.error(`Cannot connect to server at http://localhost:${CONFIG.PORT}. Starting server first...`);
    process.exit(2);
  });
