import { sql } from 'drizzle-orm';
import { check, date, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts.js';
import { createdAtColumn, familyIdColumn, familyIsolationPolicy, idColumn } from './columns.js';
import { healthProfiles } from './healthProfiles.js';
import { uploadBatches } from './uploadBatches.js';

// Tập trạng thái theo FSM BR §3.1; chuyển trạng thái hợp lệ do domain cưỡng chế.
const DOCUMENT_STATUSES = [
  'uploaded',
  'extracting',
  'pending_review',
  'approved',
  'manual_entry',
  'awaiting_budget',
] as const;
const DOCUMENT_TYPES = ['prescription', 'lab_result', 'device_reading'] as const;

const inList = (values: readonly string[]) => sql.raw(values.map((value) => `'${value}'`).join(', '));

export const sourceDocuments = pgTable(
  'source_documents',
  {
    id: idColumn(),
    familyId: familyIdColumn(),
    healthProfileId: uuid('health_profile_id')
      .notNull()
      .references(() => healthProfiles.id, { onDelete: 'cascade' }),
    batchId: uuid('batch_id')
      .notNull()
      .references(() => uploadBatches.id, { onDelete: 'cascade' }),
    type: text('type', { enum: DOCUMENT_TYPES }),
    status: text('status', { enum: DOCUMENT_STATUSES }).notNull(),
    documentDate: date('document_date'),
    imageKey: text('image_key'),
    imageSha256: text('image_sha256'),
    privacyApprovedBy: uuid('privacy_approved_by').references(() => accounts.id),
    privacyApprovedAt: timestamp('privacy_approved_at', { withTimezone: true }),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    createdAt: createdAtColumn(),
  },
  (table) => [
    index('source_documents_profile_date_idx').on(table.healthProfileId, table.documentDate),
    index('source_documents_status_idx').on(table.status),
    check('source_documents_status_valid', sql`${table.status} IN (${inList(DOCUMENT_STATUSES)})`),
    check('source_documents_type_valid', sql`${table.type} IN (${inList(DOCUMENT_TYPES)})`),
    check(
      'source_documents_image_complete',
      sql`(${table.imageKey} IS NULL AND ${table.imageSha256} IS NULL)
        OR (${table.imageKey} IS NOT NULL
          AND char_length(btrim(${table.imageKey})) > 0
          AND ${table.imageKey} = btrim(${table.imageKey})
          AND ((${table.status} = 'uploaded' AND ${table.imageSha256} IS NULL)
            OR COALESCE(${table.imageSha256} ~ '^[0-9a-f]{64}$', false)))`,
    ),
    check(
      'source_documents_privacy_approval_complete',
      sql`(${table.privacyApprovedBy} IS NULL AND ${table.privacyApprovedAt} IS NULL)
        OR (${table.privacyApprovedBy} IS NOT NULL AND ${table.privacyApprovedAt} IS NOT NULL
          AND isfinite(${table.privacyApprovedAt}))`,
    ),
    // BR-015: chứng từ đã duyệt bắt buộc có ngày.
    check(
      'source_documents_approved_has_date',
      sql`${table.status} <> 'approved' OR ${table.documentDate} IS NOT NULL`,
    ),
    familyIsolationPolicy(),
  ],
);
