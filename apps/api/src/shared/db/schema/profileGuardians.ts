import { pgTable, primaryKey, foreignKey, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts.js';
import { healthProfiles } from './healthProfiles.js';
import { createdAtColumn, familyIdColumn, familyIsolationPolicy } from './columns.js';

// Trigger và khoá hồ sơ trong migration kiểm tư cách và giới hạn khi ghi đồng thời.
export const profileGuardians = pgTable(
  'profile_guardians',
  {
    healthProfileId: uuid('health_profile_id').notNull(),
    familyId: familyIdColumn(),
    accountId: uuid('account_id').notNull(),
    createdAt: createdAtColumn(),
  },
  (t) => [
    primaryKey({ columns: [t.healthProfileId, t.accountId] }),
    foreignKey({
      columns: [t.healthProfileId, t.familyId],
      foreignColumns: [healthProfiles.id, healthProfiles.familyId],
    }).onDelete('cascade'),
    foreignKey({
      columns: [t.accountId, t.familyId],
      foreignColumns: [accounts.id, accounts.familyId],
    }).onDelete('no action'),
    familyIsolationPolicy(),
  ],
);
