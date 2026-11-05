import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { vietnamDate } from '@src/shared/test/createFiniteCourse.js';
import { createRevisitFixture } from '@src/shared/test/createRevisitFixture.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

describe('API lịch hẹn tái khám (SPEC-043)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => t?.stop());

  it('TC-473: mặc định hôm nay VN, gộp cùng ngày, tăng dần và lọc from', async () => {
    const f = await createRevisitFixture(t);
    await f.add(vietnamDate(-1));
    await f.add(null);
    const first = await f.add(vietnamDate(0), '2026-01-02');
    const second = await f.add(vietnamDate(0));
    const later = await f.add(vietnamDate(2));
    const response = await t.call(f.main, 'GET', `${f.base}/revisits`);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual([
      {
        revisitDate: vietnamDate(0),
        prescriptions: [
          { id: second, issuedDate: '2026-01-01', facility: 'Phòng khám A' },
          { id: first, issuedDate: '2026-01-02', facility: 'Phòng khám A' },
        ],
      },
      {
        revisitDate: vietnamDate(2),
        prescriptions: [{ id: later, issuedDate: '2026-01-01', facility: 'Phòng khám A' }],
      },
    ]);
    expect(
      await (await t.call(f.main, 'GET', `${f.base}/revisits?from=${vietnamDate(1)}`)).json(),
    ).toHaveLength(1);
    expect(
      await (await t.call(f.main, 'GET', `${f.base}/revisits?from=${vietnamDate(-1)}`)).json(),
    ).toHaveLength(3);
    expect((await t.call(f.main, 'GET', `${f.base}/revisits?from=2026-02-30`)).status).toBe(422);
  });

  it('TC-472/474: sửa, xóa ngày, hai biên hợp lệ; từ chối thiếu/sai ngày không đổi dữ liệu', async () => {
    const f = await createRevisitFixture(t);
    const id = await f.add('2026-11-20');
    for (const date of ['2026-01-01', '2035-12-30', null]) {
      const response = await f.put(id, date);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ revisitDate: date });
    }
    for (const body of [
      {},
      { revisitDate: '2025-12-31' },
      { revisitDate: '2035-12-31' },
      { revisitDate: '2026-02-30' },
      { revisitDate: 1 },
    ]) {
      const response = await t.call(f.main, 'PUT', `${f.base}/prescriptions/${id}/revisit-date`, body);
      expect(response.status).toBe(422);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
    }
    expect((await t.owner.query('SELECT revisit_date FROM prescriptions WHERE id=$1', [id])).rows).toEqual([
      { revisit_date: null },
    ]);
  });

  it('TC-473/474: main, CSRF, consent, đúng hồ sơ và cách ly gia đình cho cả hai route', async () => {
    const f = await createRevisitFixture(t);
    const id = await f.add('2026-11-20');
    const member = await t.session(f.familyId, 'member');
    const other = await t.session(await t.family());
    const routes = [
      { method: 'GET', path: `${f.base}/revisits`, body: undefined },
      { method: 'PUT', path: `${f.base}/prescriptions/${id}/revisit-date`, body: { revisitDate: null } },
    ];
    for (const route of routes) {
      expect((await t.call(member, route.method, route.path, route.body)).status).toBe(403);
      expect((await t.app.request(route.path, { method: route.method })).status).toBe(401);
      await expectCrossFamilyDenied(
        () => t.call(other, route.method, route.path, route.body),
        () => t.call(other, route.method, route.path.replace(f.profile.id, randomUUID()), route.body),
      );
    }
    const pending = await createRevisitFixture(t, false);
    const pendingId = await pending.add('2026-11-20');
    for (const response of [
      await t.call(pending.main, 'GET', `${pending.base}/revisits`),
      await pending.put(pendingId, null),
    ]) {
      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_CONSENT_REQUIRED' } });
    }
    expect((await f.put(pendingId, null)).status).toBe(404);
    const csrf = await t.app.request(`${f.base}/prescriptions/${id}/revisit-date`, {
      method: 'PUT',
      headers: { cookie: f.main.cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ revisitDate: null }),
    });
    expect(csrf.status).toBe(403);
  });
});
