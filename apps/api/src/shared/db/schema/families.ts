import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { newId } from './newId.js';

// Không dùng columns.ts để tránh vòng import (familyIdColumn tham chiếu bảng này).
export const families = pgTable('families', {
  id: uuid('id').primaryKey().$defaultFn(newId),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
