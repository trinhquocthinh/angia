import { sql } from 'drizzle-orm';
import { boolean, check, index, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { idColumn } from './columns.js';

// Văn bản công khai, không có dữ liệu sức khoẻ nên không RLS family.
export const legalDocumentVersions = pgTable(
  'legal_document_versions',
  {
    id: idColumn(),
    kind: text('kind', { enum: ['terms', 'privacy'] }).notNull(),
    version: text('version').notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }).notNull(),
    material: boolean('material').notNull(),
    contentPath: text('content_path').notNull(),
    sha256: text('sha256').notNull(),
  },
  (t) => [
    unique('legal_document_versions_kind_version_unique').on(t.kind, t.version),
    index('legal_document_versions_current_idx').on(t.kind, t.publishedAt),
    check('legal_document_versions_kind_valid', sql`${t.kind} IN ('terms', 'privacy')`),
    check('legal_document_versions_sha256_valid', sql`${t.sha256} ~ '^[a-f0-9]{64}$'`),
  ],
);
