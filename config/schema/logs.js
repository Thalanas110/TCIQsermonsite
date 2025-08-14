import { pgTable, serial, timestamp, varchar, text } from 'drizzle-orm/pg-core';

export const system_logs = pgTable('system_logs', {
    id: serial('id').primaryKey(),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
    level: varchar('level', { length: 20 }).notNull(),
    category: varchar('category', { length: 50 }).notNull(),
    message: text('message').notNull(),
    details: text('details'),
    created_at: timestamp('created_at').defaultNow().notNull()
});
