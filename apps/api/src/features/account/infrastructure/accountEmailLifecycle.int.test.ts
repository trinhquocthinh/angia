import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startEmailTestContext } from '@src/shared/test/accountEmailDbFixture.js';

describe('Lưu trữ thay đổi và xác minh email PostgreSQL', () => {
  let t: Awaited<ReturnType<typeof startEmailTestContext>>;
  beforeAll(async () => {
    t = await startEmailTestContext();
  });
  afterAll(async () => {
    await t?.stop();
  });

  it('TC-925: gửi đúng một email, chỉ lưu hash và xác nhận email hiện tại', async () => {
    const account = await t.seed('verify@example.com');
    const sent = await t.send(account.accountId);
    expect(sent.result).toEqual({ ok: true, sent: true });
    expect(sent.jobs).toHaveLength(1);
    expect(sent.job.deletion_seconds).toBe(60);
    expect(sent.job.keep_until.getTime() - sent.job.start_after.getTime()).toBe(86400000);
    expect(sent.job.data).toEqual({
      to: 'verify@example.com',
      subject: 'Xác minh email AN GIA',
      text: `Bạn vừa yêu cầu xác minh email cho tài khoản AN GIA.\n\nMở liên kết sau trong 24 giờ để xác minh:\nhttps://angia.example/verify-email#token=${sent.token}\n\nNếu bạn không yêu cầu, hãy bỏ qua email này.`,
    });
    expect(sent.tokens).toHaveLength(1);
    expect(sent.tokens[0]).toMatchObject({
      token_hash: t.digest(sent.token),
      expires_at: new Date(t.now.getTime() + 86400000),
    });
    expect(JSON.stringify(sent.tokens)).not.toContain(sent.token);
    expect(await t.emails.confirmVerification(sent.token, t.now)).toEqual({ ok: true });
    expect(await t.rows(account.accountId)).toMatchObject({ email_verified_at: t.now });
    expect(
      (
        await t.owner.query(
          "SELECT id FROM admin_audit_events WHERE action='email_changed' AND target_account_id=$1",
          [account.accountId],
        )
      ).rows,
    ).toHaveLength(0);
  });
  it('TC-928: email cũ đã xác minh được giữ và không tự gửi job', async () => {
    const account = await t.seed('old@example.com', true);
    expect(await t.emails.change({ ...account, email: 'new@example.com' })).toEqual({
      ok: true,
      value: { email: 'old@example.com', emailVerified: true, pendingEmail: 'new@example.com' },
    });
    expect(await t.rows(account.accountId)).toMatchObject({
      email: 'old@example.com',
      email_verified_at: t.now,
      pending_email: 'new@example.com',
    });
    expect(
      (await t.owner.query("SELECT id FROM pgboss.job WHERE data->>'to'='new@example.com'")).rows,
    ).toHaveLength(0);
    // Phần nhận link đặt lại của email cũ thuộc E29-S1-T3.
    expect(await t.emails.change({ ...account, email: 'old@example.com' })).toMatchObject({
      ok: true,
      value: { pendingEmail: null },
    });
  });
  it('TC-929: xác nhận pending_email ghi đúng một audit không chứa email/token', async () => {
    const account = await t.seed('audit-old@example.com', true);
    await t.emails.change({ ...account, email: 'audit-new@example.com' });
    const sent = await t.send(account.accountId);
    expect(await t.emails.confirmVerification(sent.token, t.now)).toEqual({ ok: true });
    expect(await t.rows(account.accountId)).toMatchObject({
      email: 'audit-new@example.com',
      pending_email: null,
      email_verified_at: t.now,
    });
    const audit = await t.owner.query(
      "SELECT actor_account_id,target_account_id,family_id,metadata FROM admin_audit_events WHERE action='email_changed' AND target_account_id=$1",
      [account.accountId],
    );
    expect(audit.rows).toEqual([
      {
        actor_account_id: account.accountId,
        target_account_id: account.accountId,
        family_id: null,
        metadata: {},
      },
    ]);
  });
  it.each([null, 'unverified@example.com'])(
    'TC-932: thay thẳng email chưa xác minh %s, không tự gửi',
    async (email) => {
      const account = await t.seed(email);
      const target = `replacement-${account.accountId}@example.com`;
      expect(await t.emails.change({ ...account, email: target })).toEqual({
        ok: true,
        value: { email: target, emailVerified: false, pendingEmail: null },
      });
      expect(await t.rows(account.accountId)).toMatchObject({
        email: target,
        email_verified_at: null,
        pending_email: null,
      });
      expect(
        (await t.owner.query("SELECT id FROM pgboss.job WHERE data->>'to'=$1", [target])).rows,
      ).toHaveLength(0);
    },
  );
  it('TC-930: đã xác minh không gửi; chưa có email trả lỗi', async () => {
    const verified = await t.seed('already@example.com', true);
    expect(await t.emails.requestVerification(verified.accountId, t.now, t.rateLimit)).toEqual({
      ok: true,
      sent: false,
    });
    const empty = await t.seed();
    expect(await t.emails.requestVerification(empty.accountId, t.now, t.rateLimit)).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
    });
  });

  it('TC-925: email lọt regex nhưng worker không nhận thì báo ERR_VALIDATION, không tạo token/job', async () => {
    const odd = await t.seed('a..b@example.com');
    expect(await t.emails.requestVerification(odd.accountId, t.now, t.rateLimit)).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
    });
    const tokens = await t.owner.query('SELECT 1 FROM email_verification_tokens WHERE account_id=$1', [
      odd.accountId,
    ]);
    const jobs = await t.owner.query("SELECT 1 FROM pgboss.job WHERE data->>'to'=$1", ['a..b@example.com']);
    expect([tokens.rowCount, jobs.rowCount]).toEqual([0, 0]);
  });
});
