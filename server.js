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

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static files
app.use(express.static('public'));

// API Routes
app.use('/api/videos', videosRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/church', churchRouter);

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

app.listen(PORT, 'localhost', async () => {
  console.log(`Church vlogsite server running on port ${PORT}`);
  
  // Initialize database tables
  await initializeDatabase();
});
