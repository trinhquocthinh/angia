import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createPrivacyPgFixture } from '@src/shared/test/createPrivacyPgFixture.js';
import { seedExtractingDocument } from '@src/shared/test/seedExtractingDocument.js';
import { createPurgeRepository } from './createPurgeRepository.js';

describe('Kiểm hồ sơ còn tồn tại trên PostgreSQL thật, role app NOBYPASSRLS (BR-010)', () => {
  let fx: Awaited<ReturnType<typeof createPrivacyPgFixture>>;
  beforeAll(async () => {
    fx = await createPrivacyPgFixture();
  });
  afterAll(async () => {
    await fx?.close();
  });

  it('TC-368: chỉ thấy hồ sơ còn tồn tại trong đúng gia đình', async () => {
    const seed = async () => {
      const { familyId, documentId } = await seedExtractingDocument(fx.owner);
      const row = await fx.owner.query<{ id: string }>(
        'SELECT health_profile_id AS id FROM source_documents WHERE id = $1',
        [documentId],
      );
      return { familyId, profileId: row.rows[0]!.id };
    };
    const [a, b] = [await seed(), await seed()];
    const repository = createPurgeRepository(fx.pool);
    expect(await repository.profileExists(a.familyId, a.profileId)).toBe(true);
    expect(await repository.profileExists(a.familyId, b.profileId)).toBe(false);
    await fx.owner.query('DELETE FROM health_profiles WHERE id = $1', [a.profileId]);
    expect(await repository.profileExists(a.familyId, a.profileId)).toBe(false);
  });
});
