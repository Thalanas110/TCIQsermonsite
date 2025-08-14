const express = require('express');
const { db, videos, comments, church_info } = require('../config/database');
const { count, sql } = require('drizzle-orm');
const authMiddleware = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Admin credentials
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const expectedUsername = ADMIN_USERNAME;
    const expectedPassword = ADMIN_PASSWORD;

    logger.debug(logger.categories.AUTH, 'Login attempt received', {
      providedUsername: username,
      usernameMatch: username === expectedUsername
    });

    if (username === expectedUsername && password === expectedPassword) {
      logger.info(logger.categories.AUTH, 'Successful admin login', {
        username: username,
        timestamp: new Date()
      });
      // Set session
      req.session.isAdmin = true;
      req.session.username = username;
      
      // Save session before responding
      req.session.save((err) => {
        if (err) {
          logger.error(logger.categories.AUTH, 'Failed to create session', {
            error: err.message,
            username: username
          });
          return res.status(500).json({ error: 'Failed to create session' });
        }
        res.json({ message: 'Login successful', isAdmin: true });
      });
    } else {
      logger.warning(logger.categories.AUTH, 'Failed login attempt', {
        username: username,
        ip: req.ip,
        timestamp: new Date()
      });
      res.status(401).json({ error: 'Invalid username or password' });
    }
  } catch (error) {
    logger.error(logger.categories.SYSTEM, 'Unexpected error during login', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

// Check auth status
router.get('/auth-status', (req, res) => {
  res.json({ isAdmin: !!req.session.isAdmin });
});

// Logout
router.post('/logout', (req, res) => {
  const username = req.session.username;
  req.session.destroy((err) => {
    if (err) {
      logger.error(logger.categories.AUTH, 'Logout failed', {
        error: err.message,
        username: username
      });
      return res.status(500).json({ error: 'Logout failed' });
    }
    logger.info(logger.categories.AUTH, 'Admin logout successful', {
      username: username,
      timestamp: new Date()
    });
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
      totalViews: totalViews.total || 0,
      recentVideos: recentVideos.count,
      recentComments: recentComments.count
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
