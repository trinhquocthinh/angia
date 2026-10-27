import { sql } from 'drizzle-orm';
import { check, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { familyIdColumn, familyIsolationPolicy } from './columns.js';
import { scanQuotaMonths } from './scanQuotaMonths.js';
import { sourceDocuments } from './sourceDocuments.js';

// Một ảnh OCR đã duyệt/chứng từ = một operation; không lưu phí provider hoặc payload nhận diện.
export const ocrOperations = pgTable(
  'ocr_operations',
  {
    sourceDocumentId: uuid('source_document_id')
      .primaryKey()
      .references(() => sourceDocuments.id, { onDelete: 'cascade' }),
    familyId: familyIdColumn(),
    month: text('month')
      .notNull()
      .references(() => scanQuotaMonths.month),
    state: text('state').notNull(),
    dispatchAttempts: integer('dispatch_attempts').notNull().default(0),
    dispatchedAt: timestamp('dispatched_at', { withTimezone: true }),
  },
  (table) => [
    check('ocr_operations_state', sql`${table.state} IN ('held', 'dispatched', 'released')`),
    check(
      'ocr_operations_dispatch',
      sql`(${table.state} = 'dispatched' AND ${table.dispatchAttempts} BETWEEN 1 AND 6 AND ${table.dispatchedAt} IS NOT NULL)
    OR (${table.state} <> 'dispatched' AND ${table.dispatchAttempts} = 0 AND ${table.dispatchedAt} IS NULL)`,
    ),
    familyIsolationPolicy(),
  ],
);
