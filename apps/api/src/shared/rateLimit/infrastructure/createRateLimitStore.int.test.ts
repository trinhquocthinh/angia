import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDatabase } from '@src/shared/db/createDatabase.js';
import { runMigrations } from '@src/shared/db/runMigrations.js';
import { startTestDatabase } from '@src/shared/test/startTestDatabase.js';
import { createRateLimitStore } from './createRateLimitStore.js';
import { createRateLimitKeyHasher } from './createRateLimitKeyHasher.js';
import { rateLimitPolicies } from '../domain/rateLimitPolicies.js';
import { recordRateLimitHit } from '../application/recordRateLimitHit.js';
import { checkRateLimit } from '../application/checkRateLimit.js';

describe('Bucket rate limit bằng role app', () => {
  let testDb: Awaited<ReturnType<typeof startTestDatabase>>;
  let pool: pg.Pool;
  let store: ReturnType<typeof createRateLimitStore>;
  const keyHasher = createRateLimitKeyHasher('test-secret');
  beforeAll(async () => {
    testDb = await startTestDatabase();
    await runMigrations(testDb.ownerUrl);
    pool = new pg.Pool({ connectionString: testDb.appUrl });
    store = createRateLimitStore(createDatabase(pool));
  });
  afterAll(async () => {
    await pool?.end();
    await testDb?.container.stop();
  });
  it('20 increment đồng thời nguyên tử, cửa sổ tách bucket và chỉ lưu HMAC hex', async () => {
    const key = keyHasher('register', '192.0.2.1');
    const counts = await Promise.all(Array.from({ length: 20 }, () => store.increment(key, 0)));
    expect(Math.max(...counts)).toBe(20);
    expect(await store.read(key, 0)).toBe(20);
    expect(await store.read(key, 3600000)).toBe(0);
    expect(await store.increment(key, 3600000)).toBe(1);
    const { rows } = await pool.query('SELECT key_hash FROM rate_limit_buckets');
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) expect(row.key_hash).toMatch(/^[a-f0-9]{64}$/);
  });
  it('TC-845 mức module: 10 lần sai chặn IP+username thường; HTTP chờ E26-S4-T1', async () => {
    const deps = { store, keyHasher, now: () => 1 };
    const policy = rateLimitPolicies.login_failed;
    const key = { ip: '192.0.2.2', username: 'Me.Lan' };
    for (let i = 0; i < 10; i++) await recordRateLimitHit(deps, policy, key);
    expect(await checkRateLimit(deps, policy, { ...key, username: 'me.lan' })).toMatchObject({
      blocked: true,
      retryAfterSeconds: 900,
    });
    expect((await checkRateLimit(deps, policy, { ...key, username: 'other' })).blocked).toBe(false);
    expect((await checkRateLimit(deps, policy, { ...key, ip: '192.0.2.3' })).blocked).toBe(false);
    const { rows } = await pool.query('SELECT key_hash FROM rate_limit_buckets');
    for (const row of rows) expect(row.key_hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
