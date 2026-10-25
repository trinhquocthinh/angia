import { index, jsonb, numeric, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { createdAtColumn, familyIdColumn, familyIsolationPolicy, idColumn } from './columns.js';
import { sourceDocuments } from './sourceDocuments.js';

// provider không ràng buộc tập giá trị: dev dùng adapter `fake` (AI_PROVIDER).
export const extractions = pgTable(
  'extractions',
  {
    id: idColumn(),
    familyId: familyIdColumn(),
    sourceDocumentId: uuid('source_document_id')
      .notNull()
      .references(() => sourceDocuments.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    model: text('model').notNull(),
    payload: jsonb('payload').notNull(),
    costUsd: numeric('cost_usd').notNull(),
    createdAt: createdAtColumn(),
  },
  (table) => [
    index('extractions_source_document_id_idx').on(table.sourceDocumentId),
    familyIsolationPolicy(),
  ],
);
