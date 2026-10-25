import { sql } from 'drizzle-orm';
import { check, numeric, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

// BR-018: chi phí OCR theo tháng dương lịch Asia/Ho_Chi_Minh. Bảng quản trị phi y tế nên không áp RLS
// (Tech Spec §3). spent_usd gồm cả phần đang giữ chỗ (extraction_reservations) để nhiều worker không vượt trần.
export const extractionSpend = pgTable(
  'extraction_spend',
  {
    month: text('month').primaryKey(),
    spentUsd: numeric('spent_usd', { precision: 10, scale: 6 }).notNull().default('0'),
    capUsd: numeric('cap_usd', { precision: 10, scale: 2 }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('extraction_spend_month_format', sql`${table.month} ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'`),
    check('extraction_spend_spent_non_negative', sql`${table.spentUsd} >= 0`),
    check('extraction_spend_cap_non_negative', sql`${table.capUsd} >= 0`),
  ],
);
