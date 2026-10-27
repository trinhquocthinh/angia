import { sql } from 'drizzle-orm';
import { bigint, check, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts.js';
import { familyIdColumn, familyIsolationPolicy } from './columns.js';
import { scanQuotaMonths } from './scanQuotaMonths.js';
export const familyScanQuotas = pgTable(
  'family_scan_quotas',
  {
    familyId: familyIdColumn(),
    month: text('month')
      .notNull()
      .references(() => scanQuotaMonths.month),
    status: text('status').notNull(),
    grantedScans: bigint('granted_scans', { mode: 'number' }).notNull(),
    usedScans: bigint('used_scans', { mode: 'number' }).notNull().default(0),
    heldScans: bigint('held_scans', { mode: 'number' }).notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
    updatedBy: uuid('updated_by')
      .notNull()
      .references(() => accounts.id),
  },
  (table) => [
    primaryKey({ columns: [table.familyId, table.month] }),
    check('family_scan_quotas_status', sql`${table.status} IN ('trial', 'approved')`),
    check(
      'family_scan_quotas_counts',
      sql`${table.grantedScans} BETWEEN 0 AND 9007199254740991 AND ${table.usedScans} >= 0 AND ${table.heldScans} >= 0 AND ${table.usedScans} + ${table.heldScans} <= ${table.grantedScans}`,
    ),
    familyIsolationPolicy(),
  ],
);
