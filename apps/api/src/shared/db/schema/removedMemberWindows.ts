import { sql } from 'drizzle-orm';
import { check, foreignKey, pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts.js';
import { healthProfiles } from './healthProfiles.js';
import { familyIdColumn, familyIsolationPolicy } from './columns.js';

export const removedMemberWindows = pgTable(
  'removed_member_windows',
  {
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    familyId: familyIdColumn(),
    healthProfileId: uuid('health_profile_id'),
    removedAt: timestamp('removed_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.accountId, t.familyId] }),
    foreignKey({
      columns: [t.healthProfileId, t.familyId],
      foreignColumns: [healthProfiles.id, healthProfiles.familyId],
    }),
    check('removed_member_windows_expiry_valid', sql`${t.expiresAt} = ${t.removedAt} + interval '168 hours'`),
    familyIsolationPolicy(),
  ],
);
