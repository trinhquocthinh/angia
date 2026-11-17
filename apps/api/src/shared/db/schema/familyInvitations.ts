import { sql } from 'drizzle-orm';
import { check, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts.js';
import { families } from './families.js';
import { createdAtColumn, familyIsolationPolicy, idColumn } from './columns.js';

export const familyInvitations = pgTable(
  'family_invitations',
  {
    id: idColumn(),
    kind: text('kind', { enum: ['join_family', 'found_family'] }).notNull(),
    familyId: uuid('family_id').references(() => families.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['main', 'member'] }),
    tokenHash: text('token_hash').notNull().unique(),
    codeHash: text('code_hash').notNull().unique(),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => accounts.id),
    createdAt: createdAtColumn(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    acceptedBy: uuid('accepted_by').references(() => accounts.id),
  },
  (t) => [
    check(
      'family_invitations_kind_shape',
      sql`(${t.kind} = 'join_family' AND ${t.familyId} IS NOT NULL AND ${t.role} IS NOT NULL AND ${t.role} IN ('main','member')) OR (${t.kind} = 'found_family' AND ${t.familyId} IS NULL AND ${t.role} IS NULL)`,
    ),
    check(
      'family_invitations_acceptance_complete',
      sql`(${t.acceptedAt} IS NULL) = (${t.acceptedBy} IS NULL)`,
    ),
    check('family_invitations_terminal_exclusive', sql`${t.acceptedAt} IS NULL OR ${t.revokedAt} IS NULL`),
    check('family_invitations_expiry_valid', sql`${t.expiresAt} > ${t.createdAt}`),
    familyIsolationPolicy(),
  ],
);
