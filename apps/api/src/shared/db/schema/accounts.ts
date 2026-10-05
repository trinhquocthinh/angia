import { sql } from 'drizzle-orm';
import { type AnyPgColumn, boolean, check, index, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { createdAtColumn, idColumn } from './columns.js';
import { families } from './families.js';
import { healthProfiles } from './healthProfiles.js';

// Không RLS: tra cứu tài khoản diễn ra trước khi biết family (đăng nhập, phiên).
// family_id/family_role null = tài khoản chờ Quản trị viên gán vào nhóm (màn /waiting).
export const accounts = pgTable(
  'accounts',
  {
    id: idColumn(),
    oidcSubject: text('oidc_subject').notNull().unique(),
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
    index('accounts_family_id_idx').on(table.familyId),
    check('accounts_family_role_valid', sql`${table.familyRole} IN ('main', 'member')`),
  ],
);
