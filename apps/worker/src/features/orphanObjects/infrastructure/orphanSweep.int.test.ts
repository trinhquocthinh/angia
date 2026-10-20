import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createPrivacyPgFixture } from '@src/shared/test/createPrivacyPgFixture.js';
import { seedExtractingDocument } from '@src/shared/test/seedExtractingDocument.js';
import type { OrphanStorage, StoredObject } from '../application/ports.js';
import { sweepOrphanObjects } from '../application/sweepOrphanObjects.js';
import { createOrphanRepository } from './createOrphanRepository.js';

const NOW = new Date('2026-10-20T20:00:00Z');
const OLD = new Date(NOW.getTime() - 25 * 3600_000);

describe('Dọn object mồ côi trên PostgreSQL thật, role app NOBYPASSRLS (BR-044)', () => {
  let fx: Awaited<ReturnType<typeof createPrivacyPgFixture>>;
  beforeAll(async () => {
    fx = await createPrivacyPgFixture();
  });
  afterAll(async () => {
    await fx?.close();
  });

  it('TC-323: chỉ đọc tham chiếu trong phạm vi gia đình và không xóa object của gia đình khác', async () => {
    const a = await seedExtractingDocument(fx.owner);
    const b = await seedExtractingDocument(fx.owner);
    const originalOf = async (documentId: string) =>
      (
        await fx.owner.query<{ key: string }>(
          'SELECT original_key AS key FROM source_documents WHERE id=$1',
          [documentId],
        )
      ).rows[0]!.key;
    const [originalA, originalB] = [await originalOf(a.documentId), await originalOf(b.documentId)];
    const folderA = originalA.slice(0, originalA.lastIndexOf('/'));
    const previewA = `${folderA}/previews/0199c000-0000-7000-8000-000000000001.webp`;
    const orphanA = `${folderA}/previews/0199c000-0000-7000-8000-000000000002.webp`;
    await fx.owner.query('UPDATE source_documents SET preview_key=$1 WHERE id=$2', [previewA, a.documentId]);

    const repository = createOrphanRepository(fx.pool);
    const references = await repository.referencedKeys(a.familyId);
    expect(references.has(originalA)).toBe(true);
    expect(references.has(previewA)).toBe(true);
    expect(references.has(originalB)).toBe(false);
    expect(await repository.listFamilyIds()).toEqual(expect.arrayContaining([a.familyId, b.familyId]));

    const deleted: string[] = [];
    const listing: StoredObject[] = [originalA, previewA, orphanA, originalB].map((key) => ({
      key,
      lastModified: OLD,
    }));
    const storage: OrphanStorage = {
      async *list(prefix) {
        if (prefix === `families/${a.familyId}/`) yield* listing;
      },
      delete: async (key) => {
        deleted.push(key);
      },
    };
    await sweepOrphanObjects(
      { repository, storage },
      { graceHours: 24, maxDeletes: 500, dryRun: false, now: () => NOW },
    );
    expect(deleted).toEqual([orphanA]);
  });
});
