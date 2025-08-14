require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const session = require('express-session');
const { initializeDatabase } = require('./config/init-db');

const videosRouter = require('./routes/videos');
const commentsRouter = require('./routes/comments');
const adminRouter = require('./routes/admin');
const churchRouter = require('./routes/church');
const announcementsRouter = require('./routes/announcements');
const galleryRouter = require('./routes/gallery');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'church_vlog_secret_key_2024',
  resave: true,
  rolling: true,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true in production with HTTPS
    maxAge: 5 * 60 * 1000 // 5 minutes
  }
}));

// Serve static files with proper MIME types
app.use(express.static('public', {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.set('Content-Type', 'application/javascript');
    }
  }
}));

// API Routes
app.use('/api/videos', videosRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/church', churchRouter);
app.use('/api/announcements', announcementsRouter);
app.use('/api/gallery', galleryRouter);

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/information', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'information.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Church vlogsite server running on port ${PORT}`);
  
  // Initialize database tables
  await initializeDatabase();
});
