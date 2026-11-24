import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedSession } from '@src/shared/test/seedAuthFixtures.js';
import { startPasswordResetContext } from '@src/shared/test/passwordResetDbFixture.js';

describe('SPEC-063: tiêu token đặt lại mật khẩu HTTP/PostgreSQL', () => {
  let t: Awaited<ReturnType<typeof startPasswordResetContext>>;
  beforeAll(async () => {
    t = await startPasswordResetContext();
  });
  afterAll(async () => {
    await t?.drain();
    await t?.close();
  });
  it('TC-764: mật khẩu mới thu hồi hai phiên, tăng version, xoá cờ và ghi audit an toàn', async () => {
    const account = await t.seed();
    await seedSession(t.owner, account.id);
    await t.owner.query(
      "UPDATE accounts SET must_change_password=true,temp_password_expires_at=now()+interval '1 day' WHERE id=$1",
      [account.id],
    );
    const { token } = await t.link(account.email);
    const response = await t.reset(token);
    expect(response.status).toBe(204);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const state = (
      await t.owner.query(
        `SELECT a.must_change_password,a.temp_password_expires_at,c.credential_version,
      (SELECT count(*)::int FROM sessions WHERE account_id=a.id) AS sessions
      FROM accounts a JOIN account_credentials c ON c.account_id=a.id WHERE a.id=$1`,
        [account.id],
      )
    ).rows[0];
    expect(state).toEqual({
      must_change_password: false,
      temp_password_expires_at: null,
      credential_version: 2,
      sessions: 0,
    });
    expect((await t.tokens(account.id))[0].used_at).toBeInstanceOf(Date);
    const audit = (
      await t.owner.query(
        "SELECT * FROM admin_audit_events WHERE target_account_id=$1 AND action='password_reset_by_email'",
        [account.id],
      )
    ).rows;
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({
      actor_account_id: account.id,
      target_account_id: account.id,
      metadata: {},
    });
    expect(JSON.stringify(audit)).not.toContain(account.email);
    expect(JSON.stringify(audit)).not.toContain(token);
    const login = await t.request('password-login', {
      identifier: account.email,
      password: 'NewStrongPassword123',
    });
    expect(login.status).toBe(200);
    expect(await login.json()).toMatchObject({ session: { passwordChangeRequired: false } });
    expect((await t.reset(token)).status).toBe(400);
  });
  it('TC-764: mật khẩu yếu không tiêu token, có thể thử lại', async () => {
    const account = await t.seed();
    const { token } = await t.link(account.email);
    const response = await t.reset(token, 'short');
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({
      error: { code: 'ERR_VALIDATION', details: { field: 'newPassword' } },
    });
    expect((await t.tokens(account.id))[0].used_at).toBeNull();
    expect((await t.reset(token)).status).toBe(204);
  });
  it.each(['expired', 'boundary', 'used', 'replaced', 'locked', 'unknown'])(
    'TC-765: token %s trả cùng lỗi 400',
    async (state) => {
      const account = await t.seed();
      const { token } = await t.link(account.email);
      if (state === 'expired')
        await t.owner.query(
          "UPDATE password_reset_tokens SET expires_at=now()-interval '31 minutes' WHERE account_id=$1",
          [account.id],
        );
      if (state === 'boundary') {
        const expires = new Date();
        await t.owner.query('UPDATE password_reset_tokens SET expires_at=$2 WHERE account_id=$1', [
          account.id,
          expires,
        ]);
        t.setNow(expires);
        try {
          expect((await t.reset(token)).status).toBe(400);
        } finally {
          t.setNow();
        }
        return;
      }
      if (state === 'used')
        await t.owner.query('UPDATE password_reset_tokens SET used_at=now() WHERE account_id=$1', [
          account.id,
        ]);
      if (state === 'replaced') await t.link(account.email);
      if (state === 'locked')
        await t.owner.query("UPDATE accounts SET locked_at=now(),lock_reason='Thử khoá' WHERE id=$1", [
          account.id,
        ]);
      const response = await t.reset(state === 'unknown' ? 'unknown-token' : token);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: {
          code: 'ERR_RESET_TOKEN_INVALID',
          message: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
        },
      });
    },
  );
  it('TC-765: hai yêu cầu đồng thời chỉ một lần thành công', async () => {
    const account = await t.seed();
    const { token } = await t.link(account.email);
    const responses = await Promise.all([t.reset(token), t.reset(token)]);
    expect(responses.map((response) => response.status).sort()).toEqual([204, 400]);
    expect(
      (
        await t.owner.query('SELECT credential_version FROM account_credentials WHERE account_id=$1', [
          account.id,
        ])
      ).rows[0].credential_version,
    ).toBe(2);
  });
});
