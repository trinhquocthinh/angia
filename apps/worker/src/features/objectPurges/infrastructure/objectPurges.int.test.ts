import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createSanitizePgFixture } from '@src/shared/test/createSanitizePgFixture.test-helper.js';
import { purgePendingObjects } from '../application/purgePendingObjects.js';
import { createObjectPurgeRepository } from './createObjectPurgeRepository.js';
import { pino } from 'pino';
import { createPgBoss } from '@src/shared/queue/createPgBoss.js';
import { registerPurgePendingObjectsJob } from '@src/jobs/registerPurgePendingObjectsJob.js';

describe('Receipt dọn object qua PostgreSQL và role app NOBYPASSRLS', () => {
  let fx: Awaited<ReturnType<typeof createSanitizePgFixture>>;
  beforeAll(async () => {
    fx = await createSanitizePgFixture();
  });
  afterAll(async () => {
    await fx?.close();
  });

  it('TC-421: startup enqueue job thật, lỗi giữ receipt và retry theo pg-boss', async () => {
    const a = await fx.seed();
    const key = `families/${a.familyId}/retry.jpg`;
    await fx.owner.query('INSERT INTO object_purges(object_key,family_id) VALUES ($1,$2)', [key, a.familyId]);
    const logger = pino({ level: 'silent' });
    const boss = createPgBoss(fx.appUrl, logger);
    let fail = true;
    const readJob = async () =>
      (
        await fx.owner.query(
          `SELECT state,output,retry_limit,retry_delay,retry_backoff FROM pgboss.job WHERE name='purge-pending-objects'`,
        )
      ).rows[0];
    try {
      await boss.start();
      await registerPurgePendingObjectsJob(
        boss,
        {
          repository: createObjectPurgeRepository(fx.pool),
          storage: {
            delete: async () => {
              if (fail) throw new Error(`PII ${key}`);
            },
          },
        },
        logger,
      );
      await expect.poll(readJob, { timeout: 15_000, interval: 100 }).toMatchObject({
        state: 'retry',
        retry_limit: 3,
        retry_delay: 60,
        retry_backoff: true,
      });
      const receipt = await fx.owner.query(
        'SELECT attempts,last_error FROM object_purges WHERE object_key=$1',
        [key],
      );
      expect(receipt.rows).toEqual([{ attempts: 1, last_error: 'unknown' }]);
      expect(JSON.stringify((await readJob()).output)).not.toContain(key);
      fail = false;
      // Cho job test đến hạn ngay, không chờ hết backoff thật.
      await fx.owner.query(`UPDATE pgboss.job SET start_after=now() WHERE name='purge-pending-objects'`);
      await expect.poll(readJob, { timeout: 15_000, interval: 100 }).toMatchObject({ state: 'completed' });
      expect((await fx.owner.query('SELECT 1 FROM object_purges WHERE object_key=$1', [key])).rows).toEqual(
        [],
      );
    } finally {
      await boss.stop({ graceful: false });
    }
  });

  it('TC-422: vét hơn 100 khóa, cô lập gia đình, giữ trần retry và chạy lặp an toàn', async () => {
    const a = await fx.seed();
    const b = await fx.seed();
    const keys = Array.from(
      { length: 102 },
      (_, i) => `families/${a.familyId}/old-${i.toString().padStart(3, '0')}`,
    );
    const other = `families/${b.familyId}/old`;
    await fx.owner.query(
      `INSERT INTO object_purges(object_key,family_id) SELECT unnest($1::text[]),$2::uuid`,
      [keys, a.familyId],
    );
    await fx.owner.query(`INSERT INTO object_purges(object_key,family_id) VALUES ($1,$2)`, [
      other,
      b.familyId,
    ]);
    await fx.owner.query(`UPDATE object_purges SET attempts=10 WHERE object_key=$1`, [keys[101]]);
    const repository = createObjectPurgeRepository(fx.pool);
    await repository.withFamily(a.familyId, async (store) => {
      expect(await store.next(200, 10)).not.toContain(other);
      await store.remove(other);
      await store.recordFailure(other, 'AccessDenied');
    });
    expect(
      (await fx.owner.query('SELECT attempts FROM object_purges WHERE object_key=$1', [other])).rows,
    ).toEqual([{ attempts: 0 }]);

    const deleted = new Set<string>();
    const calls: string[] = [];
    const deps = {
      repository,
      storage: {
        delete: async (key: string) => {
          calls.push(key);
          if (key === keys[0]) throw Object.assign(new Error('PII'), { name: 'AccessDenied' });
          deleted.add(key);
        },
      },
      signal: new AbortController().signal,
    };
    expect(await purgePendingObjects(deps, { batchSize: 100, maxAttempts: 10 })).toEqual({
      deleted: 101,
      failed: 1,
    });
    expect(calls.filter((key) => key === keys[0])).toHaveLength(1);
    expect(deleted.has(keys[101]!)).toBe(false);
    expect(
      (await fx.owner.query('SELECT attempts,last_error FROM object_purges WHERE object_key=$1', [keys[0]]))
        .rows,
    ).toEqual([{ attempts: 1, last_error: 'AccessDenied' }]);

    // S3 đã xóa nhưng phản hồi/COMMIT trước đó bị mất: receipt vẫn phải dọn được.
    await fx.owner.query(`INSERT INTO object_purges(object_key,family_id) VALUES ($1,$2)`, [
      keys[1],
      a.familyId,
    ]);
    deps.storage.delete = async (key) => {
      deleted.add(key);
    };
    expect(await purgePendingObjects(deps, { batchSize: 100, maxAttempts: 10 })).toEqual({
      deleted: 2,
      failed: 0,
    });
    expect(await purgePendingObjects(deps, { batchSize: 100, maxAttempts: 10 })).toEqual({
      deleted: 0,
      failed: 0,
    });
    expect((await fx.owner.query('SELECT object_key,attempts FROM object_purges')).rows).toEqual([
      { object_key: keys[101], attempts: 10 },
    ]);
  });
});
