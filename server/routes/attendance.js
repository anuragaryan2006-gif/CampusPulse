import express from 'express';
import { getDb } from '../../db/init.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { VerificationEngine } from '../services/verificationEngine.js';

const router = express.Router();

// Mark Attendance (Camera Capture or QR Token Submission)
router.post('/mark', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const db = await getDb();
    const student = req.student;
    const { session_id, photo_base64, qr_token, location_data } = req.body;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required session_id.'
      });
    }

    if (!photo_base64 && !qr_token) {
      return res.status(400).json({
        success: false,
        message: 'Please provide camera photo_base64 or a valid session QR token.'
      });
    }

    // 1. Verify Active Session
    const session = await db.get(
      `SELECT sess.*, c.class_name, sub.subject_name, sub.subject_code
       FROM attendance_sessions sess
       JOIN classes c ON sess.class_id = c.id
       JOIN subjects sub ON c.subject_id = sub.id
       WHERE sess.id = ?`,
      [session_id]
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Attendance session not found.'
      });
    }

    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This attendance session is no longer active.'
      });
    }

    // If QR code token provided, validate token
    if (qr_token) {
      if (session.qr_code_token && session.qr_code_token !== qr_token.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired session QR code token.'
        });
      }
    }

    // 2. Prevent Duplicate Attendance
    const existing = await db.get(
      `SELECT * FROM attendance WHERE session_id = ? AND student_id = ?`,
      [session_id, student.id]
    );

    if (existing) {
      const formattedDate = new Date(existing.timestamp).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      const formattedTime = new Date(existing.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      return res.status(409).json({
        success: false,
        code: 'ALREADY_MARKED',
        message: 'Your attendance has already been marked for this class.',
        details: {
          subject_name: session.subject_name,
          date: formattedDate,
          time: formattedTime,
          status: existing.status
        }
      });
    }

    // 3. Verification Engine Check (If photo provided)
    let verificationStatus = qr_token ? 'QR_VERIFIED' : 'VERIFIED';
    let verificationMode = qr_token ? 'QR_ASSISTED' : 'LIVE_CAMERA';
    let confidence = 96.5;
    const finalPhoto = photo_base64 || student.profile_photo;

    if (photo_base64) {
      const deviceMeta = {
        ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'Mobile Browser',
        location: location_data || null
      };

      const verificationResult = await VerificationEngine.verifyAttendancePhoto({
        capturedImageBase64: photo_base64,
        referenceProfilePhoto: student.profile_photo,
        sessionInfo: session,
        studentInfo: {
          id: student.id,
          student_id: student.student_id,
          name: req.user.name
        },
        deviceMeta
      });

      if (!verificationResult.verified) {
        return res.status(400).json({
          success: false,
          message: verificationResult.message || 'We could not verify your attendance photo. Please try again.'
        });
      }

      confidence = verificationResult.confidence;
      verificationMode = verificationResult.mode;
    }

    // 4. Record Attendance in DB
    const now = new Date();
    const result = await db.run(
      `INSERT INTO attendance (
        session_id, student_id, timestamp, status, verification_status, attendance_photo, device_info, ip_address, location_data
       ) VALUES (?, ?, ?, 'PRESENT', ?, ?, ?, ?, ?)`,
      [
        session_id,
        student.id,
        now.toISOString(),
        verificationStatus,
        finalPhoto,
        req.headers['user-agent'] || 'Mobile Device',
        req.ip || '127.0.0.1',
        JSON.stringify(location_data || {})
      ]
    );

    // Update student attendance streak count
    await db.run(
      `UPDATE students SET streak_count = streak_count + 1 WHERE id = ?`,
      [student.id]
    );

    const formattedDate = now.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const formattedTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return res.status(201).json({
      success: true,
      message: 'Attendance Marked Successfully',
      record: {
        id: result.lastID,
        student_name: req.user.name,
        student_id: student.student_id,
        subject_name: session.subject_name,
        subject_code: session.subject_code,
        date: formattedDate,
        time: formattedTime,
        status: 'PRESENT',
        photo: finalPhoto,
        confidence,
        verification_mode: verificationMode
      }
    });

  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({
        success: false,
        code: 'ALREADY_MARKED',
        message: 'Your attendance has already been marked for this class.'
      });
    }
    console.error('Attendance mark error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error while submitting attendance. Please try again.'
    });
  }
});

export default router;
