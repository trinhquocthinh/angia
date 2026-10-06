import { sql } from 'drizzle-orm';
import { check, foreignKey, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { healthProfiles } from './healthProfiles.js';
import { familyIdColumn, familyIsolationPolicy } from './columns.js';

// Lưu dấu xác nhận cũ bằng migration; runtime không ghi vào bảng này.
export const consentLegacyAttestations = pgTable(
  'consent_legacy_attestations',
  {
    profileId: uuid('profile_id').primaryKey(),
    familyId: familyIdColumn(),
    confirmedByAccountId: uuid('confirmed_by_account_id'),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }).notNull(),
    basis: text('basis', { enum: ['self', 'guardian'] }),
  },
  (t) => [
    foreignKey({
      columns: [t.profileId, t.familyId],
      foreignColumns: [healthProfiles.id, healthProfiles.familyId],
      name: 'consent_legacy_attestations_profile_family_fk',
    }).onDelete('cascade'),
    check('consent_legacy_attestations_basis_valid', sql`${t.basis} IN ('self', 'guardian')`),
    familyIsolationPolicy(),
  ],
);
