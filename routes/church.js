const express = require('express');
const { db, church_info } = require('../config/database');
const { eq } = require('drizzle-orm');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get church information (public)
router.get('/', async (req, res) => {
  try {
    const info = await db.select().from(church_info)
      .limit(1);
    
    if (info.length === 0) {
      // Return default church info if none exists
      return res.json({
        name: 'The Church of Inspiration and Quantum',
        mission: 'Bringing faith and community together through modern worship and timeless values.',
        address: '123 Faith Street, Community City, CC 12345',
        phone: '(555) 123-4567',
        email: 'info@tciq.church',
        pastor: 'Pastor John Smith',
        service_times: 'Sunday: 9:00 AM & 11:00 AM\nWednesday: 7:00 PM',
        description: 'Welcome to our church family! We are a community of believers dedicated to worship, fellowship, and service to others.'
      });
    }
    
    res.json(info[0]);
  } catch (error) {
    console.error('Error fetching church info:', error);
    res.status(500).json({ error: 'Failed to fetch church information' });
  }
});

// Update church information (admin only)
router.put('/', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      mission,
      address,
      phone,
      email,
      pastor,
      service_times,
      description
    } = req.body;

    // Check if church info exists
    const existing = await db.select().from(church_info).limit(1);

    let result;
    if (existing.length === 0) {
      // Insert new church info
      result = await db.insert(church_info).values({
        name,
        mission,
        address,
        phone,
        email,
        pastor,
        service_times,
        description
      }).returning();
    } else {
      // Update existing church info
      result = await db.update(church_info)
        .set({
          name,
          mission,
          address,
          phone,
          email,
          pastor,
          service_times,
          description,
          updated_at: new Date()
        })
        .where(eq(church_info.id, existing[0].id))
        .returning();
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Error updating church info:', error);
    res.status(500).json({ error: 'Failed to update church information' });
  }
});

module.exports = router;
