const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { pgTable, serial, text, timestamp, boolean, integer } = require('drizzle-orm/pg-core');

// Get database URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Configure database connection
let queryClient;
try {
  const connectionString = encodeURI(DATABASE_URL);
  queryClient = postgres(connectionString, {
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
} catch (error) {
  console.error('Database connection error:', error);
  throw error;
}
const db = drizzle(queryClient);

// Add a raw query method for database initialization
db.execute = async (query) => {
  return await queryClient.unsafe(query);
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

const announcements = pgTable('announcements', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  image_data: text('image_data'),
  image_name: text('image_name'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  is_active: boolean('is_active').default(true)
});

const gallery = pgTable('gallery', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  image_data: text('image_data').notNull(),
  image_name: text('image_name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  is_active: boolean('is_active').default(true)
});

module.exports = {
  db,
  videos,
  comments,
  banned_devices,
  church_info,
  announcements,
  gallery
};
