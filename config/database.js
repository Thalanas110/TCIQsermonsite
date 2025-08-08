const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { pgTable, serial, text, timestamp, boolean, integer } = require('drizzle-orm/pg-core');

// Get database URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

// Create the database client
let queryClient;
try {
  const connectionConfig = {
    user: 'postgres.lwoexrfrjsbcpgdqavpn',
    password: 'Dimate101%!',
    host: 'aws-0-ap-southeast-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false
    },
    max: 1
  };
  queryClient = new Pool(connectionConfig);
} catch (error) {
  console.error('Database connection error:', error);
  // Fallback to direct URL
  queryClient = postgres(DATABASE_URL, {
    ssl: { rejectUnauthorized: false },
    port: PORT,
    max: 1,
    keepAlive: true
  });
}
const db = drizzle(queryClient);

// Add a raw query method for database initialization
db.execute = async (query) => {
  return await queryClient.query(query);
};

// Define database schema
const videos = pgTable('videos', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  type: text('type').notNull(), // 'youtube' or 'mp4'
  url: text('url').notNull(),
  thumbnail: text('thumbnail'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  views: integer('views').default(0),
  is_active: boolean('is_active').default(true)
});

const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  video_id: integer('video_id').references(() => videos.id),
  commenter_name: text('commenter_name').notNull(),
  content: text('content').notNull(),
  device_fingerprint: text('device_fingerprint').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  is_banned: boolean('is_banned').default(false)
});

const banned_devices = pgTable('banned_devices', {
  id: serial('id').primaryKey(),
  device_fingerprint: text('device_fingerprint').unique().notNull(),
  banned_at: timestamp('banned_at').defaultNow().notNull(),
  reason: text('reason')
});

const church_info = pgTable('church_info', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  mission: text('mission'),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  pastor: text('pastor'),
  service_times: text('service_times'),
  description: text('description'),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

module.exports = {
  db,
  videos,
  comments,
  banned_devices,
  church_info
};
