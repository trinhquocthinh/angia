import { sql } from 'drizzle-orm';
import { boolean, check, date, index, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { createdAtColumn, familyIdColumn, familyIsolationPolicy, idColumn } from './columns.js';
import { healthProfiles } from './healthProfiles.js';
import { sourceDocuments } from './sourceDocuments.js';

export const prescriptions = pgTable(
  'prescriptions',
  {
    id: idColumn(),
    familyId: familyIdColumn(),
    healthProfileId: uuid('health_profile_id')
      .notNull()
      .references(() => healthProfiles.id, { onDelete: 'cascade' }),
    sourceDocumentId: uuid('source_document_id').references(() => sourceDocuments.id, {
      onDelete: 'cascade',
    }),
    issuedDate: date('issued_date').notNull(),
    facility: text('facility'),
    // BR-042: chép nguyên văn chẩn đoán in trên đơn, tùy chọn.
    diagnosis: text('diagnosis'),
    manualWithoutSource: boolean('manual_without_source').notNull().default(false),
    createdAt: createdAtColumn(),
  },
  (t) => [
    index('prescriptions_profile_issued_idx').on(t.healthProfileId, t.issuedDate),
    index('prescriptions_source_document_idx').on(t.sourceDocumentId),
    // BR-014: dữ liệu lâm sàng truy được nguồn hoặc đánh dấu nhập tay.
    check(
      'prescriptions_has_source',
      sql`${t.sourceDocumentId} IS NOT NULL OR ${t.manualWithoutSource} = true`,
    ),
    familyIsolationPolicy(),
  ],
);
