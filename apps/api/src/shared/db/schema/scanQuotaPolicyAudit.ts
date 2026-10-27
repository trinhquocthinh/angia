import { sql } from 'drizzle-orm';
import { bigint, check, jsonb, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts.js';
import type { ScanQuotaPolicy } from '@angia/contracts';
export const scanQuotaPolicyAudit = pgTable(
  'scan_quota_policy_audit',
  {
    version: bigint('version', { mode: 'number' }).primaryKey(),
    actorId: uuid('actor_id')
      .notNull()
      .references(() => accounts.id),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    before: jsonb('before').$type<ScanQuotaPolicy>(),
    after: jsonb('after').$type<ScanQuotaPolicy>().notNull(),
  },
  (table) => [check('scan_quota_policy_audit_version', sql`${table.version} BETWEEN 1 AND 9007199254740991`)],
);
