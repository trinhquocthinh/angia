import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { familyIdColumn, familyIsolationPolicy } from './columns.js';

export const objectPurges = pgTable(
  'object_purges',
  {
    objectKey: text('object_key').primaryKey(),
    familyId: familyIdColumn(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
  },
  (table) => [index('object_purges_family_idx').on(table.familyId), familyIsolationPolicy()],
);
