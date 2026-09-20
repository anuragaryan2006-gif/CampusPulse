import jwt from 'jsonwebtoken';
import { CONFIG } from '../config.js';
import { getDb } from '../../db/init.js';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET);
    const db = await getDb();
    
    // Fetch user details
    const user = await db.get('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.id]);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid session or user no longer exists.' });
    }

    req.user = user;

    // Attach student/teacher IDs if applicable
    if (user.role === 'student') {
      const student = await db.get('SELECT * FROM students WHERE user_id = ?', [user.id]);
      req.student = student;
    } else if (user.role === 'teacher') {
      const teacher = await db.get('SELECT * FROM teachers WHERE user_id = ?', [user.id]);
      req.teacher = teacher;
    }

    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of the following roles: ${roles.join(', ')}`
      });
    }
    next();
  };
}
