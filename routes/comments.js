const express = require('express');
const { db, comments, banned_devices } = require('../config/database');
const { eq, and, desc } = require('drizzle-orm');
const { generateFingerprint } = require('../utils/fingerprint');

// Authentication middleware
const checkAdmin = (req, res, next) => {
    if (!req.session || !req.session.isAdmin) {
        return res.status(401).json({ error: 'Unauthorized access' });
    }
    next();
};

const router = express.Router();

// Get comments for a video (public)
router.get('/video/:videoId', async (req, res) => {
  try {
    const videoId = parseInt(req.params.videoId);
    
    const videoComments = await db.select().from(comments)
      .where(and(
        eq(comments.video_id, videoId),
        eq(comments.is_banned, false)
      ))
      .orderBy(desc(comments.created_at));
    
    res.json(videoComments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Create new comment (public)
router.post('/', async (req, res) => {
  try {
    const { video_id, commenter_name, content } = req.body;
    const deviceFingerprint = generateFingerprint(req);

    // Check if device is banned
    const bannedDevice = await db.select().from(banned_devices)
      .where(eq(banned_devices.device_fingerprint, deviceFingerprint))
      .limit(1);

    if (bannedDevice.length > 0) {
      return res.status(403).json({ error: 'This device has been banned from commenting' });
    }

    const newComment = await db.insert(comments).values({
      video_id: parseInt(video_id),
      commenter_name,
      content,
      device_fingerprint: deviceFingerprint
    }).returning();

    res.status(201).json(newComment[0]);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Get all comments (admin only)
router.get('/', checkAdmin, async (req, res) => {
  try {
    const allComments = await db.select().from(comments)
      .orderBy(desc(comments.created_at));
    
    res.json(allComments);
  } catch (error) {
    console.error('Error fetching all comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Delete comment (admin only)
router.delete('/:id', checkAdmin, async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);

    const deletedComment = await db.delete(comments)
      .where(eq(comments.id, commentId))
      .returning();

    if (deletedComment.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Ban device (admin only)
router.post('/ban', checkAdmin, async (req, res) => {
  try {
    const { device_fingerprint, reason } = req.body;

    // Add to banned devices
    await db.insert(banned_devices).values({
      device_fingerprint,
      reason: reason || 'Inappropriate behavior'
    }).onConflictDoNothing();

    // Mark existing comments as banned
    await db.update(comments)
      .set({ is_banned: true })
      .where(eq(comments.device_fingerprint, device_fingerprint));

    res.json({ message: 'Device banned successfully' });
  } catch (error) {
    console.error('Error banning device:', error);
    res.status(500).json({ error: 'Failed to ban device' });
  }
});

// Unban device (admin only)
router.post('/unban', checkAdmin, async (req, res) => {
  try {
    const { device_fingerprint } = req.body;

    // Remove from banned devices
    await db.delete(banned_devices)
      .where(eq(banned_devices.device_fingerprint, device_fingerprint));

    // Unmark existing comments
    await db.update(comments)
      .set({ is_banned: false })
      .where(eq(comments.device_fingerprint, device_fingerprint));

    res.json({ message: 'Device unbanned successfully' });
  } catch (error) {
    console.error('Error unbanning device:', error);
    res.status(500).json({ error: 'Failed to unban device' });
  }
});

// Get banned devices (admin only)
router.get('/banned', checkAdmin, async (req, res) => {
  try {
    const bannedDevices = await db.select().from(banned_devices)
      .orderBy(desc(banned_devices.banned_at));
    
    res.json(bannedDevices);
  } catch (error) {
    console.error('Error fetching banned devices:', error);
    res.status(500).json({ error: 'Failed to fetch banned devices' });
  }
});

module.exports = router;
