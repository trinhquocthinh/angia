import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { startRegistrationTestApp } from '@src/shared/test/startRegistrationTestApp.js';
import { seedAccount, seedSession, type SeededSession } from '@src/shared/test/seedAuthFixtures.js';

describe('E31-S1-T1: API công tắc mở đăng ký', () => {
  let t: Awaited<ReturnType<typeof startRegistrationTestApp>>;
  const path = '/api/admin/registration-switch';
  beforeAll(async () => {
    t = await startRegistrationTestApp();
  });
  afterAll(async () => {
    await t?.close();
  });
  beforeEach(async () => {
    await t.owner.query("DELETE FROM system_settings WHERE key='registration_open'");
    await t.owner.query("DELETE FROM admin_audit_events WHERE action='registration_switch_changed'");
  });
  const put = (user: SeededSession, open: boolean, csrf = user.csrf) =>
    t.app.request(path, {
      method: 'PUT',
      headers: { cookie: user.cookie, 'x-csrf-token': csrf, 'content-type': 'application/json' },
      body: JSON.stringify({ open }),
    });
  const audits = async () =>
    (
      await t.owner.query(
        "SELECT actor_account_id,metadata FROM admin_audit_events WHERE action='registration_switch_changed'",
      )
    ).rows;
  const get = async (registrationOpen: boolean) => {
    const response = await t.app.request('/api/registration-switch');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ registrationOpen });
  };
  it('TC-832: cài mới, đọc công khai chỉ trả đúng registrationOpen bằng true', async () => {
    await t.owner.query("DELETE FROM system_settings WHERE key='registration_open'");
    await get(true);
  });
  it('TC-833: admin tắt chặn đăng ký không lời mời, bật lại và mỗi lần gọi ghi đúng một sự kiện', async () => {
    const admin = await seedSession(t.owner, await seedAccount(t.owner, { admin: true }));
    const response = await put(admin, false);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ registrationOpen: false });
    await get(false);
    expect(await audits()).toEqual([{ actor_account_id: admin.accountId, metadata: {} }]);
    const row = (
      await t.owner.query(
        "SELECT value,updated_by,updated_at FROM system_settings WHERE key='registration_open'",
      )
    ).rows[0];
    expect(row).toEqual({ value: false, updated_by: admin.accountId, updated_at: expect.any(Date) });
    const registration = await t.app.request('/api/auth/register', {
      method: 'POST',
      headers: { origin: 'https://angia.example', 'content-type': 'application/json' },
      body: JSON.stringify({
        username: 'switch.user',
        password: 'StrongPassword123',
        displayName: 'Người dùng',
        ageConfirmed: true,
        legalAcceptance: t.legalAcceptance,
      }),
    });
    expect(registration.status).toBe(403);
    expect(await registration.json()).toMatchObject({ error: { code: 'ERR_REGISTRATION_CLOSED' } });
    for (const expectedCount of [2, 3]) {
      const enabled = await put(admin, true);
      expect(enabled.status).toBe(200);
      expect(await enabled.json()).toEqual({ registrationOpen: true });
      await get(true);
      expect(await audits()).toEqual(
        Array.from({ length: expectedCount }, () => ({ actor_account_id: admin.accountId, metadata: {} })),
      );
    }
  });
  it('TC-834: main thường, admin local và khách bị từ chối, không đổi giá trị hay ghi audit', async () => {
    const familyId = randomUUID();
    await t.owner.query('INSERT INTO families(id,name) VALUES($1,$2)', [familyId, 'Nhà thử']);
    const main = await seedSession(t.owner, await seedAccount(t.owner, { familyId, familyRole: 'main' }));
    const local = await seedSession(t.owner, await seedAccount(t.owner, { admin: true }));
    await t.owner.query("UPDATE sessions SET auth_method='local' WHERE id=$1", [local.id]);
    const before = await audits();
    for (const user of [main, local]) {
      const response = await put(user, false);
      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_FORBIDDEN' } });
    }
    const anonymous = await t.app.request(path, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: '{"open":false}',
    });
    expect(anonymous.status).toBe(401);
    expect(await anonymous.json()).toMatchObject({ error: { code: 'ERR_UNAUTHENTICATED' } });
    await get(true);
    expect(await audits()).toEqual(before);
  });
  it('TC-834: admin thiếu CSRF hoặc body sai không làm thay đổi trạng thái', async () => {
    const admin = await seedSession(t.owner, await seedAccount(t.owner, { admin: true }));
    const before = await audits();
    expect((await put(admin, false, '')).status).toBe(403);
    const invalid = await t.app.request(path, {
      method: 'PUT',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrf, 'content-type': 'application/json' },
      body: '{"open":"false"}',
    });
    expect(invalid.status).toBe(422);
    await get(true);
    expect(await audits()).toEqual(before);
  });
});
