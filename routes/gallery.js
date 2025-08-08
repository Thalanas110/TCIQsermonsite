const express = require('express');
const { db, gallery } = require('../config/database');
const { desc, eq } = require('drizzle-orm');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all active gallery images (public)
router.get('/', async (req, res) => {
  try {
    const galleryItems = await db.select()
      .from(gallery)
      .where(eq(gallery.is_active, true))
      .orderBy(desc(gallery.created_at));
    
    res.json(galleryItems);
  } catch (error) {
    console.error('Error fetching gallery:', error);
    res.status(500).json({ error: 'Failed to fetch gallery' });
  }
});

// Get all gallery images (admin only)
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const galleryItems = await db.select()
      .from(gallery)
      .orderBy(desc(gallery.created_at));
    
    res.json(galleryItems);
  } catch (error) {
    console.error('Error fetching gallery:', error);
    res.status(500).json({ error: 'Failed to fetch gallery' });
  }
});

// Add gallery image (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, image_data, image_name } = req.body;
    
    if (!title || !image_data || !image_name) {
      return res.status(400).json({ error: 'Title, image data, and image name are required' });
    }

    // Validate image size (100KB limit)
    const sizeInBytes = Buffer.byteLength(image_data, 'base64');
    const sizeInKB = sizeInBytes / 1024;
    
    if (sizeInKB > 100) {
      return res.status(400).json({ error: 'Image size must not exceed 100KB' });
    }

    const [newGalleryItem] = await db.insert(gallery)
      .values({
        title,
        description,
        image_data,
        image_name
      })
      .returning();

    res.status(201).json(newGalleryItem);
  } catch (error) {
    console.error('Error adding gallery item:', error);
    res.status(500).json({ error: 'Failed to add gallery item' });
  }
});

// Update gallery item (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, is_active } = req.body;

    const [updatedGalleryItem] = await db.update(gallery)
      .set({
        title,
        description,
        is_active
      })
      .where(eq(gallery.id, parseInt(id)))
      .returning();

    if (!updatedGalleryItem) {
      return res.status(404).json({ error: 'Gallery item not found' });
    }

    res.json(updatedGalleryItem);
  } catch (error) {
    console.error('Error updating gallery item:', error);
    res.status(500).json({ error: 'Failed to update gallery item' });
  }
});

// Delete gallery item (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const [deletedGalleryItem] = await db.delete(gallery)
      .where(eq(gallery.id, parseInt(id)))
      .returning();

    if (!deletedGalleryItem) {
      return res.status(404).json({ error: 'Gallery item not found' });
    }

    res.json({ message: 'Gallery item deleted successfully' });
  } catch (error) {
    console.error('Error deleting gallery item:', error);
    res.status(500).json({ error: 'Failed to delete gallery item' });
  }
});

module.exports = router;