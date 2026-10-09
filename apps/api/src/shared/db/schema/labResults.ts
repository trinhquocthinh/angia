import { sql } from 'drizzle-orm';
import { boolean, check, date, index, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { createdAtColumn, familyIdColumn, familyIsolationPolicy, idColumn } from './columns.js';
import { healthProfiles } from './healthProfiles.js';
import { sourceDocuments } from './sourceDocuments.js';

// BR-022: tên, giá trị, đơn vị, khoảng tham chiếu giữ nguyên văn phiếu; không gắn chuẩn ngoại lai.
export const labResults = pgTable(
  'lab_results',
  {
    id: idColumn(),
    familyId: familyIdColumn(),
    healthProfileId: uuid('health_profile_id')
      .notNull()
      .references(() => healthProfiles.id, { onDelete: 'cascade' }),
    sourceDocumentId: uuid('source_document_id').references(() => sourceDocuments.id, {
      onDelete: 'cascade',
    }),
    resultDate: date('result_date').notNull(),
    testName: text('test_name').notNull(),
    testNameNormalized: text('test_name_normalized').notNull(),
    value: text('value').notNull(),
    unit: text('unit'),
    referenceRange: text('reference_range'),
    facility: text('facility'),
    manualWithoutSource: boolean('manual_without_source').notNull().default(false),
    createdAt: createdAtColumn(),
  },
  (t) => [
    index('lab_results_profile_test_date_idx').on(t.healthProfileId, t.testNameNormalized, t.resultDate),
    index('lab_results_source_document_idx').on(t.sourceDocumentId),
    // BR-014
    check(
      'lab_results_has_source',
      sql`${t.sourceDocumentId} IS NOT NULL OR ${t.manualWithoutSource} = true`,
    ),
    familyIsolationPolicy(),
  ],
);
