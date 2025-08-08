const { db } = require('./database');

async function initializeDatabase() {
  try {
    console.log('Initializing database tables...');
    
    // Create tables using raw SQL queries
    await db.execute(`
      CREATE TABLE IF NOT EXISTS videos (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        url TEXT NOT NULL,
        thumbnail TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        views INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        video_id INTEGER REFERENCES videos(id),
        commenter_name TEXT NOT NULL,
        content TEXT NOT NULL,
        device_fingerprint TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        is_banned BOOLEAN DEFAULT FALSE
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS banned_devices (
        id SERIAL PRIMARY KEY,
        device_fingerprint TEXT UNIQUE NOT NULL,
        banned_at TIMESTAMP DEFAULT NOW() NOT NULL,
        reason TEXT
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS church_info (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        mission TEXT,
        address TEXT,
        phone TEXT,
        email TEXT,
        pastor TEXT,
        service_times TEXT,
        description TEXT,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    console.log('Database tables initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

module.exports = { initializeDatabase };