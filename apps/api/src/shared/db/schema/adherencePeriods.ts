import { sql } from 'drizzle-orm';
import { check, date, foreignKey, index, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts.js';
import { createdAtColumn, familyIdColumn, familyIsolationPolicy, idColumn } from './columns.js';
import { healthProfiles } from './healthProfiles.js';

// BR-031/032. Ràng buộc loại trừ chống chồng lấn (btree_gist, TC-089) drizzle-kit không mô tả được:
// viết tay trong migration 0015_adherence_periods.sql.
export const adherencePeriods = pgTable(
  'adherence_periods',
  {
    id: idColumn(),
    familyId: familyIdColumn(),
    healthProfileId: uuid('health_profile_id').notNull(),
    medicationName: text('medication_name').notNull(),
    medicationNameNormalized: text('medication_name_normalized').notNull(),
    status: text('status', { enum: ['taking', 'stopped'] }).notNull(),
    fromDate: date('from_date').notNull(),
    toDate: date('to_date'),
    recordedBy: uuid('recorded_by')
      .notNull()
      .references(() => accounts.id),
    createdAt: createdAtColumn(),
  },
  (t) => [
    foreignKey({
      name: 'adherence_periods_profile_family_fk',
      columns: [t.healthProfileId, t.familyId],
      foreignColumns: [healthProfiles.id, healthProfiles.familyId],
    }).onDelete('cascade'),
    index('adherence_periods_profile_name_from_idx').on(
      t.healthProfileId,
      t.medicationNameNormalized,
      t.fromDate,
    ),
    check('adherence_periods_status_valid', sql`${t.status} IN ('taking', 'stopped')`),
    check('adherence_periods_dates_valid', sql`${t.toDate} IS NULL OR ${t.toDate} >= ${t.fromDate}`),
    familyIsolationPolicy(),
  ],
);
