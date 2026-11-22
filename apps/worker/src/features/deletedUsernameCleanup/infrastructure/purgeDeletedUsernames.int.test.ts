import { afterAll, beforeAll, expect, it } from 'vitest';
import { createSanitizePgFixture } from '@src/shared/test/createSanitizePgFixture.test-helper.js';
import { purgeDeletedUsernames } from '../application/purgeDeletedUsernames.js';
import { createDeletedUsernameCleanupRepository } from './createDeletedUsernameCleanupRepository.js';

let fixture: Awaited<ReturnType<typeof createSanitizePgFixture>>;
beforeAll(async () => {
  fixture = await createSanitizePgFixture();
});
afterAll(async () => {
  await fixture?.close();
});
it('TC-831: role app xoá tên đã giữ 91 ngày và giữ tên mới xoá 89 ngày', async () => {
  await fixture.owner.query(`INSERT INTO deleted_usernames(username_hash,deleted_at)
    VALUES (repeat('a',64),now()-interval '91 days'),(repeat('b',64),now()-interval '89 days')`);
  expect(
    await purgeDeletedUsernames({ repository: createDeletedUsernameCleanupRepository(fixture.pool) }),
  ).toEqual({ removed: 1 });
  const { rows } = await fixture.owner.query('SELECT username_hash FROM deleted_usernames');
  expect(rows).toEqual([{ username_hash: 'b'.repeat(64) }]);
  expect(
    (await fixture.pool.query('SELECT rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user'))
      .rows[0],
  ).toEqual({ rolsuper: false, rolbypassrls: false });
});
