import bcrypt from 'bcryptjs';
import { initDb } from './init.js';

async function seed() {
  const db = await initDb(true); // reset = true
  console.log('Seeding CampusPulse database with realistic academic data...');

  const defaultPasswordHash = await bcrypt.hash('password123', 10);

  // 1. Departments
  await db.run('DELETE FROM departments');
  await db.run(`INSERT INTO departments (id, name, code) VALUES
    (1, 'Computer Science', 'CS'),
    (2, 'Information Technology', 'IT'),
    (3, 'Computer Applications', 'BCA')
  `);

  // 2. Users
  await db.run('DELETE FROM users');
  
  // Admin user
  const adminRes = await db.run(
    `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
    ['System Admin', 'admin@college.com', defaultPasswordHash, 'admin']
  );
  const adminUserId = adminRes.lastID;

  // Teacher user
  const teacherRes = await db.run(
    `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
    ['Prof. Anish Sharma', 'teacher@college.com', defaultPasswordHash, 'teacher']
  );
  const teacherUserId = teacherRes.lastID;

  // Teacher user (Kunal Mishra)
  const kunalRes = await db.run(
    `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
    ['Prof. Kunal Mishra', 'kunallmishra01@gmail.com', defaultPasswordHash, 'teacher']
  );
  const kunalUserId = kunalRes.lastID;

  // Primary Demo Student (Rahul Kumar)
  const student1Res = await db.run(
    `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
    ['Rahul Kumar', 'student@college.com', defaultPasswordHash, 'student']
  );
  const student1UserId = student1Res.lastID;

  // Additional Students
  const student2Res = await db.run(
    `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
    ['Priya Sharma', 'priya@college.com', defaultPasswordHash, 'student']
  );
  const student3Res = await db.run(
    `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
    ['Aarav Singh', 'aarav@college.com', defaultPasswordHash, 'student']
  );
  const student4Res = await db.run(
    `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
    ['Ananya Das', 'ananya@college.com', defaultPasswordHash, 'student']
  );

  // 3. Teachers
  await db.run('DELETE FROM teachers');
  const teacherEntityRes = await db.run(
    `INSERT INTO teachers (user_id, employee_id, department_id) VALUES (?, ?, ?)`,
    [teacherUserId, 'EMP-1001', 1]
  );
  const teacherId = teacherEntityRes.lastID;

  const kunalEntityRes = await db.run(
    `INSERT INTO teachers (user_id, employee_id, department_id) VALUES (?, ?, ?)`,
    [kunalUserId, 'EMP-1002', 1]
  );
  const kunalTeacherId = kunalEntityRes.lastID;

  // 4. Students
  await db.run('DELETE FROM students');
  const student1EntityRes = await db.run(
    `INSERT INTO students (user_id, student_id, department_id, course, semester, streak_count, profile_photo) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      student1UserId,
      'STU-2026-001',
      3,
      'BCA 2nd Year',
      3,
      7,
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
    ]
  );
  const student1Id = student1EntityRes.lastID;

  const student2EntityRes = await db.run(
    `INSERT INTO students (user_id, student_id, department_id, course, semester, streak_count, profile_photo) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      student2Res.lastID,
      'STU-2026-002',
      3,
      'BCA 2nd Year',
      3,
      4,
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250'
    ]
  );
  const student2Id = student2EntityRes.lastID;

  const student3EntityRes = await db.run(
    `INSERT INTO students (user_id, student_id, department_id, course, semester, streak_count, profile_photo) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      student3Res.lastID,
      'STU-2026-003',
      3,
      'BCA 2nd Year',
      3,
      3,
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250'
    ]
  );
  const student3Id = student3EntityRes.lastID;

  // 5. Subjects
  await db.run('DELETE FROM subjects');
  await db.run(`INSERT INTO subjects (id, subject_name, subject_code, semester, department_id) VALUES
    (1, 'Java Programming', 'CS-201', 3, 1),
    (2, 'Data Structures', 'CS-202', 3, 1),
    (3, 'Database Management', 'CS-203', 3, 1),
    (4, 'Python Programming', 'CS-204', 3, 1)
  `);

  // 6. Classes
  await db.run('DELETE FROM classes');
  await db.run(`INSERT INTO classes (id, subject_id, teacher_id, class_name, schedule_time, classroom) VALUES
    (1, 1, ${teacherId}, 'BCA 2nd Year', '09:00 AM – 10:00 AM', 'Lab 301'),
    (2, 2, ${teacherId}, 'BCA 2nd Year', '11:00 AM – 12:00 PM', 'Lab 302'),
    (3, 3, ${teacherId}, 'BCA 2nd Year', '02:00 PM – 03:00 PM', 'Hall B'),
    (4, 4, ${teacherId}, 'BCA 2nd Year', '04:00 PM – 05:00 PM', 'Lab 304'),
    (5, 1, ${kunalTeacherId}, 'BCA 2nd Year', '10:00 AM – 11:00 AM', 'Lab 301'),
    (6, 2, ${kunalTeacherId}, 'CS 3rd Year', '01:00 PM – 02:00 PM', 'Room 204')
  `);

  // 7. Active Attendance Sessions
  await db.run('DELETE FROM attendance_sessions');
  const activeSessionRes = await db.run(
    `INSERT INTO attendance_sessions (class_id, teacher_id, start_time, status, qr_code_token) VALUES (?, ?, CURRENT_TIMESTAMP, 'active', 'QR-JAVA-2026-XYZ')`,
    [1, teacherId]
  );
  await db.run(
    `INSERT INTO attendance_sessions (class_id, teacher_id, start_time, status, qr_code_token) VALUES (?, ?, CURRENT_TIMESTAMP, 'active', 'QR-KUNAL-2026-ABC')`,
    [5, kunalTeacherId]
  );

  // 8. Historical Attendance Records for Rahul Kumar
  await db.run('DELETE FROM attendance');
  
  const historicalSessions = [
    // Java Programming
    { subject_id: 1, date: '2026-09-10 09:00:00', status: 'PRESENT' },
    { subject_id: 1, date: '2026-09-11 09:00:00', status: 'PRESENT' },
    { subject_id: 1, date: '2026-09-12 09:00:00', status: 'PRESENT' },
    { subject_id: 1, date: '2026-09-13 09:00:00', status: 'PRESENT' },
    { subject_id: 1, date: '2026-09-14 09:00:00', status: 'PRESENT' },
    { subject_id: 1, date: '2026-09-15 09:00:00', status: 'PRESENT' },
    { subject_id: 1, date: '2026-09-16 09:00:00', status: 'ABSENT' },
    { subject_id: 1, date: '2026-09-17 09:00:00', status: 'PRESENT' },

    // Data Structures
    { subject_id: 2, date: '2026-09-10 11:00:00', status: 'PRESENT' },
    { subject_id: 2, date: '2026-09-11 11:00:00', status: 'PRESENT' },
    { subject_id: 2, date: '2026-09-12 11:00:00', status: 'PRESENT' },
    { subject_id: 2, date: '2026-09-13 11:00:00', status: 'ABSENT' },
    { subject_id: 2, date: '2026-09-14 11:00:00', status: 'PRESENT' },
    { subject_id: 2, date: '2026-09-15 11:00:00', status: 'PRESENT' },
    { subject_id: 2, date: '2026-09-16 11:00:00', status: 'ABSENT' },
    { subject_id: 2, date: '2026-09-17 11:00:00', status: 'PRESENT' },

    // Database Management
    { subject_id: 3, date: '2026-09-10 14:00:00', status: 'PRESENT' },
    { subject_id: 3, date: '2026-09-11 14:00:00', status: 'PRESENT' },
    { subject_id: 3, date: '2026-09-12 14:00:00', status: 'PRESENT' },
    { subject_id: 3, date: '2026-09-13 14:00:00', status: 'PRESENT' },
    { subject_id: 3, date: '2026-09-14 14:00:00', status: 'PRESENT' },
    { subject_id: 3, date: '2026-09-15 14:00:00', status: 'PRESENT' },
    { subject_id: 3, date: '2026-09-16 14:00:00', status: 'PRESENT' },
    { subject_id: 3, date: '2026-09-17 14:00:00', status: 'PRESENT' }
  ];

  let sampleSessionIdForCorrection = 1;

  for (const item of historicalSessions) {
    const sRes = await db.run(
      `INSERT INTO attendance_sessions (class_id, teacher_id, start_time, end_time, status) VALUES (?, ?, ?, ?, 'closed')`,
      [item.subject_id, teacherId, item.date, item.date]
    );
    const sId = sRes.lastID;
    if (item.status === 'ABSENT' && item.subject_id === 2) {
      sampleSessionIdForCorrection = sId;
    }

    // Record for Rahul Kumar
    await db.run(
      `INSERT INTO attendance (session_id, student_id, timestamp, status, verification_status, attendance_photo, device_info, ip_address) VALUES (?, ?, ?, ?, 'VERIFIED', ?, ?, ?)`,
      [
        sId,
        student1Id,
        item.date,
        item.status,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
        'Mobile Web Chrome (Android 14)',
        '192.168.1.102'
      ]
    );

    // Record for Priya Sharma
    await db.run(
      `INSERT INTO attendance (session_id, student_id, timestamp, status, verification_status, attendance_photo, device_info, ip_address) VALUES (?, ?, ?, 'PRESENT', 'VERIFIED', ?, ?, ?)`,
      [
        sId,
        student2Id,
        item.date,
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
        'Mobile Web Safari (iOS 17)',
        '192.168.1.105'
      ]
    );
  }

  // 9. Sample Correction Request
  await db.run('DELETE FROM correction_requests');
  await db.run(
    `INSERT INTO correction_requests (student_id, session_id, reason, status) VALUES (?, ?, ?, 'PENDING')`,
    [student1Id, sampleSessionIdForCorrection, 'Medical sick leave approved by department coordinator. Requesting status update to Present.']
  );

  // 10. Sample Notifications
  await db.run('DELETE FROM notifications');
  await db.run(`INSERT INTO notifications (user_id, title, message, type, read) VALUES
    (${student1UserId}, 'Attendance Session Live', 'Prof. Anish Sharma started attendance for Java Programming.', 'session', 0),
    (${student1UserId}, 'Pulse Insights Alert', 'Great job! Your current attendance streak is 7 consecutive classes.', 'streak', 0),
    (${teacherUserId}, 'New Correction Request', 'Rahul Kumar submitted an attendance correction request for Data Structures.', 'correction', 0),
    (${adminUserId}, 'System Policy Update', 'CampusPulse security policies loaded successfully.', 'system', 0)
  `);

  // 11. Sample Audit Logs
  await db.run('DELETE FROM audit_logs');
  await db.run(`INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, reason) VALUES
    (${adminUserId}, 'INITIALIZE_POLICY', 'SYSTEM_SETTINGS', 1, 'Configured campus default attendance threshold to 80% and critical threshold to 75%.'),
    (${teacherUserId}, 'START_SESSION', 'ATTENDANCE_SESSION', 1, 'Started Java Programming live attendance session.')
  `);

  // 12. Settings
  await db.run('DELETE FROM settings');
  await db.run(`INSERT INTO settings (key, value) VALUES
    ('require_live_camera', 'true'),
    ('disallow_gallery_upload', 'true'),
    ('enable_face_verification', 'true'),
    ('enable_qr_attendance', 'true'),
    ('attendance_threshold', '80'),
    ('critical_threshold', '75'),
    ('privacy_notice_enabled', 'true')
  `);

  console.log('CampusPulse database seeded successfully!');
}

seed().catch(err => {
  console.error('Database seeding failed:', err);
  process.exit(1);
});
