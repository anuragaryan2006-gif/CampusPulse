import express from 'express';
import { getDb } from '../../db/init.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken, requireRole('student'));

// Student Dashboard Summary
router.get('/dashboard', async (req, res) => {
  try {
    const db = await getDb();
    const student = req.student;

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    // Settings for thresholds
    const safeThresholdRow = await db.get(`SELECT value FROM settings WHERE key = 'attendance_threshold'`);
    const safeThreshold = safeThresholdRow ? parseInt(safeThresholdRow.value, 10) : 80;

    const criticalThresholdRow = await db.get(`SELECT value FROM settings WHERE key = 'critical_threshold'`);
    const criticalThreshold = criticalThresholdRow ? parseInt(criticalThresholdRow.value, 10) : 75;

    // Overall attendance stats
    const statsRow = await db.get(
      `SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) as absent_count
       FROM attendance 
       WHERE student_id = ?`,
      [student.id]
    );

    const presentCount = statsRow.present_count || 0;
    const absentCount = statsRow.absent_count || 0;
    const totalCount = statsRow.total_records || 0;
    const percentage = totalCount > 0 ? parseFloat(((presentCount / totalCount) * 100).toFixed(1)) : 100;

    let riskStatus = 'SAFE'; // SAFE | WARNING | CRITICAL
    if (percentage < criticalThreshold) riskStatus = 'CRITICAL';
    else if (percentage < safeThreshold) riskStatus = 'WARNING';

    // Today's schedule & active attendance sessions
    const classes = await db.all(
      `SELECT 
        c.id as class_id,
        c.class_name,
        c.schedule_time,
        c.classroom,
        sub.id as subject_id,
        sub.subject_name,
        sub.subject_code,
        u.name as teacher_name,
        sess.id as active_session_id,
        sess.status as session_status,
        sess.qr_code_token,
        att.id as marked_attendance_id,
        att.status as marked_status,
        att.timestamp as marked_timestamp
       FROM classes c
       JOIN subjects sub ON c.subject_id = sub.id
       JOIN teachers t ON c.teacher_id = t.id
       JOIN users u ON t.user_id = u.id
       LEFT JOIN attendance_sessions sess ON sess.class_id = c.id AND sess.status = 'active'
       LEFT JOIN attendance att ON att.session_id = sess.id AND att.student_id = ?`,
      [student.id]
    );

    const todayDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return res.json({
      success: true,
      dashboard: {
        student_name: req.user.name,
        student_id: student.student_id,
        course: student.course,
        semester: student.semester,
        department_name: student.department_name || 'Computer Applications',
        profile_photo: student.profile_photo,
        streak_count: student.streak_count || 7,
        today_date: todayDate,
        thresholds: {
          safe: safeThreshold,
          critical: criticalThreshold
        },
        stats: {
          percentage,
          present_count: presentCount,
          absent_count: absentCount,
          total_classes: totalCount,
          risk_status: riskStatus
        },
        today_classes: classes.map(cls => ({
          class_id: cls.class_id,
          subject_name: cls.subject_name,
          subject_code: cls.subject_code,
          teacher_name: cls.teacher_name,
          schedule_time: cls.schedule_time,
          classroom: cls.classroom || 'Lab 302',
          has_active_session: Boolean(cls.active_session_id),
          active_session_id: cls.active_session_id,
          qr_code_token: cls.qr_code_token,
          already_marked: Boolean(cls.marked_attendance_id),
          marked_status: cls.marked_status,
          marked_timestamp: cls.marked_timestamp
        }))
      }
    });
  } catch (err) {
    console.error('Student dashboard error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load student dashboard.' });
  }
});

