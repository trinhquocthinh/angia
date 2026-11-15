import { selfReadOnlyPolicies } from './selfReadOnlyPolicies.js';
import { sql } from 'drizzle-orm';
import { check, foreignKey, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts.js';
import { sessions } from './sessions.js';
import { createdAtColumn, familyIsolationPolicy, idColumn } from './columns.js';
export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: idColumn(),
    familyId: uuid('family_id').notNull(),
    accountId: uuid('account_id').notNull(),
    lastSessionId: uuid('last_session_id').references(() => sessions.id, { onDelete: 'set null' }),
    // Nguồn tồn tại độc lập với last_session_id, kể cả sau khi phiên bị xoá.
    authMethod: text('auth_method', { enum: ['local', 'oidc'] })
      .notNull()
      .default('oidc'),
    authorizedAt: timestamp('authorized_at', { withTimezone: true }).notNull(),
    endpoint: text('endpoint').notNull(),
    endpointHash: text('endpoint_hash').notNull().unique(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    createdAt: createdAtColumn(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('push_subscriptions_auth_method_valid', sql`${t.authMethod} IN ('local', 'oidc')`),
    ...selfReadOnlyPolicies(),
    familyIsolationPolicy(),
    index('push_subscriptions_account_idx').on(t.accountId),
    foreignKey({
      columns: [t.accountId, t.familyId],
      foreignColumns: [accounts.id, accounts.familyId],
      name: 'push_subscriptions_account_family_fk',
    }).onDelete('cascade'),
  ],
);
