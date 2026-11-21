import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startEmailTestContext } from '@src/shared/test/accountEmailDbFixture.js';

describe('Giới hạn gửi email cùng transaction PostgreSQL', () => {
  let t: Awaited<ReturnType<typeof startEmailTestContext>>;
  beforeAll(async () => {
    t = await startEmailTestContext();
  });
  afterAll(async () => {
    await t?.stop();
  });
  it('TC-930: bốn yêu cầu đồng thời chỉ gửi ba job và ghi đúng ba lượt', async () => {
    const account = await t.seed('rate-race@example.com');
    const results = await Promise.all(
      Array.from({ length: 4 }, () => t.emails.requestVerification(account.accountId, t.now, t.rateLimit)),
    );
    expect(results.filter((result) => result.ok && result.sent)).toHaveLength(3);
    expect(results.filter((result) => !result.ok)).toEqual([
      { ok: false, code: 'ERR_RATE_LIMITED', retryAfterSeconds: 3600 },
    ]);
    expect(
      (await t.owner.query("SELECT id FROM pgboss.job WHERE data->>'to'='rate-race@example.com'")).rows,
    ).toHaveLength(3);
    const key = t.rateLimit.keyHasher('email_verification_send', account.accountId);
    expect(
      (await t.owner.query('SELECT count FROM rate_limit_buckets WHERE key_hash=$1', [key])).rows,
    ).toEqual([{ count: 3 }]);
  });
  it('TC-930: lỗi ghi hit rollback cả token mới và job, giữ link cũ dùng được', async () => {
    const account = await t.seed('rate-rollback@example.com');
    const previous = await t.send(account.accountId);
    await t.owner
      .query(`CREATE FUNCTION fail_email_hit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test rate hit'; END $$;
      CREATE TRIGGER fail_email_hit BEFORE INSERT OR UPDATE ON rate_limit_buckets FOR EACH ROW EXECUTE FUNCTION fail_email_hit()`);
    try {
      await expect(t.emails.requestVerification(account.accountId, t.now, t.rateLimit)).rejects.toThrow();
    } finally {
      await t.owner.query(
        'DROP TRIGGER fail_email_hit ON rate_limit_buckets; DROP FUNCTION fail_email_hit()',
      );
    }
    expect(
      (await t.owner.query("SELECT id FROM pgboss.job WHERE data->>'to'='rate-rollback@example.com'")).rows,
    ).toHaveLength(1);
    expect(await t.emails.confirmVerification(previous.token, t.now)).toEqual({ ok: true });
    const key = t.rateLimit.keyHasher('email_verification_send', account.accountId);
    expect(
      (await t.owner.query('SELECT count FROM rate_limit_buckets WHERE key_hash=$1', [key])).rows,
    ).toEqual([{ count: 1 }]);
  });
});
