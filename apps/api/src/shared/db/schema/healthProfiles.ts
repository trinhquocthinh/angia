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

// Đồng thuận (BR-009): pending mặc định; confirmed cần receipt hợp lệ theo từng nguồn.
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
    consentStatus: text('consent_status', {
      enum: ['pending', 'invited', 'declined', 'confirmed', 'withdrawn'],
    })
      .notNull()
      .default('pending'),
    consentSource: text('consent_source', {
      enum: ['legacy_attestation', 'invitation', 'main_attested', 'self'],
    }),
    consentRespondentName: text('consent_respondent_name'),
    consentWithdrawnAt: timestamp('consent_withdrawn_at', { withTimezone: true }),
    consentWithdrawnBy: uuid('consent_withdrawn_by').references((): AnyPgColumn => accounts.id, {
      onDelete: 'set null',
    }),
    createdAt: createdAtColumn(),
  },
  (table) => [
    unique('health_profiles_id_family_unique').on(table.id, table.familyId),
    check(
      'health_profiles_consent_status_valid',
      sql`${table.consentStatus} IN ('pending', 'invited', 'declined', 'confirmed', 'withdrawn')`,
    ),
    check(
      'health_profiles_consent_source_valid',
      sql`${table.consentSource} IN ('legacy_attestation', 'invitation', 'main_attested', 'self')`,
    ),
    index('health_profiles_family_id_idx').on(table.familyId),
    check('health_profiles_consent_basis_valid', sql`${table.consentBasis} IN ('self', 'guardian')`),
    check(
      'health_profiles_confirmed_receipt_complete',
      sql`${table.consentStatus} <> 'confirmed' OR COALESCE((
        ${table.consentConfirmedAt} IS NOT NULL
        AND ${table.consentBasis} IS NOT NULL
        AND ${table.consentRespondentName} IS NOT NULL
        AND char_length(btrim(${table.consentRespondentName})) BETWEEN 1 AND 60
        AND ${table.consentRespondentName} = btrim(${table.consentRespondentName})
        AND (
          (${table.consentSource} = 'invitation' AND ${table.consentConfirmedBy} IS NULL)
          OR (${table.consentSource} = 'main_attested' AND ${table.consentConfirmedBy} IS NOT NULL)
          OR (${table.consentSource} = 'self' AND ${table.consentConfirmedBy} IS NOT NULL AND ${table.consentBasis} = 'self')
        )
      ), false)`,
    ),
    check(
      'health_profiles_withdrawn_receipt_complete',
      sql`${table.consentStatus} <> 'withdrawn' OR ${table.consentWithdrawnAt} IS NOT NULL`,
    ),
    check(
      'health_profiles_main_attested_receipt_complete',
      sql`${table.consentSource} IS DISTINCT FROM 'main_attested' OR (
        ${table.consentConfirmedBy} IS NOT NULL
        AND ${table.consentBasis} IS NOT NULL
        AND ${table.consentRespondentName} IS NOT NULL
      )`,
    ),
    familyIsolationPolicy(),
  ],
);
