import { sql } from 'drizzle-orm';
import { type AnyPgColumn, check, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts.js';
import { createdAtColumn, familyIdColumn, familyIsolationPolicy, idColumn } from './columns.js';

// Đồng thuận (BR-009): hồ sơ mới luôn chưa xác nhận nên consent_* đều null tới khi main xác nhận.
// Trigger chặn đổi family_id (BR-002) nằm trong migration SQL tự viết.
export const healthProfiles = pgTable(
  'health_profiles',
  {
    id: idColumn(),
    familyId: familyIdColumn(),
    displayName: text('display_name').notNull(),
    birthYear: integer('birth_year'),
    consentConfirmedAt: timestamp('consent_confirmed_at', { withTimezone: true }),
    consentConfirmedBy: uuid('consent_confirmed_by').references((): AnyPgColumn => accounts.id, {
      onDelete: 'set null',
    }),
    consentBasis: text('consent_basis', { enum: ['self', 'guardian'] }),
    createdAt: createdAtColumn(),
  },
  (table) => [
    index('health_profiles_family_id_idx').on(table.familyId),
    check('health_profiles_consent_basis_valid', sql`${table.consentBasis} IN ('self', 'guardian')`),
    familyIsolationPolicy(),
  ],
);
