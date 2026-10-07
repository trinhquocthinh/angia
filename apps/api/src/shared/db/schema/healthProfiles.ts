import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { accounts } from './accounts.js';
import { createdAtColumn, familyIdColumn, familyIsolationPolicy, idColumn } from './columns.js';

// Đồng thuận (BR-009): hồ sơ mới pending; người nhận phản hồi link mới có thể mở gate confirmed.
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
    consentStatus: text('consent_status', { enum: ['pending', 'invited', 'declined', 'confirmed'] })
      .notNull()
      .default('pending'),
    consentSource: text('consent_source', { enum: ['legacy_attestation', 'invitation'] }),
    consentRespondentName: text('consent_respondent_name'),
    createdAt: createdAtColumn(),
  },
  (table) => [
    unique('health_profiles_id_family_unique').on(table.id, table.familyId),
    check(
      'health_profiles_consent_status_valid',
      sql`${table.consentStatus} IN ('pending', 'invited', 'declined', 'confirmed')`,
    ),
    check(
      'health_profiles_consent_source_valid',
      sql`${table.consentSource} IN ('legacy_attestation', 'invitation')`,
    ),
    index('health_profiles_family_id_idx').on(table.familyId),
    check('health_profiles_consent_basis_valid', sql`${table.consentBasis} IN ('self', 'guardian')`),
    check(
      'health_profiles_confirmed_receipt_complete',
      sql`${table.consentStatus} <> 'confirmed' OR (${table.consentSource} IS NOT DISTINCT FROM 'invitation' AND ${table.consentConfirmedAt} IS NOT NULL AND ${table.consentConfirmedBy} IS NULL AND ${table.consentBasis} IS NOT NULL AND ${table.consentRespondentName} IS NOT NULL AND char_length(btrim(${table.consentRespondentName})) BETWEEN 1 AND 60 AND ${table.consentRespondentName} = btrim(${table.consentRespondentName}))`,
    ),
    familyIsolationPolicy(),
  ],
);
