import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { createSanitizePgFixture } from '@src/shared/test/createSanitizePgFixture.test-helper.js';
import { cleanupDataExports } from '../application/cleanupDataExports.js';
import { createCleanupDataExportsRepository } from './createCleanupDataExportsRepository.js';

let fixture: Awaited<ReturnType<typeof createSanitizePgFixture>>;
let accountId: string;
beforeAll(async () => {
  fixture = await createSanitizePgFixture();
  accountId = randomUUID();
  await fixture.owner.query(`INSERT INTO accounts(id,oidc_subject,display_name) VALUES ($1,$2,'Mẹ')`, [
    accountId,
    `cleanup-${accountId}`,
  ]);
});
afterAll(async () => {
  await fixture?.close();
});

async function seed(status: 'ready' | 'pending' | 'failed', old: boolean) {
  const id = randomUUID();
  await fixture.owner.query(
    `INSERT INTO data_exports(id,account_id,status,object_key,expires_at,created_at)
     VALUES ($1,$2,$3,$4,$5,now()-$6::interval)`,
    [
      id,
      accountId,
      status,
      status === 'ready' ? `exports/${id}.zip` : null,
      status === 'ready' ? new Date(Date.now() + (old ? -1000 : 86400000)) : null,
      old ? '25 hours' : '1 hour',
    ],
  );
  return id;
}
it('TC-825: role app dọn ready hết hạn, pending/failed quá 24 giờ và giữ dòng sống', async () => {
  const expired = await seed('ready', true);
  const pending = await seed('pending', true);
  const failed = await seed('failed', true);
  const ready = await seed('ready', false);
  const recentPending = await seed('pending', false);
  const recentFailed = await seed('failed', false);
  const orphan = randomUUID();
  const ids = [expired, pending, failed, ready, recentPending, recentFailed, orphan];
  const objects = new Set(ids.map((id) => `exports/${id}.zip`));
  objects.add('exports/khong-phai-uuid.zip');
  const result = await cleanupDataExports({
    repository: createCleanupDataExportsRepository(fixture.pool),
    storage: {
      async *list() {
        yield* objects;
      },
      delete: async (key) => {
        objects.delete(key);
      },
    },
  });
  expect(result).toEqual({
    expiredRemoved: 1,
    pendingFailed: 1,
    failedRemoved: 1,
    orphanRemoved: 4,
    failed: 0,
  });
  const rows = (
    await fixture.owner.query(`SELECT id,status FROM data_exports WHERE account_id=$1 ORDER BY id`, [
      accountId,
    ])
  ).rows;
  expect(rows.map((row) => row.id).sort()).toEqual([pending, ready, recentPending, recentFailed].sort());
  expect(rows.find((row) => row.id === pending)?.status).toBe('failed');
  expect(objects).toEqual(
    new Set([`exports/${ready}.zip`, `exports/${recentPending}.zip`, 'exports/khong-phai-uuid.zip']),
  );
  expect(
    (await fixture.pool.query(`SELECT rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user`))
      .rows[0],
  ).toEqual({ rolsuper: false, rolbypassrls: false });
});
it('TC-825: lỗi xoá object giữ dòng ready để lần sau thử lại', async () => {
  const id = await seed('ready', true);
  const result = await cleanupDataExports({
    repository: createCleanupDataExportsRepository(fixture.pool),
    storage: {
      async *list() {
        /* Không có tệp mồ côi. */
      },
      delete: async () => {
        throw new Error('s3_unavailable');
      },
    },
  });
  expect(result.failed).toBe(1);
  expect(
    (await fixture.owner.query(`SELECT status FROM data_exports WHERE id=$1`, [id])).rows[0]?.status,
  ).toBe('ready');
});
