import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startRegistrationTestApp } from '@src/shared/test/startRegistrationTestApp.js';
import { seedAccount, seedSession } from '@src/shared/test/seedAuthFixtures.js';
import { LOCK_PASSWORD, LOCK_REASON } from '@src/shared/test/accountLockTestFixture.js';
import {
  auditPath,
  exerciseAuditFlows,
  readAllAudit,
  readAudit,
  seedAuditFilters,
  writeRequest,
} from '@src/shared/test/adminAuditReadFixture.js';

describe('SPEC-076: API đọc nhật ký quản lý', () => {
  let t: Awaited<ReturnType<typeof startRegistrationTestApp>>;
  beforeAll(async () => {
    t = await startRegistrationTestApp();
  });
  afterAll(async () => {
    await t?.close();
  });

  it('TC-841: quét toàn bộ metadata qua API sau các luồng ghi thật, không chứa bí mật hay sức khỏe', async () => {
    const f = await exerciseAuditFlows(t);
    const events = await readAllAudit(t, f.admin);
    expect(events.map((e) => e.action)).toEqual(
      expect.arrayContaining([
        'account_locked',
        'account_unlocked',
        'registration_switch_changed',
        'family_created',
        'invitation_created',
      ]),
    );
    const count = await t.owner.query('SELECT count(*)::int AS n FROM admin_audit_events');
    expect(events).toHaveLength(count.rows[0].n);
    for (const event of events) {
      expect([{}, { reason: 'removed_from_family' }]).toContainEqual(event.metadata);
      const metadata = JSON.stringify(event.metadata);
      for (const secret of [
        LOCK_PASSWORD,
        LOCK_REASON,
        f.token,
        f.invitationCode,
        f.csrf,
        f.target.csrf,
        f.admin.csrf,
        'Canxi',
        '120',
        '80',
        'Hồ sơ thử',
        'Nhà không lộ metadata',
      ])
        expect(metadata).not.toContain(secret);
    }
  });

  it('TC-842: mọi phương thức sửa/xoá trả 404 cho admin, 403 cho thường, 401 cho khách', async () => {
    const admin = await seedSession(t.owner, await seedAccount(t.owner, { admin: true }));
    const normal = await seedSession(t.owner, await seedAccount(t.owner));
    for (const path of [auditPath, `${auditPath}/${randomUUID()}`]) {
      for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
        for (const [user, status] of [
          [admin, 404],
          [normal, 403],
          [null, 401],
        ] as const) {
          expect((await writeRequest(t, user, path, method)).status).toBe(status);
        }
      }
    }
  });

  it('TC-841: lọc thời gian, nhà, tài khoản ở cả hai vai trò và loại sự kiện', async () => {
    const f = await seedAuditFilters(t);
    const admin = await seedSession(t.owner, await seedAccount(t.owner, { admin: true }));
    for (const accountId of [f.actor, f.target]) {
      const page = await readAudit(
        t,
        admin,
        `?familyId=${f.familyId}&accountId=${accountId}&action=account_locked&from=2026-01-05T00:00:00Z&to=2026-01-06T00:00:00Z`,
      );
      expect(page.items.map((e) => e.id).sort()).toEqual(f.ids.slice(0, 4).sort());
    }
    expect((await readAudit(t, admin, `?familyId=${randomUUID()}`)).items).toEqual([]);
    expect((await readAudit(t, admin, `?accountId=${randomUUID()}`)).items).toEqual([]);
    expect((await readAudit(t, admin, `?familyId=${f.familyId}&from=2026-01-06T00:00:00Z`)).items).toEqual(
      [],
    );
    expect(
      (await readAudit(t, admin, `?familyId=${f.familyId}&to=2026-01-05T00:00:00.123456Z`)).items,
    ).toEqual([]);
    const unlocked = await readAudit(t, admin, `?familyId=${f.familyId}&action=account_unlocked`);
    expect(unlocked.items.map((e) => e.id)).toEqual([f.ids[4]]);
    const all = await readAllAudit(t, admin, 1);
    const actual = all.filter((e) => e.familyId === f.familyId);
    expect(actual.map((e) => e.id)).toEqual([f.ids[4], f.ids[3], ...f.ids.slice(0, 3).sort().reverse()]);
  });

  it('TC-841: bộ lọc/cursor sai trả 422; kiểm quyền trước validation, từ chối admin local', async () => {
    const admin = await seedSession(t.owner, await seedAccount(t.owner, { admin: true }));
    for (const query of [
      'limit=0',
      'limit=101',
      'limit=1.5',
      'cursor=!',
      'cursor=',
      'from=sai',
      'to=sai',
      'familyId=sai',
      'accountId=sai',
      'action=sai',
      'from=2026-02-01T00:00:00Z&to=2026-01-01T00:00:00Z',
    ]) {
      const response = await t.app.request(`${auditPath}?${query}`, { headers: { cookie: admin.cookie } });
      expect(response.status).toBe(422);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
      expect(response.headers.get('cache-control')).toBe('no-store');
    }
    const normal = await seedSession(t.owner, await seedAccount(t.owner));
    const local = await seedSession(t.owner, await seedAccount(t.owner, { admin: true }));
    await t.owner.query("UPDATE sessions SET auth_method='local' WHERE id=$1", [local.id]);
    for (const user of [normal, local, null]) {
      const response = await t.app.request(`${auditPath}?limit=0`, {
        headers: user ? { cookie: user.cookie } : {},
      });
      expect(response.status).toBe(user ? 403 : 401);
      expect(await response.json()).toMatchObject({
        error: { code: user ? 'ERR_FORBIDDEN' : 'ERR_UNAUTHENTICATED' },
      });
    }
  });
});
