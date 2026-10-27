import { sql } from 'drizzle-orm';
import { check, numeric, pgTable, text } from 'drizzle-orm/pg-core';
// Ảnh chụp toàn hệ thống; không đọc xuyên RLS để tính lại từ các gia đình.
export const scanQuotaMonths = pgTable(
  'scan_quota_months',
  {
    month: text('month').primaryKey(),
    committedRemainingScans: numeric('committed_remaining_scans').notNull().default('0'),
  },
  (table) => [
    check('scan_quota_months_month', sql`${table.month} ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'`),
    check(
      'scan_quota_months_committed',
      sql`${table.committedRemainingScans} >= 0 AND ${table.committedRemainingScans} < 'Infinity'::numeric AND ${table.committedRemainingScans} = trunc(${table.committedRemainingScans})`,
    ),
  ],
);
