import { sql } from 'drizzle-orm';
import { check, foreignKey, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts.js';
import { healthProfiles } from './healthProfiles.js';
import { createdAtColumn, familyIdColumn, familyIsolationPolicy, idColumn } from './columns.js';

export const consentInvitations = pgTable(
  'consent_invitations',
  {
    id: idColumn(),
    familyId: familyIdColumn(),
    profileId: uuid('profile_id').notNull(),
    tokenHash: text('token_hash').notNull().unique(),
    invitedByAccountId: uuid('invited_by_account_id').references(() => accounts.id, { onDelete: 'set null' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    decision: text('decision', { enum: ['accepted', 'declined'] }),
    respondentName: text('respondent_name'),
    basis: text('basis', { enum: ['self', 'guardian'] }),
    respondedAt: timestamp('responded_at', { withTimezone: true }),
    createdAt: createdAtColumn(),
  },
  (t) => [
    foreignKey({
      columns: [t.profileId, t.familyId],
      foreignColumns: [healthProfiles.id, healthProfiles.familyId],
      name: 'consent_invitations_profile_family_fk',
    }).onDelete('cascade'),
    index('consent_invitations_profile_family_idx').on(t.profileId, t.familyId),
    check('consent_invitations_decision_valid', sql`${t.decision} IN ('accepted', 'declined')`),
    check('consent_invitations_basis_valid', sql`${t.basis} IN ('self', 'guardian')`),
    check(
      'consent_invitations_response_complete',
      sql`(${t.decision} IS NULL AND ${t.respondentName} IS NULL AND ${t.basis} IS NULL AND ${t.respondedAt} IS NULL) OR (${t.decision} IS NOT NULL AND ${t.respondentName} IS NOT NULL AND ${t.basis} IS NOT NULL AND ${t.respondedAt} IS NOT NULL)`,
    ),
    check(
      'consent_invitations_name_valid',
      sql`${t.respondentName} IS NULL OR (char_length(btrim(${t.respondentName})) BETWEEN 1 AND 60 AND ${t.respondentName} = btrim(${t.respondentName}))`,
    ),
    familyIsolationPolicy(),
  ],
);
