import { sql } from 'drizzle-orm';
import { check, pgTable, text, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core';
import { accounts } from './accounts.js';
import { families } from './families.js';
import { createdAtColumn, familyIsolationPolicy, idColumn } from './columns.js';

export const ownershipTransferOffers = pgTable(
  'ownership_transfer_offers',
  {
    id: idColumn(),
    familyId: uuid('family_id')
      .notNull()
      .references(() => families.id, { onDelete: 'cascade' }),
    fromAccountId: uuid('from_account_id')
      .notNull()
      .references(() => accounts.id),
    toAccountId: uuid('to_account_id')
      .notNull()
      .references(() => accounts.id),
    status: text('status', { enum: ['pending', 'accepted', 'declined', 'revoked'] })
      .notNull()
      .default('pending'),
    createdAt: createdAtColumn(),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('ownership_transfer_offers_pending_unique')
      .on(t.familyId)
      .where(sql`${t.status} = 'pending'`),
    check(
      'ownership_transfer_offers_status_valid',
      sql`${t.status} IN ('pending','accepted','declined','revoked')`,
    ),
    check('ownership_transfer_offers_distinct_accounts', sql`${t.fromAccountId} <> ${t.toAccountId}`),
    check(
      'ownership_transfer_offers_decision_complete',
      sql`(${t.status} = 'pending') = (${t.decidedAt} IS NULL)`,
    ),
    familyIsolationPolicy(),
  ],
);
