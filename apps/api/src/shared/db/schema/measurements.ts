import { sql } from 'drizzle-orm';
import { boolean, check, date, index, integer, numeric, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { createdAtColumn, familyIdColumn, familyIsolationPolicy, idColumn } from './columns.js';
import { healthProfiles } from './healthProfiles.js';
import { sourceDocuments } from './sourceDocuments.js';

export const measurements = pgTable(
  'measurements',
  {
    id: idColumn(),
    familyId: familyIdColumn(),
    healthProfileId: uuid('health_profile_id')
      .notNull()
      .references(() => healthProfiles.id, { onDelete: 'cascade' }),
    sourceDocumentId: uuid('source_document_id').references(() => sourceDocuments.id, {
      onDelete: 'cascade',
    }),
    kind: text('kind', { enum: ['blood_pressure', 'blood_glucose'] }).notNull(),
    measuredOn: date('measured_on').notNull(),
    measuredTime: text('measured_time'),
    systolic: integer('systolic'),
    diastolic: integer('diastolic'),
    pulse: integer('pulse'),
    glucoseValue: numeric('glucose_value'),
    glucoseUnit: text('glucose_unit', { enum: ['mmol/L', 'mg/dL'] }),
    manualWithoutSource: boolean('manual_without_source').notNull().default(false),
    createdAt: createdAtColumn(),
  },
  (t) => [
    index('measurements_profile_kind_date_idx').on(t.healthProfileId, t.kind, t.measuredOn),
    check('measurements_kind_valid', sql`${t.kind} IN ('blood_pressure', 'blood_glucose')`),
    // BR-014: dữ liệu lâm sàng truy được nguồn hoặc đánh dấu nhập tay.
    check(
      'measurements_has_source',
      sql`${t.sourceDocumentId} IS NOT NULL OR ${t.manualWithoutSource} = true`,
    ),
    // BR-019
    check(
      'measurements_blood_pressure_valid',
      sql`${t.kind} <> 'blood_pressure' OR (${t.systolic} IS NOT NULL AND ${t.diastolic} IS NOT NULL AND ${t.systolic} > ${t.diastolic})`,
    ),
    // BR-020
    check(
      'measurements_blood_glucose_valid',
      sql`${t.kind} <> 'blood_glucose' OR (${t.glucoseValue} IS NOT NULL AND ${t.glucoseUnit} IN ('mmol/L', 'mg/dL'))`,
    ),
    familyIsolationPolicy(),
  ],
);
