import express from 'express';
import { getDb } from '../../db/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// Get User Notifications
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const notifications = await db.all(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30`,
      [req.user.id]
    );
    const unreadCount = notifications.filter(n => !n.read).length;

    return res.json({
      success: true,
      unread_count: unreadCount,
      notifications
    });
  } catch (err) {
    console.error('Fetch notifications error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
});

// Mark Single Notification Read
router.patch('/:id/read', async (req, res) => {
  try {
    const db = await getDb();
    await db.run(
      `UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );
    return res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    console.error('Mark read error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
});

// Mark All Notifications Read
router.post('/read-all', async (req, res) => {
  try {
    const db = await getDb();
    await db.run(
      `UPDATE notifications SET read = 1 WHERE user_id = ?`,
      [req.user.id]
    );
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('Mark all read error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update notifications.' });
  }
});

export default router;
