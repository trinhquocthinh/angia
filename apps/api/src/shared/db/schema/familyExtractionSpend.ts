import { sql } from 'drizzle-orm';
import { check, numeric, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';
import { familyIdColumn, familyIsolationPolicy } from './columns.js';
import { extractionSpend } from './extractionSpend.js';

// SPEC-031 (F03b đợt 2): chi phí OCR của từng gia đình theo tháng ngân sách, gồm cả phần đang giữ chỗ;
// worker giữ chỗ dòng này trước rồi tới extraction_spend (thứ tự khóa cố định). RLS như dữ liệu gia đình.
export const familyExtractionSpend = pgTable(
  'family_extraction_spend',
  {
    familyId: familyIdColumn(),
    month: text('month')
      .notNull()
      .references(() => extractionSpend.month),
    spentUsd: numeric('spent_usd', { precision: 10, scale: 6 }).notNull().default('0'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.familyId, table.month] }),
    check('family_extraction_spend_spent_non_negative', sql`${table.spentUsd} >= 0`),
    familyIsolationPolicy(),
  ],
);