// Pulse Insights & Attendance Recovery Calculator
router.get('/insights', async (req, res) => {
  try {
    const db = await getDb();
    const student = req.student;

    const safeThresholdRow = await db.get(`SELECT value FROM settings WHERE key = 'attendance_threshold'`);
    const safeThreshold = safeThresholdRow ? parseInt(safeThresholdRow.value, 10) : 80;

    const subjects = await db.all(
      `SELECT 
        sub.id as subject_id,
        sub.subject_name,
        sub.subject_code,
        COUNT(att.id) as total_classes,
        SUM(CASE WHEN att.status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN att.status = 'ABSENT' THEN 1 ELSE 0 END) as absent_count
       FROM subjects sub
       JOIN classes c ON c.subject_id = sub.id
       JOIN attendance_sessions sess ON sess.class_id = c.id
       LEFT JOIN attendance att ON att.session_id = sess.id AND att.student_id = ?
       GROUP BY sub.id`,
      [student.id]
    );

    const insights = [];
    const recoveryCalculations = [];

    subjects.forEach(s => {
      const total = s.total_classes || 0;
      const present = s.present_count || 0;
      const pct = total > 0 ? parseFloat(((present / total) * 100).toFixed(1)) : 100;

      // Calculate required future classes to reach target (e.g. 80%)
      const targetPctDecimal = safeThreshold / 100;
      let requiredClasses = 0;

      if (pct < safeThreshold && total > 0) {
        // (present + x) / (total + x) >= target
        // x >= (target * total - present) / (1 - target)
        const numerator = targetPctDecimal * total - present;
        const denominator = 1 - targetPctDecimal;
        requiredClasses = Math.ceil(numerator / denominator);
      }

      recoveryCalculations.push({
        subject_id: s.subject_id,
        subject_name: s.subject_name,
        subject_code: s.subject_code,
        current_percentage: pct,
        present_count: present,
        total_classes: total,
        target_threshold: safeThreshold,
        required_consecutive_classes: Math.max(0, requiredClasses),
        is_above_threshold: pct >= safeThreshold
      });

      if (pct < safeThreshold && total > 0) {
        insights.push({
          type: 'warning',
          title: `${s.subject_name} Below Threshold`,
          text: `Your attendance in ${s.subject_name} is ${pct}%, below the ${safeThreshold}% campus threshold. Attend ${requiredClasses} consecutive upcoming classes to recover.`
        });
      } else if (pct >= 90 && total > 0) {
        insights.push({
          type: 'praise',
          title: `Excellent Standing in ${s.subject_code}`,
          text: `You have an outstanding ${pct}% attendance rate in ${s.subject_name} (${present} of ${total} classes attended).`
        });
      }
    });

    return res.json({
      success: true,
      streak_count: student.streak_count || 7,
      safe_threshold: safeThreshold,
      insights,
      recoveryCalculations
    });
  } catch (err) {
    console.error('Fetch insights error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch Pulse Insights.' });
  }
});

// Subject-Wise Attendance Overview
router.get('/subjects', async (req, res) => {
  try {
    const db = await getDb();
    const student = req.student;

    const subjects = await db.all(
      `SELECT 
        sub.id as subject_id,
        sub.subject_name,
        sub.subject_code,
        COUNT(att.id) as total_classes,
        SUM(CASE WHEN att.status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN att.status = 'ABSENT' THEN 1 ELSE 0 END) as absent_count
       FROM subjects sub
       JOIN classes c ON c.subject_id = sub.id
       JOIN attendance_sessions sess ON sess.class_id = c.id
       LEFT JOIN attendance att ON att.session_id = sess.id AND att.student_id = ?
       GROUP BY sub.id`,
      [student.id]
    );

    const formattedSubjects = subjects.map(s => {
      const total = s.total_classes || 0;
      const present = s.present_count || 0;
      const absent = s.absent_count || 0;
      const pct = total > 0 ? parseFloat(((present / total) * 100).toFixed(1)) : 100;

      let status = 'good';
      if (pct < 75) status = 'low';
      else if (pct < 80) status = 'warning';

      return {
        subject_id: s.subject_id,
        subject_name: s.subject_name,
        subject_code: s.subject_code,
        present_count: present,
        absent_count: absent,
        total_classes: total,
        percentage: pct,
        status_level: status
      };
    });

    return res.json({ success: true, subjects: formattedSubjects });
  } catch (err) {
    console.error('Student subjects error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch subject attendance.' });
  }
});

// Student Attendance History Log
router.get('/history', async (req, res) => {
  try {
    const db = await getDb();
    const student = req.student;
    const { subject_id, status } = req.query;

    let query = `
      SELECT 
        att.id,
        att.timestamp,
        att.status,
        att.verification_status,
        att.attendance_photo,
        sess.id as session_id,
        sub.subject_name,
        sub.subject_code,
        c.class_name,
        u.name as teacher_name
      FROM attendance att
      JOIN attendance_sessions sess ON att.session_id = sess.id
      JOIN classes c ON sess.class_id = c.id
      JOIN subjects sub ON c.subject_id = sub.id
      JOIN teachers t ON sess.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE att.student_id = ?
    `;

    const params = [student.id];

    if (subject_id) {
      query += ` AND sub.id = ?`;
      params.push(subject_id);
    }

    if (status) {
      query += ` AND att.status = ?`;
      params.push(status.toUpperCase());
    }

    query += ` ORDER BY att.timestamp DESC`;

    const history = await db.all(query, params);

    return res.json({ success: true, history });
  } catch (err) {
    console.error('Student history error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch attendance history.' });
  }
});

export default router;
