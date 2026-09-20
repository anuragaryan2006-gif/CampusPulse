import express from 'express';
import { getDb } from '../../db/init.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken, requireRole('teacher'));

// Teacher Classes List
router.get('/classes', async (req, res) => {
  try {
    const db = await getDb();
    const teacher = req.teacher;

    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher profile not found.' });
    }

    const classes = await db.all(
      `SELECT 
        c.id as class_id,
        c.class_name,
        c.schedule_time,
        c.classroom,
        sub.id as subject_id,
        sub.subject_name,
        sub.subject_code,
        sess.id as active_session_id,
        sess.start_time as active_start_time,
        sess.qr_code_token
       FROM classes c
       JOIN subjects sub ON c.subject_id = sub.id
       LEFT JOIN attendance_sessions sess ON sess.class_id = c.id AND sess.status = 'active'
       WHERE c.teacher_id = ?`,
      [teacher.id]
    );

    return res.json({ success: true, classes });
  } catch (err) {
    console.error('Teacher classes error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch teacher classes.' });
  }
});

// Start Attendance Session
router.post('/sessions/start', async (req, res) => {
  try {
    const db = await getDb();
    const teacher = req.teacher;
    const { class_id } = req.body;

    if (!class_id) {
      return res.status(400).json({ success: false, message: 'class_id is required.' });
    }

    // Check if session already active
    const existing = await db.get(
      `SELECT id, qr_code_token FROM attendance_sessions WHERE class_id = ? AND status = 'active'`,
      [class_id]
    );

    if (existing) {
      return res.json({
        success: true,
        message: 'Attendance session is already active.',
        session_id: existing.id,
        qr_code_token: existing.qr_code_token
      });
    }

    const qrToken = `QR-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const result = await db.run(
      `INSERT INTO attendance_sessions (class_id, teacher_id, start_time, status, qr_code_token) VALUES (?, ?, CURRENT_TIMESTAMP, 'active', ?)`,
      [class_id, teacher.id, qrToken]
    );

    // Audit Log
    await db.run(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, reason) VALUES (?, 'START_SESSION', 'ATTENDANCE_SESSION', ?, ?)`,
      [req.user.id, result.lastID, `Faculty started attendance session for class ID ${class_id}`]
    );

    return res.status(201).json({
      success: true,
      message: 'Attendance session started successfully!',
      session_id: result.lastID,
      qr_code_token: qrToken
    });
  } catch (err) {
    console.error('Start session error:', err);
    return res.status(500).json({ success: false, message: 'Failed to start attendance session.' });
  }
});

// Generate / Refresh Session QR Code Token
router.post('/sessions/:id/qr', async (req, res) => {
  try {
    const db = await getDb();
    const sessionId = req.params.id;

    const newQrToken = `QR-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    await db.run(
      `UPDATE attendance_sessions SET qr_code_token = ? WHERE id = ? AND teacher_id = ?`,
      [newQrToken, sessionId, req.teacher.id]
    );

    return res.json({
      success: true,
      qr_code_token: newQrToken
    });
  } catch (err) {
    console.error('Refresh QR token error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate QR token.' });
  }
});

// Stop Attendance Session
router.post('/sessions/stop', async (req, res) => {
  try {
    const db = await getDb();
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({ success: false, message: 'session_id is required.' });
    }

    await db.run(
      `UPDATE attendance_sessions SET status = 'closed', end_time = CURRENT_TIMESTAMP WHERE id = ?`,
      [session_id]
    );

    // Audit Log
    await db.run(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, reason) VALUES (?, 'STOP_SESSION', 'ATTENDANCE_SESSION', ?, 'Session stopped by faculty.')`,
      [req.user.id, session_id]
    );

    return res.json({
      success: true,
      message: 'Attendance session stopped successfully.'
    });
  } catch (err) {
    console.error('Stop session error:', err);
    return res.status(500).json({ success: false, message: 'Failed to stop attendance session.' });
  }
});

