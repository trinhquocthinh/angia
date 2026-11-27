import type { AdminAccountDetail } from '@angia/contracts';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startRegistrationTestApp } from '@src/shared/test/startRegistrationTestApp.js';
import { seedAccount, seedSession } from '@src/shared/test/seedAuthFixtures.js';
import {
  accountDetailKeys,
  accountLockAudits,
  accountLockSnapshot,
  callAccountLock,
  loginAccountLockCase,
  LOCK_REASON,
  seedAccountLockCase,
} from '@src/shared/test/accountLockTestFixture.js';

describe('SPEC-075: khoá và mở khoá tài khoản', () => {
  let t: Awaited<ReturnType<typeof startRegistrationTestApp>>;
  beforeAll(async () => {
    t = await startRegistrationTestApp();
  });
  afterAll(async () => {
    await t?.close();
  });
  const me = (cookie: string) => t.app.request('/api/me', { headers: { cookie } });
  const credentialVersion = async (id: string) =>
    (await t.owner.query('SELECT credential_version FROM account_credentials WHERE account_id=$1', [id]))
      .rows[0].credential_version;
  const push = async (id: string) =>
    (await t.owner.query('SELECT id FROM push_subscriptions WHERE account_id=$1', [id])).rows;

  it('TC-835: khoá thu hồi ngay phiên, Push, tăng version, chặn login, giữ dữ liệu và audit không lý do', async () => {
    const f = await seedAccountLockCase(t);
    const before = await accountLockSnapshot(t, f.target.accountId);
    const version = await credentialVersion(f.target.accountId);
    const response = await callAccountLock(t, f.admin, f.target.accountId, 'lock', {
      reason: `  ${LOCK_REASON}  `,
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const body = (await response.json()) as AdminAccountDetail;
    expect(Object.keys(body).sort()).toEqual(accountDetailKeys);
    expect(body).toEqual({
      id: f.target.accountId,
      username: f.username,
      displayName: 'Người member',
      familyName: 'Nhà thử',
      lockedAt: expect.any(String),
    });
    expect(new Date(body.lockedAt!).toISOString()).toBe(body.lockedAt);
    expect((await me(f.target.cookie)).status).toBe(401);
    expect(await push(f.target.accountId)).toEqual([]);
    expect(await credentialVersion(f.target.accountId)).toBe(version + 1);
    const login = await loginAccountLockCase(t, f.username);
    expect(login.status).toBe(403);
    expect(await login.json()).toMatchObject({ error: { code: 'ERR_ACCOUNT_LOCKED' } });
    expect(await accountLockSnapshot(t, f.target.accountId)).toEqual(before);
    expect(await accountLockAudits(t, f.target.accountId)).toEqual([
      {
        actor_account_id: f.admin.accountId,
        action: 'account_locked',
        target_account_id: f.target.accountId,
        family_id: f.familyId,
        metadata: {},
      },
    ]);
    expect(
      (await t.owner.query('SELECT lock_reason FROM accounts WHERE id=$1', [f.target.accountId])).rows[0]
        .lock_reason,
    ).toBe(LOCK_REASON);
  });

  it('TC-835: khoá lại vẫn tăng version, thay lý do và thêm audit', async () => {
    const f = await seedAccountLockCase(t);
    const version = await credentialVersion(f.target.accountId);
    for (const reason of [LOCK_REASON, 'Lý do mới']) {
      expect((await callAccountLock(t, f.admin, f.target.accountId, 'lock', { reason })).status).toBe(200);
    }
    expect(await credentialVersion(f.target.accountId)).toBe(version + 2);
    expect(await accountLockAudits(t, f.target.accountId)).toHaveLength(2);
    expect(
      (await t.owner.query('SELECT lock_reason FROM accounts WHERE id=$1', [f.target.accountId])).rows[0]
        .lock_reason,
    ).toBe('Lý do mới');
  });

  it('TC-836: mở khoá cho login mới, không hồi sinh phiên hoặc Push, không hạ version', async () => {
    const f = await seedAccountLockCase(t);
    expect((await callAccountLock(t, f.admin, f.target.accountId, 'lock')).status).toBe(200);
    const version = await credentialVersion(f.target.accountId);
    const response = await callAccountLock(t, f.admin, f.target.accountId, 'unlock');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const body = (await response.json()) as AdminAccountDetail;
    expect(Object.keys(body).sort()).toEqual(accountDetailKeys);
    expect(body.lockedAt).toBeNull();
    expect((await me(f.target.cookie)).status).toBe(401);
    expect(await push(f.target.accountId)).toEqual([]);
    expect(await credentialVersion(f.target.accountId)).toBe(version);
    const login = await loginAccountLockCase(t, f.username);
    expect(login.status).toBe(200);
    expect((await me(login.headers.get('set-cookie')!.split(';')[0]!)).status).toBe(200);
    expect(
      (await t.owner.query('SELECT lock_reason FROM accounts WHERE id=$1', [f.target.accountId])).rows[0]
        .lock_reason,
    ).toBeNull();
    expect(await accountLockAudits(t, f.target.accountId)).toEqual([
      {
        actor_account_id: f.admin.accountId,
        action: 'account_locked',
        target_account_id: f.target.accountId,
        family_id: f.familyId,
        metadata: {},
      },
      {
        actor_account_id: f.admin.accountId,
        action: 'account_unlocked',
        target_account_id: f.target.accountId,
        family_id: f.familyId,
        metadata: {},
      },
    ]);
  });

  it('TC-837: chi tiết chỉ có năm trường và không lộ thông tin nhạy cảm', async () => {
    const f = await seedAccountLockCase(t);
    const response = await callAccountLock(t, f.admin, f.target.accountId);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(Object.keys((await response.json()) as object).sort()).toEqual(accountDetailKeys);
    const unhoused = await callAccountLock(t, f.admin, f.admin.accountId);
    expect(await unhoused.json()).toEqual({
      id: f.admin.accountId,
      username: null,
      displayName: 'Người chờ',
      familyName: null,
      lockedAt: null,
    });
    const otherAdmin = await seedAccount(t.owner, { admin: true });
    expect((await callAccountLock(t, f.admin, otherAdmin, 'lock')).status).toBe(200);
  });

  it('TC-837: không tìm thấy, đã xoá, id/body sai và tự khoá trả đúng lỗi', async () => {
    const f = await seedAccountLockCase(t);
    const deleted = randomUUID();
    await t.owner.query("INSERT INTO accounts(id,display_name,deleted_at) VALUES($1,'',now())", [deleted]);
    for (const action of ['', 'lock', 'unlock']) {
      for (const id of [randomUUID(), deleted]) {
        const missing = await callAccountLock(t, f.admin, id, action);
        expect(missing.status).toBe(404);
        expect(await missing.json()).toMatchObject({ error: { code: 'ERR_NOT_FOUND' } });
      }
      const invalid = await callAccountLock(t, f.admin, 'sai-uuid', action);
      expect(invalid.status).toBe(422);
      expect(await invalid.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
    }
    for (const action of ['lock', 'unlock']) {
      for (const body of [
        { reason: '' },
        { reason: '   ' },
        { reason: 'x'.repeat(201) },
        { reason: 'Đúng', extra: true },
        {},
        { reason: 1 },
      ]) {
        const invalid = await callAccountLock(t, f.admin, f.target.accountId, action, body);
        expect(invalid.status).toBe(422);
        expect(await invalid.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
      }
    }
    const self = await callAccountLock(t, f.admin, f.admin.accountId, 'lock');
    expect(self.status).toBe(403);
    expect(await self.json()).toMatchObject({ error: { code: 'ERR_FORBIDDEN' } });
    expect(await accountLockAudits(t, f.target.accountId)).toEqual([]);
  });

  it('TC-838: main OIDC, admin local, khách bị từ chối trước thay đổi và audit', async () => {
    const f = await seedAccountLockCase(t);
    const main = await seedSession(
      t.owner,
      await seedAccount(t.owner, { familyId: f.familyId, familyRole: 'main' }),
    );
    const local = await seedSession(t.owner, await seedAccount(t.owner, { admin: true }));
    await t.owner.query("UPDATE sessions SET auth_method='local' WHERE id=$1", [local.id]);
    for (const action of ['', 'lock', 'unlock']) {
      for (const user of [main, local, null]) {
        const response = await callAccountLock(t, user, f.target.accountId, action);
        expect(response.status).toBe(user ? 403 : 401);
        expect(await response.json()).toMatchObject({
          error: { code: user ? 'ERR_FORBIDDEN' : 'ERR_UNAUTHENTICATED' },
        });
      }
    }
    for (const action of ['lock', 'unlock']) {
      const response = await callAccountLock(t, { ...f.admin, csrf: '' }, f.target.accountId, action);
      expect(response.status).toBe(403);
    }
    expect(
      (await t.owner.query('SELECT locked_at FROM accounts WHERE id=$1', [f.target.accountId])).rows,
    ).toEqual([{ locked_at: null }]);
    expect(await accountLockAudits(t, f.target.accountId)).toEqual([]);
  });
});
