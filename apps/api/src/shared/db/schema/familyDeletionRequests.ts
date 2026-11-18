import { sql } from 'drizzle-orm';
import { check, pgTable, text, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core';
import { accounts } from './accounts.js';
import { families } from './families.js';
import { createdAtColumn, familyIsolationPolicy, idColumn } from './columns.js';

export const familyDeletionRequests = pgTable(
  'family_deletion_requests',
  {
    id: idColumn(),
    familyId: uuid('family_id')
      .notNull()
      .references(() => families.id, { onDelete: 'cascade' }),
    requestedBy: uuid('requested_by')
      .notNull()
      .references(() => accounts.id),
    status: text('status', { enum: ['pending', 'revoked', 'executed'] })
      .notNull()
      .default('pending'),
    createdAt: createdAtColumn(),
    executeAt: timestamp('execute_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    executedAt: timestamp('executed_at', { withTimezone: true }),
    cancelReason: text('cancel_reason'),
  },
  (t) => [
    uniqueIndex('family_deletion_requests_pending_unique')
      .on(t.familyId)
      .where(sql`${t.status} = 'pending'`),
    check('family_deletion_requests_status_valid', sql`${t.status} IN ('pending','revoked','executed')`),
    check(
      'family_deletion_requests_terminal_complete',
      sql`(${t.status} = 'pending' AND ${t.revokedAt} IS NULL AND ${t.executedAt} IS NULL AND ${t.cancelReason} IS NULL) OR (${t.status} = 'revoked' AND ${t.revokedAt} IS NOT NULL AND ${t.executedAt} IS NULL) OR (${t.status} = 'executed' AND ${t.executedAt} IS NOT NULL AND ${t.revokedAt} IS NULL AND ${t.cancelReason} IS NULL)`,
    ),
    check('family_deletion_requests_execution_after_creation', sql`${t.executeAt} > ${t.createdAt}`),
    familyIsolationPolicy(),
  ],
);