// Live Session Monitoring
router.get('/sessions/:id/live', async (req, res) => {
  try {
    const db = await getDb();
    const sessionId = req.params.id;

    const session = await db.get(
      `SELECT sess.*, c.class_name, c.schedule_time, c.classroom, sub.subject_name, sub.subject_code
       FROM attendance_sessions sess
       JOIN classes c ON sess.class_id = c.id
       JOIN subjects sub ON c.subject_id = sub.id
       WHERE sess.id = ?`,
      [sessionId]
    );

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    const totalEnrolledRow = await db.get(`SELECT COUNT(*) as count FROM students`);
    const totalEnrolled = Math.max(totalEnrolledRow.count || 0, 45);

    const presentStudents = await db.all(
      `SELECT 
        att.id as attendance_id,
        att.timestamp,
        att.status,
        att.verification_status,
        att.attendance_photo,
        s.student_id,
        u.name as student_name,
        s.course
       FROM attendance att
       JOIN students s ON att.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE att.session_id = ?
       ORDER BY att.timestamp DESC`,
      [sessionId]
    );

    const presentCount = presentStudents.length;
    const absentCount = totalEnrolled - presentCount;

    return res.json({
      success: true,
      session: {
        id: session.id,
        class_name: session.class_name,
        subject_name: session.subject_name,
        subject_code: session.subject_code,
        schedule_time: session.schedule_time,
        classroom: session.classroom,
        start_time: session.start_time,
        status: session.status,
        qr_code_token: session.qr_code_token,
        total_enrolled: totalEnrolled,
        present_count: presentCount,
        absent_count: absentCount,
        present_students: presentStudents
      }
    });
  } catch (err) {
    console.error('Live session error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch live session state.' });
  }
});

// Manual Mark / Edit Attendance
router.post('/attendance/manual', async (req, res) => {
  try {
    const db = await getDb();
    const { session_id, student_id, status } = req.body;

    if (!session_id || !student_id || !status) {
      return res.status(400).json({ success: false, message: 'session_id, student_id, and status are required.' });
    }

    const existing = await db.get(
      `SELECT id FROM attendance WHERE session_id = ? AND student_id = ?`,
      [session_id, student_id]
    );

    if (existing) {
      await db.run(
        `UPDATE attendance SET status = ?, verification_status = 'MANUAL_OVERRIDE' WHERE id = ?`,
        [status.toUpperCase(), existing.id]
      );
    } else {
      await db.run(
        `INSERT INTO attendance (session_id, student_id, status, verification_status) VALUES (?, ?, ?, 'MANUAL_OVERRIDE')`,
        [session_id, student_id, status.toUpperCase()]
      );
    }

    // Audit Log
    await db.run(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, reason) VALUES (?, 'MANUAL_ATTENDANCE_OVERRIDE', 'ATTENDANCE', ?, ?)`,
      [req.user.id, session_id, `Faculty manually updated student ID ${student_id} to status ${status}`]
    );

    return res.json({ success: true, message: 'Attendance status updated successfully.' });
  } catch (err) {
    console.error('Manual attendance error:', err);
    return res.status(500).json({ success: false, message: 'Failed to manually update attendance.' });
  }
});

// Teacher Attendance Reports
router.get('/reports', async (req, res) => {
  try {
    const db = await getDb();
    const teacher = req.teacher;

    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher profile not found.' });
    }

    // Aggregate attendance for students across teacher's classes
    const rows = await db.all(
      `SELECT 
        s.id as student_db_id,
        s.student_id,
        u.name as student_name,
        s.course,
        COUNT(att.id) as total_classes,
        SUM(CASE WHEN att.status = 'PRESENT' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN att.status = 'ABSENT' THEN 1 ELSE 0 END) as absent
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN attendance att ON att.student_id = s.id
       LEFT JOIN attendance_sessions sess ON att.session_id = sess.id AND sess.teacher_id = ?
       GROUP BY s.id
       ORDER BY u.name ASC`,
      [teacher.id]
    );

    const reports = rows.map(r => {
      const total = r.total_classes || 0;
      const present = r.present || 0;
      const absent = r.absent || 0;
      const pct = total > 0 ? parseFloat(((present / total) * 100).toFixed(1)) : 100;
      return {
        student_id: r.student_id,
        student_name: r.student_name,
        course: r.course,
        total_classes: total,
        present,
        absent,
        attendance_percentage: pct
      };
    });

    return res.json({ success: true, reports });
  } catch (err) {
    console.error('Teacher reports error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch teacher reports.' });
  }
});

export default router;
