import { sql } from 'drizzle-orm';
import { check, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { familyIdColumn, familyIsolationPolicy } from './columns.js';
import { extractionSpend } from './extractionSpend.js';
import { sourceDocuments } from './sourceDocuments.js';

// Chỗ giữ ngân sách của lời gọi AI đang chạy (F03a): mỗi chứng từ tối đa một chỗ. Quyết toán = xóa dòng
// rồi điều chỉnh extraction_spend đúng tháng đã giữ, nên retry/dead-letter không tính trùng.
export const extractionReservations = pgTable(
  'extraction_reservations',
  {
    sourceDocumentId: uuid('source_document_id')
      .primaryKey()
      .references(() => sourceDocuments.id, { onDelete: 'cascade' }),
    familyId: familyIdColumn(),
    month: text('month')
      .notNull()
      .references(() => extractionSpend.month),
    amountUsd: numeric('amount_usd', { precision: 10, scale: 6 }).notNull(),
    reservedAt: timestamp('reserved_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('extraction_reservations_amount_positive', sql`${table.amountUsd} > 0`),
    familyIsolationPolicy(),
  ],
);
