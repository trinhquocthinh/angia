import { sql } from 'drizzle-orm';
import { bigint, check, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts.js';
import { familyIdColumn, familyIsolationPolicy, idColumn } from './columns.js';
import { scanQuotaMonths } from './scanQuotaMonths.js';
export const scanQuotaAudit = pgTable(
  'scan_quota_audit',
  {
    id: idColumn(),
    familyId: familyIdColumn(),
    month: text('month')
      .notNull()
      .references(() => scanQuotaMonths.month),
    version: bigint('version', { mode: 'number' }).notNull(),
    actorId: uuid('actor_id')
      .notNull()
      .references(() => accounts.id),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    before: jsonb('before'),
    after: jsonb('after').notNull(),
    reason: text('reason').notNull(),
  },
  (table) => [
    check('scan_quota_audit_version', sql`${table.version} BETWEEN 1 AND 9007199254740991`),
    check('scan_quota_audit_reason', sql`length(btrim(${table.reason})) BETWEEN 1 AND 500`),
    familyIsolationPolicy(),
  ],
);
