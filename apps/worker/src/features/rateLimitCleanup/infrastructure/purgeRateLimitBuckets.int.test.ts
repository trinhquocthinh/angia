import { afterAll, beforeAll, expect, it } from 'vitest';
import { createSanitizePgFixture } from '@src/shared/test/createSanitizePgFixture.test-helper.js';
import { purgeRateLimitBuckets } from '../application/purgeRateLimitBuckets.js';
import { createRateLimitCleanupRepository } from './createRateLimitCleanupRepository.js';

let fixture: Awaited<ReturnType<typeof createSanitizePgFixture>>;
beforeAll(async () => {
  fixture = await createSanitizePgFixture();
});
afterAll(async () => {
  await fixture?.close();
});
it('TC-E31-S3-T1: role app xoá bucket cũ hơn một ngày và giữ bucket mới', async () => {
  await fixture.owner.query(`INSERT INTO rate_limit_buckets(key_hash,window_start)
    VALUES (repeat('a',64),now()-interval '25 hours'),(repeat('b',64),now()-interval '23 hours')`);
  expect(await purgeRateLimitBuckets({ repository: createRateLimitCleanupRepository(fixture.pool) })).toEqual(
    { removed: 1 },
  );
  const { rows } = await fixture.owner.query('SELECT key_hash FROM rate_limit_buckets');
  expect(rows).toEqual([{ key_hash: 'b'.repeat(64) }]);
  expect(
    (await fixture.pool.query('SELECT rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user'))
      .rows[0],
  ).toEqual({ rolsuper: false, rolbypassrls: false });
});
