import { foreignKey, pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts.js';
import { createdAtColumn, familyIdColumn, familyIsolationPolicy } from './columns.js';
import { healthProfiles } from './healthProfiles.js';

// BR-039/SPEC-026: tài khoản `main` được chỉ định nhận nhắc cho hồ sơ không liên kết tài khoản.
// FK account chỉ theo id (không kèm family_id) để việc gỡ tài khoản khỏi gia đình không bị chặn;
// người nhận đã rời gia đình hoặc hết vai trò `main` bị lọc khi đọc (owner chốt 2026-10-23).
export const reminderRecipients = pgTable(
  'reminder_recipients',
  {
    healthProfileId: uuid('health_profile_id').notNull(),
    familyId: familyIdColumn(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    createdAt: createdAtColumn(),
  },
  (t) => [
    primaryKey({ name: 'reminder_recipients_pk', columns: [t.healthProfileId, t.accountId] }),
    foreignKey({
      name: 'reminder_recipients_profile_family_fk',
      columns: [t.healthProfileId, t.familyId],
      foreignColumns: [healthProfiles.id, healthProfiles.familyId],
    }).onDelete('cascade'),
    familyIsolationPolicy(),
  ],
);
