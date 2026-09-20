import express from 'express';
import { getDb } from '../../db/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// Submit Correction Request (Student)
router.post('/', async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Only students can submit correction requests.' });
    }

    const db = await getDb();
    const student = req.student;
    const { session_id, reason } = req.body;

    if (!session_id || !reason || reason.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Please provide session_id and a valid reason.' });
    }

    // Check if session exists
    const session = await db.get('SELECT * FROM attendance_sessions WHERE id = ?', [session_id]);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Class session not found.' });
    }

    // Check duplicate request
    const existing = await db.get(
      'SELECT id FROM correction_requests WHERE student_id = ? AND session_id = ? AND status = "PENDING"',
      [student.id, session_id]
    );

    if (existing) {
      return res.status(400).json({ success: false, message: 'A pending correction request already exists for this session.' });
    }

    const result = await db.run(
      `INSERT INTO correction_requests (student_id, session_id, reason, status) VALUES (?, ?, ?, 'PENDING')`,
      [student.id, session_id, reason.trim()]
    );

    // Notify assigned teacher
    const classRow = await db.get('SELECT teacher_id FROM classes WHERE id = ?', [session.class_id]);
    if (classRow) {
      const teacherUser = await db.get('SELECT user_id FROM teachers WHERE id = ?', [classRow.teacher_id]);
      if (teacherUser) {
        await db.run(
          `INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'New Correction Request', ?, 'correction')`,
          [teacherUser.user_id, `${req.user.name} submitted an attendance correction request.`]
        );
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Correction request submitted successfully to faculty for review.',
      request_id: result.lastID
    });
  } catch (err) {
    console.error('Correction submit error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit correction request.' });
  }
});

// List Correction Requests
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    let query = `
      SELECT 
        cr.id,
        cr.reason,
        cr.status,
        cr.created_at,
        cr.reviewed_at,
        cr.review_note,
        s.student_id,
        u.name as student_name,
        sub.subject_name,
        sub.subject_code,
        sess.start_time as session_time,
        ru.name as reviewer_name
      FROM correction_requests cr
      JOIN students s ON cr.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN attendance_sessions sess ON cr.session_id = sess.id
      JOIN classes c ON sess.class_id = c.id
      JOIN subjects sub ON c.subject_id = sub.id
      LEFT JOIN users ru ON cr.reviewed_by = ru.id
    `;
    const params = [];

    if (req.user.role === 'student') {
      query += ` WHERE cr.student_id = ?`;
      params.push(req.student.id);
    } else if (req.user.role === 'teacher') {
      query += ` WHERE c.teacher_id = ?`;
      params.push(req.teacher.id);
    }

    query += ` ORDER BY cr.created_at DESC`;

    const requests = await db.all(query, params);
    return res.json({ success: true, requests });
  } catch (err) {
    console.error('List correction requests error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch correction requests.' });
  }
});

// Approve or Reject Correction Request (Teacher/Admin)
router.patch('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized. Requires faculty or admin access.' });
    }

    const db = await getDb();
    const requestId = req.params.id;
    const { action, review_note } = req.body; // action: 'APPROVE' or 'REJECT'

    if (!action || !['APPROVE', 'REJECT'].includes(action.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Action must be APPROVE or REJECT.' });
    }

    const request = await db.get('SELECT * FROM correction_requests WHERE id = ?', [requestId]);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Correction request not found.' });
    }

    const newStatus = action.toUpperCase() === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    await db.run(
      `UPDATE correction_requests SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, review_note = ? WHERE id = ?`,
      [newStatus, req.user.id, review_note || '', requestId]
    );

    // If APPROVED, update/insert attendance record
    if (newStatus === 'APPROVED') {
      const existingAtt = await db.get(
        'SELECT * FROM attendance WHERE session_id = ? AND student_id = ?',
        [request.session_id, request.student_id]
      );

      if (existingAtt) {
        await db.run(
          `UPDATE attendance SET status = 'PRESENT', verification_status = 'CORRECTION_APPROVED' WHERE id = ?`,
          [existingAtt.id]
        );
      } else {
        await db.run(
          `INSERT INTO attendance (session_id, student_id, status, verification_status) VALUES (?, ?, 'PRESENT', 'CORRECTION_APPROVED')`,
          [request.session_id, request.student_id]
        );
      }
    }

    // Write to Audit Log
    await db.run(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, reason) VALUES (?, ?, 'CORRECTION_REQUEST', ?, ?)`,
      [
        req.user.id,
        `CORRECTION_${newStatus}`,
        requestId,
        `Faculty ${req.user.name} ${newStatus.toLowerCase()} request. Note: ${review_note || 'None'}`
      ]
    );

    // Notify Student
    const studentUser = await db.get('SELECT user_id FROM students WHERE id = ?', [request.student_id]);
    if (studentUser) {
      await db.run(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'correction')`,
        [
          studentUser.user_id,
          `Correction Request ${newStatus}`,
          `Your attendance correction request was ${newStatus.toLowerCase()} by faculty.`
        ]
      );
    }

    return res.json({
      success: true,
      message: `Correction request ${newStatus.toLowerCase()} successfully.`
    });
  } catch (err) {
    console.error('Review correction request error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process correction request.' });
  }
});

export default router;
