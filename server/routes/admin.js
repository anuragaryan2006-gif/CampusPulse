import express from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../../db/init.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken, requireRole('admin'));

// Admin Dashboard Overview Stats
router.get('/stats', async (req, res) => {
  try {
    const db = await getDb();

    const studentCount = await db.get(`SELECT COUNT(*) as count FROM students`);
    const teacherCount = await db.get(`SELECT COUNT(*) as count FROM teachers`);
    const subjectCount = await db.get(`SELECT COUNT(*) as count FROM subjects`);
    const activeSessions = await db.get(`SELECT COUNT(*) as count FROM attendance_sessions WHERE status = 'active'`);
    const pendingCorrections = await db.get(`SELECT COUNT(*) as count FROM correction_requests WHERE status = 'PENDING'`);
    
    const attStats = await db.get(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present
      FROM attendance
    `);

    const totalAtt = attStats.total || 0;
    const presentAtt = attStats.present || 0;
    const overallPct = totalAtt > 0 ? parseFloat(((presentAtt / totalAtt) * 100).toFixed(1)) : 100;

    return res.json({
      success: true,
      stats: {
        students: studentCount.count,
        teachers: teacherCount.count,
        subjects: subjectCount.count,
        active_sessions: activeSessions.count,
        pending_corrections: pendingCorrections.count,
        total_attendance_records: totalAtt,
        overall_attendance_percentage: overallPct
      }
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch admin stats.' });
  }
});

// Users Management
router.get('/users', async (req, res) => {
  try {
    const db = await getDb();
    const { role } = req.query;

    let query = `
      SELECT u.id, u.name, u.email, u.role, u.account_status, u.created_at,
             s.student_id, s.course, s.semester,
             t.employee_id
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN teachers t ON u.id = t.user_id
    `;
    const params = [];

    if (role) {
      query += ` WHERE u.role = ?`;
      params.push(role);
    }

    query += ` ORDER BY u.created_at DESC`;

    const users = await db.all(query, params);
    return res.json({ success: true, users });
  } catch (err) {
    console.error('Admin users error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
});

// Create User (Student / Teacher / Admin)
router.post('/users', async (req, res) => {
  try {
    const db = await getDb();
    const { name, email, password, role, student_id, employee_id, department_id, course, semester } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, password, and role.' });
    }

    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRes = await db.run(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      [name, email.toLowerCase().trim(), hashedPassword, role]
    );
    const userId = userRes.lastID;

    if (role === 'student') {
      const sId = student_id || `STU-${Date.now().toString().slice(-4)}`;
      await db.run(
        `INSERT INTO students (user_id, student_id, department_id, course, semester) VALUES (?, ?, ?, ?, ?)`,
        [userId, sId, department_id || 1, course || 'BCA 2nd Year', semester || 3]
      );
    } else if (role === 'teacher') {
      const empId = employee_id || `EMP-${Date.now().toString().slice(-4)}`;
      await db.run(
        `INSERT INTO teachers (user_id, employee_id, department_id) VALUES (?, ?, ?)`,
        [userId, empId, department_id || 1]
      );
    }

    // Audit Log
    await db.run(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, reason) VALUES (?, 'CREATE_USER', 'USER', ?, ?)`,
      [req.user.id, userId, `Admin created ${role} account for ${email}`]
    );

    return res.status(201).json({ success: true, message: `${role} created successfully.` });
  } catch (err) {
    console.error('Admin create user error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create user.' });
  }
});

