import { foreignKey, index, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts.js';
import { sessions } from './sessions.js';
import { createdAtColumn, familyIsolationPolicy, idColumn } from './columns.js';
export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: idColumn(),
    familyId: uuid('family_id').notNull(),
    accountId: uuid('account_id').notNull(),
    sessionId: uuid('session_id').notNull(),
    endpoint: text('endpoint').notNull(),
    endpointHash: text('endpoint_hash').notNull().unique(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    createdAt: createdAtColumn(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    familyIsolationPolicy(),
    unique('push_subscriptions_session_unique').on(t.sessionId),
    index('push_subscriptions_account_idx').on(t.accountId),
    foreignKey({
      columns: [t.accountId, t.familyId],
      foreignColumns: [accounts.id, accounts.familyId],
      name: 'push_subscriptions_account_family_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [t.sessionId, t.accountId],
      foreignColumns: [sessions.id, sessions.accountId],
      name: 'push_subscriptions_session_account_fk',
    }).onDelete('cascade'),
  ],
);
