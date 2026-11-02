import { sql } from 'drizzle-orm';
import { check, foreignKey, index, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts.js';
import { createdAtColumn, familyIdColumn, idColumn, selfIsolationPolicy } from './columns.js';
import { healthProfiles } from './healthProfiles.js';

// BR-050, SPEC-050: nhật ký liên kết/gỡ/chuyển, chỉ INSERT (không có route sửa/xóa).
export const profileLinkEvents = pgTable(
  'profile_link_events',
  {
    id: idColumn(),
    familyId: familyIdColumn(),
    profileId: uuid('profile_id').notNull(),
    action: text('action', { enum: ['link', 'unlink', 'transfer'] }).notNull(),
    actorAccountId: uuid('actor_account_id').references(() => accounts.id, { onDelete: 'set null' }),
    actorRole: text('actor_role', { enum: ['invitee', 'owner', 'admin'] }).notNull(),
    fromAccountId: uuid('from_account_id').references(() => accounts.id, { onDelete: 'set null' }),
    toAccountId: uuid('to_account_id').references(() => accounts.id, { onDelete: 'set null' }),
    createdAt: createdAtColumn(),
  },
  (t) => [
    foreignKey({
      columns: [t.profileId, t.familyId],
      foreignColumns: [healthProfiles.id, healthProfiles.familyId],
      name: 'profile_link_events_profile_family_fk',
    }).onDelete('cascade'),
    index('profile_link_events_profile_created_idx').on(t.profileId, t.createdAt),
    check('profile_link_events_action_valid', sql`${t.action} IN ('link', 'unlink', 'transfer')`),
    check('profile_link_events_actor_role_valid', sql`${t.actorRole} IN ('invitee', 'owner', 'admin')`),
    selfIsolationPolicy('profile_id'),
  ],
);
