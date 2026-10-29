import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createSanitizePgFixture } from '@src/shared/test/createSanitizePgFixture.test-helper.js';
import type { OrphanStorage, StoredObject } from '../application/ports.js';
import { sweepOrphanObjects } from '../application/sweepOrphanObjects.js';
import { createOrphanRepository } from './createOrphanRepository.js';

const NOW = new Date('2026-10-20T20:00:00Z');
const OLD = new Date(NOW.getTime() - 25 * 3600_000);

describe('Dọn object mồ côi trên PostgreSQL thật, role app NOBYPASSRLS (BR-044)', () => {
  let fx: Awaited<ReturnType<typeof createSanitizePgFixture>>;
  beforeAll(async () => {
    fx = await createSanitizePgFixture();
  });
  afterAll(async () => {
    await fx?.close();
  });

  it('TC-423: giữ image_key, vét legacy quá hạn và không xóa object khác gia đình', async () => {
    const a = await fx.seed();
    const b = await fx.seed();
    const c = await fx.seed();
    const folderA = a.oldKey.slice(0, a.oldKey.lastIndexOf('/'));
    const folderC = c.oldKey.slice(0, c.oldKey.lastIndexOf('/'));
    const imageC = `${folderC}/images/0199c000-0000-7000-8000-000000000001.jpg`;
    await fx.owner.query(
      `UPDATE source_documents SET image_key=$1,image_sha256=$2,status='extracting' WHERE id=$3`,
      [imageC, 'a'.repeat(64), c.documentId],
    );
    const orphanA = `${folderA}/original.heic`;

    const repository = createOrphanRepository(fx.pool);
    const references = await repository.referencedKeys(a.familyId);
    expect([...references]).toEqual([a.oldKey]);
    expect(await repository.referencedKeys(c.familyId)).toEqual(new Set([imageC]));
    expect(references.has(b.oldKey)).toBe(false);
    expect(await repository.listFamilyIds()).toEqual(expect.arrayContaining([a.familyId, b.familyId]));

    const deleted: string[] = [];
    const listing: StoredObject[] = [a.oldKey, orphanA, b.oldKey].map((key) => ({
      key,
      lastModified: OLD,
    }));
    const storage: OrphanStorage = {
      async *list(prefix) {
        if (prefix === `families/${a.familyId}/`) yield* listing;
        if (prefix === `families/${c.familyId}/`) yield { key: imageC, lastModified: OLD };
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

  it('TC-423: gia đình không còn image_key vẫn được guard empty_references bảo vệ', async () => {
    const a = await fx.seed();
    await fx.owner.query('UPDATE source_documents SET image_key=NULL WHERE id=$1', [a.documentId]);
    const deleted: string[] = [];
    const result = await sweepOrphanObjects(
      {
        repository: createOrphanRepository(fx.pool),
        storage: {
          async *list(prefix) {
            if (prefix === `families/${a.familyId}/`) yield { key: a.oldKey, lastModified: OLD };
          },
          delete: async (key) => {
            deleted.push(key);
          },
        },
      },
      { graceHours: 24, maxDeletes: 500, dryRun: false, now: () => NOW },
    );
    expect(deleted).toEqual([]);
    expect(result.families.find((f) => f.familyId === a.familyId)?.outcome).toBe('empty_references');
  });
});
