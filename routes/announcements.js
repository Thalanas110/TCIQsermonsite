const express = require('express');
const { db, announcements } = require('../config/database');
const { desc, eq } = require('drizzle-orm');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all active announcements (public)
router.get('/', async (req, res) => {
  try {
    const announcementsList = await db.select()
      .from(announcements)
      .where(eq(announcements.is_active, true))
      .orderBy(desc(announcements.created_at));
    
    res.json(announcementsList);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Get all announcements (admin only)
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const announcementsList = await db.select()
      .from(announcements)
      .orderBy(desc(announcements.created_at));
    
    res.json(announcementsList);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Create announcement (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, content, image_data, image_name } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Validate image size if provided (100KB limit)
    if (image_data) {
      const sizeInBytes = Buffer.byteLength(image_data, 'base64');
      const sizeInKB = sizeInBytes / 1024;
      
      if (sizeInKB > 100) {
        return res.status(400).json({ error: 'Image size must not exceed 100KB' });
      }
    }

    const [newAnnouncement] = await db.insert(announcements)
      .values({
        title,
        content,
        image_data,
        image_name
      })
      .returning();

    res.status(201).json(newAnnouncement);
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// Update announcement (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, is_active } = req.body;

    const [updatedAnnouncement] = await db.update(announcements)
      .set({
        title,
        content,
        is_active,
        updated_at: new Date()
      })
      .where(eq(announcements.id, parseInt(id)))
      .returning();

    if (!updatedAnnouncement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json(updatedAnnouncement);
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

// Delete announcement (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const [deletedAnnouncement] = await db.delete(announcements)
      .where(eq(announcements.id, parseInt(id)))
      .returning();

    if (!deletedAnnouncement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

module.exports = router;