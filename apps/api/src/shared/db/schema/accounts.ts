import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  boolean,
  check,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { createdAtColumn, idColumn } from './columns.js';
import { families } from './families.js';
import { healthProfiles } from './healthProfiles.js';

// Không RLS: tra cứu tài khoản diễn ra trước khi biết family (đăng nhập, phiên).
// Username cũ chờ mapping owner duyệt; legal_ref không chứa định danh người dùng.
export const accounts = pgTable(
  'accounts',
  {
    id: idColumn(),
    oidcSubject: text('oidc_subject').unique(),
    usernameNormalized: text('username_normalized').unique(),
    legalRef: text('legal_ref')
      .notNull()
      .default(sql`gen_random_uuid()::text`)
      .unique(),
    email: text('email'),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    pendingEmail: text('pending_email'),
    mustChangePassword: boolean('must_change_password').notNull().default(false),
    tempPasswordExpiresAt: timestamp('temp_password_expires_at', { withTimezone: true }),
    lockedAt: timestamp('locked_at', { withTimezone: true }),
    lockReason: text('lock_reason'),
    displayName: text('display_name').notNull(),
    familyId: uuid('family_id').references(() => families.id),
    familyRole: text('family_role', { enum: ['main', 'member'] }),
    isSystemAdmin: boolean('is_system_admin').notNull().default(false),
    healthProfileId: uuid('health_profile_id')
      .unique()
      .references((): AnyPgColumn => healthProfiles.id, { onDelete: 'set null' }),
    createdAt: createdAtColumn(),
  },
  (table) => [
    check('accounts_username_normalized_valid', sql`${table.usernameNormalized} ~ '^[a-z0-9._-]{3,32}$'`),
    unique('accounts_id_family_unique').on(table.id, table.familyId),
    index('accounts_family_id_idx').on(table.familyId),
    // BR-086: chỉ email đã xác minh mới duy nhất; email chưa xác minh được trùng.
    uniqueIndex('accounts_verified_email_unique')
      .on(sql`lower(${table.email})`)
      .where(sql`${table.emailVerifiedAt} IS NOT NULL`),
    check('accounts_family_role_valid', sql`${table.familyRole} IN ('main', 'member')`),
  ],
);
