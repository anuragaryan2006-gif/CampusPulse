import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../../db/init.js';
import { CONFIG } from '../config.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
    }

    let extraDetails = {};
    if (user.role === 'student') {
      extraDetails.student = await db.get(
        `SELECT s.*, d.name as department_name 
         FROM students s 
         LEFT JOIN departments d ON s.department_id = d.id 
         WHERE s.user_id = ?`,
        [user.id]
      );
    } else if (user.role === 'teacher') {
      extraDetails.teacher = await db.get(
        `SELECT t.*, d.name as department_name 
         FROM teachers t 
         LEFT JOIN departments d ON t.department_id = d.id 
         WHERE t.user_id = ?`,
        [user.id]
      );
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      CONFIG.JWT_SECRET,
      { expiresIn: CONFIG.JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        ...extraDetails
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
});

// Register (Student registration)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, student_id, department_id, course, semester } = req.body;

    if (!name || !email || !password || !student_id) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
    }

    const db = await getDb();

    // Check existing
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const existingStudentId = await db.get('SELECT id FROM students WHERE student_id = ?', [student_id.trim()]);
    if (existingStudentId) {
      return res.status(400).json({ success: false, message: 'This Student ID is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userRes = await db.run(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'student')`,
      [name, email.toLowerCase().trim(), hashedPassword]
    );

    await db.run(
      `INSERT INTO students (user_id, student_id, department_id, course, semester) VALUES (?, ?, ?, ?, ?)`,
      [
        userRes.lastID,
        student_id.trim(),
        department_id || 1,
        course || 'BCA 2nd Year',
        semester || 3
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Registration successful. You can now log in.'
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during registration.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  const db = await getDb();
  let extraDetails = {};

  if (req.user.role === 'student') {
    extraDetails.student = await db.get(
      `SELECT s.*, d.name as department_name 
       FROM students s 
       LEFT JOIN departments d ON s.department_id = d.id 
       WHERE s.user_id = ?`,
      [req.user.id]
    );
  } else if (req.user.role === 'teacher') {
    extraDetails.teacher = await db.get(
      `SELECT t.*, d.name as department_name 
       FROM teachers t 
       LEFT JOIN departments d ON t.department_id = d.id 
       WHERE t.user_id = ?`,
      [req.user.id]
    );
  }

  return res.json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      ...extraDetails
    }
  });
});

export default router;
