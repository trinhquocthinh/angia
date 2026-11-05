import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createRevisitFixture } from '@src/shared/test/createRevisitFixture.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import { seedAccount, seedSession } from '@src/shared/test/seedAuthFixtures.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

describe('API chi tiết nhắc tái khám (SPEC-044)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => t?.stop());
  const path = (id: string) => `/api/me/revisit-reminders/${id}`;
  const fixture = async () => {
    const f = await createRevisitFixture(t);
    const linked = await t.session(f.familyId, 'member');
    await t.owner.query('UPDATE accounts SET health_profile_id=$1 WHERE id=$2', [
      f.profile.id,
      linked.accountId,
    ]);
    const second = await f.add('2026-11-20', '2026-01-02');
    const first = await f.add('2026-11-20');
    await f.add('2026-11-21');
    const id = await f.reminder('2026-11-20');
    return { ...f, linked, first, second, id };
  };

  it('TC-479: mọi main và member liên kết xem được, gộp đơn và chỉ main được mở tóm tắt', async () => {
    const f = await fixture();
    const main2 = await t.session(f.familyId, 'main');
    for (const actor of [f.main, main2, f.linked]) {
      const response = await t.call(actor, 'GET', path(f.id));
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(await response.json()).toEqual({
        id: f.id,
        revisitDate: '2026-11-20',
        offset: 'two_days_before',
        profileId: f.profile.id,
        profileName: 'Mẹ',
        canOpenSummary: actor !== f.linked,
        prescriptions: [
          { id: f.first, issuedDate: '2026-01-01', facility: 'Phòng khám A' },
          { id: f.second, issuedDate: '2026-01-02', facility: 'Phòng khám A' },
        ],
      });
    }
  });

  it('TC-479: sai người nhận, chéo gia đình và UUID sai đều 404 như ID không tồn tại', async () => {
    const f = await fixture();
    for (const actor of [await t.session(f.familyId, 'member'), await t.session(await t.family())]) {
      await expectCrossFamilyDenied(
        () => t.call(actor, 'GET', path(f.id)),
        () => t.call(actor, 'GET', path(randomUUID())),
      );
    }
    await expectCrossFamilyDenied(
      () => t.call(f.main, 'GET', path('invalid')),
      () => t.call(f.main, 'GET', path(randomUUID())),
    );
  });

  it('TC-479: kiểm lại quyền và consent khi đọc; nhắc lịch sử không lộ dữ liệu khi rút đồng thuận', async () => {
    const f = await fixture();
    await t.owner.query('UPDATE accounts SET health_profile_id=NULL WHERE id=$1', [f.linked.accountId]);
    expect((await t.call(f.linked, 'GET', path(f.id))).status).toBe(404);
    await t.owner.query(
      `UPDATE health_profiles SET consent_status='withdrawn', consent_withdrawn_at=now() WHERE id=$1`,
      [f.profile.id],
    );
    const response = await t.call(f.main, 'GET', path(f.id));
    expect(response.status).toBe(404);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('TC-479: yêu cầu phiên và gia đình, trả no-store khi chưa có gia đình', async () => {
    const f = await fixture();
    const waiting = await seedSession(t.owner, await seedAccount(t.owner));
    const response = await t.call(waiting, 'GET', path(f.id));
    expect(response.status).toBe(403);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect((await t.app.request(path(f.id))).status).toBe(401);
  });
});
