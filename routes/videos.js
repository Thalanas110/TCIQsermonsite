const express = require('express');
const multer = require('multer');
const { db, videos } = require('../config/database');
const { eq, desc } = require('drizzle-orm');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Configure multer for video uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// Get all videos (public)
router.get('/', async (req, res) => {
  try {
    const allVideos = await db.select().from(videos)
      .where(eq(videos.is_active, true))
      .orderBy(desc(videos.created_at));
    
    res.json(allVideos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Get single video (public)
router.get('/:id', async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    const video = await db.select().from(videos)
      .where(eq(videos.id, videoId))
      .limit(1);
    
    if (video.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Increment view count
    await db.update(videos)
      .set({ views: video[0].views + 1 })
      .where(eq(videos.id, videoId));

    res.json(video[0]);
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});

// Create new video (admin only)
router.post('/', authMiddleware, upload.single('video'), async (req, res) => {
  try {
    const { title, description, type, youtube_url } = req.body;
    
    let videoUrl = '';
    let thumbnail = '';

    if (type === 'youtube') {
      videoUrl = youtube_url;
      // Extract YouTube video ID for thumbnail
      const videoId = youtube_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      if (videoId) {
        thumbnail = `https://img.youtube.com/vi/${videoId[1]}/maxresdefault.jpg`;
      }
    } else if (type === 'mp4' && req.file) {
      // For now, we'll just store a placeholder URL for MP4 files
      // In a real implementation, you would upload to your chosen storage service
      videoUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      thumbnail = 'https://pixabay.com/get/g19f27ae6d6665ef093964663986e560ee7343197bf724b782699380b887a161a86bbcd97fa9a13c340adda4ff0deb7cbefa28802c2b0885364532461d4eacd63_1280.jpg';
    } else {
      return res.status(400).json({ error: 'Invalid video type or missing file' });
    }

    const newVideo = await db.insert(videos).values({
      title,
      description,
      type,
      url: videoUrl,
      thumbnail
    }).returning();

    res.status(201).json(newVideo[0]);
  } catch (error) {
    console.error('Error creating video:', error);
    res.status(500).json({ error: 'Failed to create video' });
  }
});

// Update video (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    const { title, description } = req.body;

    const updatedVideo = await db.update(videos)
      .set({ 
        title, 
        description, 
        updated_at: new Date() 
      })
      .where(eq(videos.id, videoId))
      .returning();

    if (updatedVideo.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json(updatedVideo[0]);
  } catch (error) {
    console.error('Error updating video:', error);
    res.status(500).json({ error: 'Failed to update video' });
  }
});

// Delete video (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);

    const deletedVideo = await db.update(videos)
      .set({ is_active: false })
      .where(eq(videos.id, videoId))
      .returning();

    if (deletedVideo.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

module.exports = router;
