import { sql } from 'drizzle-orm';
import { type AnyPgColumn, check, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts.js';
import { newId } from './newId.js';

// Không dùng columns.ts để tránh vòng import (familyIdColumn tham chiếu bảng này).
export const families = pgTable(
  'families',
  {
    id: uuid('id').primaryKey().$defaultFn(newId),
    name: text('name').notNull(),
    // Nullable trong chuyển tiếp E27-S2; backfill theo mapping owner ở E27-S6.
    ownerAccountId: uuid('owner_account_id').references((): AnyPgColumn => accounts.id),
    lastMemberRemovedAt: timestamp('last_member_removed_at', { withTimezone: true }),
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
