import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startEmailTestContext } from '@src/shared/test/accountEmailDbFixture.js';

const invalid = { ok: false, code: 'ERR_VERIFICATION_TOKEN_INVALID' };
describe('Vòng đời token xác minh email PostgreSQL', () => {
  let t: Awaited<ReturnType<typeof startEmailTestContext>>;
  beforeAll(async () => {
    t = await startEmailTestContext();
  });
  afterAll(async () => {
    await t?.stop();
  });
  it('TC-926: token rác, hết hạn đúng 24 giờ hoặc đã dùng bị từ chối', async () => {
    expect(await t.emails.confirmVerification('rac', t.now)).toEqual(invalid);
    const account = await t.seed('expired@example.com');
    const first = await t.send(account.accountId);
    expect(await t.emails.confirmVerification(first.token, new Date(t.now.getTime() + 86400000))).toEqual(
      invalid,
    );
    const second = await t.send(account.accountId);
    expect(await t.emails.confirmVerification(second.token, t.now)).toEqual({ ok: true });
    expect(await t.emails.confirmVerification(second.token, t.now)).toEqual(invalid);
  });
  it('TC-926: gửi link mới vô hiệu link cũ; đổi email vô hiệu token cũ', async () => {
    const account = await t.seed('resend@example.com');
    const first = await t.send(account.accountId);
    const second = await t.send(account.accountId);
    expect(second.token).not.toBe(first.token);
    expect(await t.emails.confirmVerification(first.token, t.now)).toEqual(invalid);
    await t.emails.change({ ...account, email: 'different@example.com' });
    expect(await t.emails.confirmVerification(second.token, t.now)).toEqual(invalid);
  });
  it('TC-931: tài khoản khác xác nhận trước chặn cả gửi và xác nhận token cũ', async () => {
    const a = await t.seed('shared@example.com');
    const b = await t.seed('SHARED@example.com');
    const first = await t.send(a.accountId);
    const second = await t.send(b.accountId);
    expect(await t.emails.confirmVerification(first.token, t.now)).toEqual({ ok: true });
    expect(await t.emails.requestVerification(b.accountId, t.now, t.rateLimit)).toEqual({
      ok: false,
      code: 'ERR_EMAIL_TAKEN',
    });
    expect(await t.emails.confirmVerification(second.token, t.now)).toEqual({
      ok: false,
      code: 'ERR_EMAIL_TAKEN',
    });
    expect(await t.rows(b.accountId)).toMatchObject({ email_verified_at: null });
  });
  it('TC-931: hai xác nhận đồng thời chỉ một tài khoản thắng', async () => {
    const a = await t.seed('race@example.com');
    const b = await t.seed('race@example.com');
    const first = await t.send(a.accountId);
    const second = await t.send(b.accountId);
    const outcomes = await Promise.all([
      t.emails.confirmVerification(first.token, t.now),
      t.emails.confirmVerification(second.token, t.now),
    ]);
    expect(outcomes).toContainEqual({ ok: true });
    expect(outcomes).toContainEqual({ ok: false, code: 'ERR_EMAIL_TAKEN' });
  });
  it('TC-925: lỗi enqueue rollback token và không vô hiệu link cũ', async () => {
    const account = await t.seed('rollback@example.com');
    const original = await t.send(account.accountId);
    await t.owner
      .query(`CREATE FUNCTION fail_email_job() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test enqueue'; END $$;
      CREATE TRIGGER fail_email_job BEFORE INSERT ON pgboss.job FOR EACH ROW EXECUTE FUNCTION fail_email_job()`);
    try {
      await expect(t.emails.requestVerification(account.accountId, t.now, t.rateLimit)).rejects.toThrow();
    } finally {
      await t.owner.query('DROP TRIGGER fail_email_job ON pgboss.job; DROP FUNCTION fail_email_job()');
    }
    expect(await t.emails.confirmVerification(original.token, t.now)).toEqual({ ok: true });
  });
  it('TC-927: credential version cũ hoặc phiên bị thu hồi không thay email', async () => {
    const account = await t.seed('stale@example.com');
    await t.owner.query('UPDATE account_credentials SET credential_version=2 WHERE account_id=$1', [
      account.accountId,
    ]);
    expect(await t.emails.change({ ...account, email: 'stale-new@example.com' })).toEqual({
      ok: false,
      code: 'ERR_INVALID_CREDENTIALS',
    });
    expect(await t.rows(account.accountId)).toMatchObject({ email: 'stale@example.com' });
    await t.owner.query('DELETE FROM sessions WHERE id=$1', [account.sessionId]);
    expect(
      await t.emails.change({ ...account, expectedCredentialVersion: 2, email: 'stale-new@example.com' }),
    ).toEqual({ ok: false, code: 'ERR_INVALID_CREDENTIALS' });
  });
});
