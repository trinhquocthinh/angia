import { desc, lte } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { legalDocumentVersions } from '@src/shared/db/schema/index.js';
import type { CurrentLegalDocuments } from '../application/ports.js';

export async function readCurrentLegalDocuments(
  db: Pick<Database, 'selectDistinctOn'>,
  now: Date,
): Promise<CurrentLegalDocuments> {
  const rows = await db
    .selectDistinctOn([legalDocumentVersions.kind])
    .from(legalDocumentVersions)
    .where(lte(legalDocumentVersions.publishedAt, now))
    .orderBy(
      legalDocumentVersions.kind,
      desc(legalDocumentVersions.publishedAt),
      desc(legalDocumentVersions.id),
    );
  const documents = rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    version: row.version,
    publishedAt: row.publishedAt.toISOString(),
    material: row.material,
    url: '/' + row.contentPath,
  }));
  const terms = documents.find((row) => row.kind === 'terms');
  const privacy = documents.find((row) => row.kind === 'privacy');
  if (!terms || !privacy) throw new Error('Thiếu văn bản pháp lý hiện hành');
  return { terms, privacy };
}
