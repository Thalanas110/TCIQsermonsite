const express = require('express');
const { db, videos, comments, church_info } = require('../config/database');
const { count, sql } = require('drizzle-orm');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Admin credentials
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      req.session.isAdmin = true;
      res.json({ message: 'Login successful', isAdmin: true });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Check auth status
router.get('/auth-status', (req, res) => {
  res.json({ isAdmin: !!req.session.isAdmin });
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logout successful' });
  });
});

// Get dashboard statistics (admin only)
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const [videoCount] = await db.select({ count: count() }).from(videos);
    const [commentCount] = await db.select({ count: count() }).from(comments);
    
    // Get total views
    const [totalViews] = await db.select({ 
      total: sql`sum(${videos.views})` 
    }).from(videos);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoString = sevenDaysAgo.toISOString();

    const [recentVideos] = await db.select({ count: count() }).from(videos)
      .where(sql`${videos.created_at} > ${sevenDaysAgoString}`);

    const [recentComments] = await db.select({ count: count() }).from(comments)
      .where(sql`${comments.created_at} > ${sevenDaysAgoString}`);

    res.json({
      totalVideos: videoCount.count,
      totalComments: commentCount.count,
      totalViews: totalViews.total,
      recentVideos: recentVideos.count,
      recentComments: recentComments.count
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
