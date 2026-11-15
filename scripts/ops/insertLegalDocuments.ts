import { newId } from '../../apps/api/src/shared/db/schema/newId.js';
import type pg from 'pg';
import { assertLegalDocumentUnchanged } from './assertLegalDocumentUnchanged.js';

interface SeedLegalDocument {
  kind: 'terms' | 'privacy';
  version: string;
  publishedAt: Date;
  material: boolean;
  contentPath: string;
  sha256: string;
}

export async function insertLegalDocuments(client: pg.Client, documents: readonly SeedLegalDocument[]) {
  const counts = { inserted: 0, existing: 0 };
  await client.query('BEGIN');
  try {
    for (const doc of documents) {
      const result = await client.query(
        `INSERT INTO legal_document_versions
        (kind,version,published_at,material,content_path,sha256,id) VALUES($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (kind,version) DO NOTHING RETURNING id`,
        [doc.kind, doc.version, doc.publishedAt, doc.material, doc.contentPath, doc.sha256, newId()],
      );
      if (result.rowCount === 1) {
        counts.inserted++;
        continue;
      }
      const { rows } = await client.query<SeedLegalDocument>(
        `SELECT sha256,material,
        published_at AS "publishedAt",content_path AS "contentPath"
        FROM legal_document_versions WHERE kind=$1 AND version=$2 FOR SHARE`,
        [doc.kind, doc.version],
      );
      const existing = rows[0];
      if (!existing) throw new Error('Không đọc được bản legal đã tồn tại');
      assertLegalDocumentUnchanged(existing, doc);
      counts.existing++;
    }
    await client.query('COMMIT');
    return counts;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