// Delete User
router.delete('/users/:id', async (req, res) => {
  try {
    const db = await getDb();
    const userId = req.params.id;

    if (parseInt(userId, 10) === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account.' });
    }

    await db.run(`DELETE FROM users WHERE id = ?`, [userId]);

    await db.run(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, reason) VALUES (?, 'DELETE_USER', 'USER', ?, 'Admin deleted user account.')`,
      [req.user.id, userId]
    );

    return res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    console.error('Admin delete user error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
});

// Audit Logs
router.get('/audit-logs', async (req, res) => {
  try {
    const db = await getDb();
    const logs = await db.all(`
      SELECT al.*, u.name as actor_name, u.email as actor_email, u.role as actor_role
      FROM audit_logs al
      LEFT JOIN users u ON al.actor_id = u.id
      ORDER BY al.timestamp DESC
      LIMIT 100
    `);
    return res.json({ success: true, logs });
  } catch (err) {
    console.error('Admin audit logs error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch audit logs.' });
  }
});

// Departments CRUD
router.get('/departments', async (req, res) => {
  const db = await getDb();
  const departments = await db.all(`SELECT * FROM departments ORDER BY name ASC`);
  return res.json({ success: true, departments });
});

router.post('/departments', async (req, res) => {
  const db = await getDb();
  const { name, code } = req.body;
  if (!name || !code) return res.status(400).json({ success: false, message: 'Name and Code required.' });

  await db.run(`INSERT INTO departments (name, code) VALUES (?, ?)`, [name, code.toUpperCase()]);
  return res.json({ success: true, message: 'Department added successfully.' });
});

// Subjects CRUD
router.get('/subjects', async (req, res) => {
  const db = await getDb();
  const subjects = await db.all(`
    SELECT sub.*, d.name as department_name 
    FROM subjects sub 
    LEFT JOIN departments d ON sub.department_id = d.id 
    ORDER BY sub.subject_name ASC
  `);
  return res.json({ success: true, subjects });
});

router.post('/subjects', async (req, res) => {
  const db = await getDb();
  const { subject_name, subject_code, semester, department_id } = req.body;
  if (!subject_name || !subject_code) return res.status(400).json({ success: false, message: 'Subject name and code required.' });

  await db.run(
    `INSERT INTO subjects (subject_name, subject_code, semester, department_id) VALUES (?, ?, ?, ?)`,
    [subject_name, subject_code.toUpperCase(), semester || 1, department_id || 1]
  );
  return res.json({ success: true, message: 'Subject created successfully.' });
});

// All Attendance Logs Audit
router.get('/attendance', async (req, res) => {
  try {
    const db = await getDb();
    const logs = await db.all(`
      SELECT 
        att.id,
        att.timestamp,
        att.status,
        att.verification_status,
        att.attendance_photo,
        att.device_info,
        att.ip_address,
        u.name as student_name,
        s.student_id,
        sub.subject_name,
        sub.subject_code,
        tu.name as teacher_name
      FROM attendance att
      JOIN students s ON att.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN attendance_sessions sess ON att.session_id = sess.id
      JOIN classes c ON sess.class_id = c.id
      JOIN subjects sub ON c.subject_id = sub.id
      JOIN teachers t ON sess.teacher_id = t.id
      JOIN users tu ON t.user_id = tu.id
      ORDER BY att.timestamp DESC
    `);
    return res.json({ success: true, logs });
  } catch (err) {
    console.error('Admin attendance logs error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch attendance logs.' });
  }
});

// System Settings
router.get('/settings', async (req, res) => {
  const db = await getDb();
  const settingsRows = await db.all(`SELECT key, value FROM settings`);
  const settingsObj = {};
  settingsRows.forEach(r => {
    settingsObj[r.key] = r.value === 'true' ? true : r.value === 'false' ? false : r.value;
  });
  return res.json({ success: true, settings: settingsObj });
});

router.post('/settings', async (req, res) => {
  const db = await getDb();
  const settingsObj = req.body;

  for (const [key, value] of Object.entries(settingsObj)) {
    const valStr = String(value);
    await db.run(
      `INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [key, valStr]
    );
  }

  await db.run(
    `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, reason) VALUES (?, 'UPDATE_SETTINGS', 'SYSTEM_SETTINGS', 1, 'Admin updated security & attendance settings.')`,
    [req.user.id]
  );

  return res.json({ success: true, message: 'Settings updated successfully.' });
});

// Institutional Attendance Reports & Analytics
router.get('/reports', async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.all(`
      SELECT 
        s.id as student_db_id,
        s.student_id,
        u.name as student_name,
        u.email as student_email,
        s.course,
        s.semester,
        d.name as department_name,
        COUNT(att.id) as total_classes,
        SUM(CASE WHEN att.status = 'PRESENT' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN att.status = 'ABSENT' THEN 1 ELSE 0 END) as absent
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN attendance att ON att.student_id = s.id
      GROUP BY s.id
      ORDER BY u.name ASC
    `);

    const reports = rows.map(r => {
      const total = r.total_classes || 0;
      const present = r.present || 0;
      const absent = r.absent || 0;
      const pct = total > 0 ? parseFloat(((present / total) * 100).toFixed(1)) : 100;
      return {
        student_id: r.student_id,
        student_name: r.student_name,
        student_email: r.student_email,
        course: r.course,
        semester: r.semester,
        department_name: r.department_name || 'General',
        total_classes: total,
        present,
        absent,
        attendance_percentage: pct
      };
    });

    return res.json({ success: true, reports });
  } catch (err) {
    console.error('Admin reports error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate administrative reports.' });
  }
});

// Delete Department
router.delete('/departments/:id', async (req, res) => {
  try {
    const db = await getDb();
    await db.run('DELETE FROM departments WHERE id = ?', [req.params.id]);
    await db.run(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, reason) VALUES (?, 'DELETE_DEPARTMENT', 'DEPARTMENT', ?, 'Admin deleted department.')`,
      [req.user.id, req.params.id]
    );
    return res.json({ success: true, message: 'Department deleted successfully.' });
  } catch (err) {
    console.error('Delete department error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete department.' });
  }
});

// Delete Subject
router.delete('/subjects/:id', async (req, res) => {
  try {
    const db = await getDb();
    await db.run('DELETE FROM subjects WHERE id = ?', [req.params.id]);
    await db.run(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, reason) VALUES (?, 'DELETE_SUBJECT', 'SUBJECT', ?, 'Admin deleted subject.')`,
      [req.user.id, req.params.id]
    );
    return res.json({ success: true, message: 'Subject deleted successfully.' });
  } catch (err) {
    console.error('Delete subject error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete subject.' });
  }
});

export default router;
