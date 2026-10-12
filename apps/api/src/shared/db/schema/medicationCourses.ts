import { sql } from 'drizzle-orm';
import { check, date, foreignKey, index, numeric, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core';
import { familyIdColumn, familyIsolationPolicy, idColumn } from './columns.js';
import { healthProfiles } from './healthProfiles.js';
import { prescriptionItems } from './prescriptionItems.js';

export const medicationCourses = pgTable(
  'medication_courses',
  {
    id: idColumn(),
    familyId: familyIdColumn(),
    healthProfileId: uuid('health_profile_id').notNull(),
    prescriptionItemId: uuid('prescription_item_id').references(() => prescriptionItems.id, {
      onDelete: 'cascade',
    }),
    source: text('source', { enum: ['prescription', 'self_reported'] }).notNull(),
    name: text('name').notNull(),
    nameNormalized: text('name_normalized').notNull(),
    strength: text('strength'),
    // Null chỉ với đợt từ dòng thuốc dùng ngoài không ghi liều (BR-025).
    quantityPerDose: numeric('quantity_per_dose'),
    doseUnit: text('dose_unit'),
    slots: text('slots').array().notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    status: text('status', { enum: ['active', 'ended', 'stopped', 'replaced'] }).notNull(),
  },
  (t) => [
    foreignKey({
      name: 'medication_courses_profile_family_fk',
      columns: [t.healthProfileId, t.familyId],
      foreignColumns: [healthProfiles.id, healthProfiles.familyId],
    }).onDelete('cascade'),
    unique('medication_courses_prescription_item_unique').on(t.prescriptionItemId),
    index('medication_courses_profile_status_idx').on(t.healthProfileId, t.status),
    index('medication_courses_profile_name_idx').on(t.healthProfileId, t.nameNormalized),
    check('medication_courses_source_valid', sql`${t.source} IN ('prescription', 'self_reported')`),
    check('medication_courses_status_valid', sql`${t.status} IN ('active', 'ended', 'stopped', 'replaced')`),
    check(
      'medication_courses_has_source',
      sql`(${t.source} = 'prescription' AND ${t.prescriptionItemId} IS NOT NULL) OR (${t.source} = 'self_reported' AND ${t.prescriptionItemId} IS NULL)`,
    ),
    check(
      'medication_courses_quantity_valid',
      sql`CASE WHEN ${t.quantityPerDose} IS NULL THEN ${t.source} = 'prescription' ELSE ${t.quantityPerDose} > 0 END`,
    ),
    check(
      'medication_courses_slots_valid',
      sql`cardinality(${t.slots}) >= 1 AND ${t.slots} <@ ARRAY['morning', 'noon', 'afternoon', 'evening']::text[]`,
    ),
    check(
      'medication_courses_dates_valid',
      sql`${t.endDate} IS NULL OR ${t.endDate} >= ${t.startDate} OR (${t.status} IN ('replaced', 'stopped') AND ${t.endDate} = ${t.startDate} - 1)`,
    ),
    check('medication_courses_terminal_has_end', sql`${t.status} = 'active' OR ${t.endDate} IS NOT NULL`),
    familyIsolationPolicy(),
  ],
);
