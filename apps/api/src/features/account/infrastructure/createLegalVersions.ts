import { and, desc, eq, lte } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { legalDocumentVersions } from '@src/shared/db/schema/index.js';
import type { CurrentLegalVersions, LegalVersions } from '../application/ports.js';

export function createLegalVersions(
  db: Pick<Database, 'select'>,
  clock: () => Date = () => new Date(),
): LegalVersions {
  return {
    async current(): Promise<CurrentLegalVersions> {
      const now = clock();
      const [terms] = await db
        .select({ id: legalDocumentVersions.id })
        .from(legalDocumentVersions)
        .where(and(eq(legalDocumentVersions.kind, 'terms'), lte(legalDocumentVersions.publishedAt, now)))
        .orderBy(desc(legalDocumentVersions.publishedAt))
        .limit(1);
      const [privacy] = await db
        .select({ id: legalDocumentVersions.id })
        .from(legalDocumentVersions)
        .where(and(eq(legalDocumentVersions.kind, 'privacy'), lte(legalDocumentVersions.publishedAt, now)))
        .orderBy(desc(legalDocumentVersions.publishedAt))
        .limit(1);
      if (!terms || !privacy) {
        throw new Error('Thiếu văn bản pháp lý hiện hành');
      }
      return {
        termsVersionId: terms.id,
        privacyVersionId: privacy.id,
      };
    },
  };
}
