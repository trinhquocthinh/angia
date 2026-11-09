import { selfReadOnlyPolicies } from './selfReadOnlyPolicies.js';
import { sql } from 'drizzle-orm';
import { check, foreignKey, index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts.js';
import { createdAtColumn, familyIdColumn, idColumn, selfIsolationPolicy } from './columns.js';
import { healthProfiles } from './healthProfiles.js';

// BR-050, LG-02: link liên kết hồ sơ kiêm đồng thuận. accepted_at là thời điểm quyết định, kể cả khi declined;
// accepted_by_account_id về NULL khi tài khoản bị xóa nên chỉ bắt buộc NULL lúc chưa quyết định.
export const profileLinkInvitations = pgTable(
  'profile_link_invitations',
  {
    id: idColumn(),
    familyId: familyIdColumn(),
    profileId: uuid('profile_id').notNull(),
    tokenHash: text('token_hash').notNull().unique(),
    invitedByAccountId: uuid('invited_by_account_id').references(() => accounts.id, { onDelete: 'set null' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    acceptedByAccountId: uuid('accepted_by_account_id').references(() => accounts.id, {
      onDelete: 'set null',
    }),
    decision: text('decision', { enum: ['accepted', 'declined'] }),
    createdAt: createdAtColumn(),
  },
  (t) => [
    foreignKey({
      columns: [t.profileId, t.familyId],
      foreignColumns: [healthProfiles.id, healthProfiles.familyId],
      name: 'profile_link_invitations_profile_family_fk',
    }).onDelete('cascade'),
    index('profile_link_invitations_profile_idx').on(t.profileId),
    uniqueIndex('profile_link_invitations_one_pending_unique')
      .on(t.profileId)
      .where(sql`${t.revokedAt} IS NULL AND ${t.acceptedAt} IS NULL`),
    check('profile_link_invitations_decision_valid', sql`${t.decision} IN ('accepted', 'declined')`),
    check(
      'profile_link_invitations_decision_complete',
      sql`(${t.acceptedAt} IS NULL) = (${t.decision} IS NULL)`,
    ),
    check(
      'profile_link_invitations_undecided_no_account',
      sql`${t.acceptedAt} IS NOT NULL OR ${t.acceptedByAccountId} IS NULL`,
    ),
    ...selfReadOnlyPolicies(),
    selfIsolationPolicy('profile_id'),
  ],
);
