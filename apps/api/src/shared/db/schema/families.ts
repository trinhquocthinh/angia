import { sql } from 'drizzle-orm';
import { check, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { newId } from './newId.js';

// Không dùng columns.ts để tránh vòng import (familyIdColumn tham chiếu bảng này).
export const families = pgTable(
  'families',
  {
    id: uuid('id').primaryKey().$defaultFn(newId),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    // SPEC-031 (lịch sử): trần USD gia đình cũ; CP5.7 gỡ API, cột giữ làm dữ liệu lịch sử.
    extractionCapUsd: numeric('extraction_cap_usd', { precision: 10, scale: 2 }),
  },
  (table) => [
    check(
      'families_extraction_cap_range',
      sql`${table.extractionCapUsd} IS NULL OR ${table.extractionCapUsd} BETWEEN 0 AND 100`,
    ),
  ],
);
