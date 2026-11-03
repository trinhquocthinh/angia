import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile } from '@angia/contracts';
import { confirmConsentByAttestation } from '@src/shared/test/confirmConsentByAttestation.js';
import { vietnamDate } from '@src/shared/test/createFiniteCourse.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

describe('API nhiệt độ cơ thể (SPEC-048, BR-055)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  // Mặc định hồ sơ bé 5 tuổi chưa bật số đo (BR-049 không ẩn nhiệt độ).
  const fixture = async (consent = true) => {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const birthYear = new Date().getFullYear() - 5;
    const profile = (await (
      await t.call(main, 'POST', '/api/health-profiles', { birthYear, displayName: 'Bé An' })
    ).json()) as HealthProfile;
    if (consent) await confirmConsentByAttestation(t, main, profile.id);
    const path = `/api/health-profiles/${profile.id}/temperatures`;
    const record = (body: object) => t.call(main, 'POST', path, body);
    const list = (from = vietnamDate(-1), to = vietnamDate(0)) =>
      t.call(main, 'GET', `${path}?from=${from}&to=${to}`);
    return { familyId, main, profile, path, record, list };
  };
  const yesterdayAt = (time: string) => `${vietnamDate(-1)}T${time}:00+07:00`;
  const count = async (profileId: string) =>
    (
      await t.owner.query('SELECT count(*)::int AS n FROM temperature_readings WHERE health_profile_id=$1', [
        profileId,
      ])
    ).rows[0].n as number;

  it('TC-500: ghi 38,5 °C lúc 13:50 → 201; ghi 38,46 lưu 38,5; đọc cũ nhất trước', async () => {
    const f = await fixture();
    const response = await f.record({ celsius: 38.5, measuredAt: yesterdayAt('13:50') });
    expect(response.status).toBe(201);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({
      id: expect.any(String),
      celsius: 38.5,
      measuredAt: new Date(yesterdayAt('13:50')).toISOString(),
      recordedBy: f.main.accountId,
      recordedAt: expect.any(String),
    });
    const rounded = await f.record({ celsius: 38.46, measuredAt: yesterdayAt('09:00') });
    expect(((await rounded.json()) as { celsius: number }).celsius).toBe(38.5);
    const readings = ((await (await f.list()).json()) as { readings: { measuredAt: string }[] }).readings;
    expect(readings.map((r) => r.measuredAt)).toEqual(
      ['09:00', '13:50'].map((time) => new Date(yesterdayAt(time)).toISOString()),
    );
  });

  it('TC-501: 48,0 và 33,9 chưa xác nhận 422 kèm fields; có xác nhận 201; biên 34,0/43,0 201; 51 bị chặn', async () => {
    const f = await fixture();
    const measuredAt = yesterdayAt('13:50');
    for (const celsius of [48, 33.9]) {
      const response = await f.record({ celsius, measuredAt });
      expect(response.status).toBe(422);
      expect(await response.json()).toMatchObject({
        error: { code: 'ERR_OUT_OF_RANGE_UNCONFIRMED', details: { fields: ['celsius'] } },
      });
    }
    expect(await count(f.profile.id)).toBe(0);
    for (const body of [
      { celsius: 48, measuredAt, confirmOutOfRange: true },
      { celsius: 33.9, measuredAt, confirmOutOfRange: true },
      { celsius: 34, measuredAt },
      { celsius: 43, measuredAt },
    ])
      expect({ body, status: (await f.record(body)).status }).toEqual({ body, status: 201 });
    const tooHot = await f.record({ celsius: 51, measuredAt, confirmOutOfRange: true });
    expect(tooHot.status).toBe(422);
    expect(await tooHot.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
    const future = await f.record({
      celsius: 37,
      measuredAt: new Date(Date.now() + 3_600_000).toISOString(),
    });
    expect(future.status).toBe(422);
    // Lưới an toàn DB chặn kể cả khi đi vòng application.
    await expect(
      t.owner.query('UPDATE temperature_readings SET celsius = 51 WHERE health_profile_id = $1', [
        f.profile.id,
      ]),
    ).rejects.toThrow(/violates check constraint/);
    expect(await count(f.profile.id)).toBe(4);
  });

  it('TC-502: hồ sơ bé 5 tuổi chưa bật số đo vẫn ghi/đọc; phản hồi không có trường phân loại/nhận định', async () => {
    const f = await fixture();
    expect(f.profile.vitalsEnabled).toBeNull();
    expect((await f.record({ celsius: 39.2, measuredAt: yesterdayAt('20:00') })).status).toBe(201);
    const body = (await (await f.list()).json()) as { readings: object[] };
    expect(Object.keys(body)).toEqual(['readings']);
    expect(Object.keys(body.readings[0]!).sort()).toEqual(
      ['celsius', 'id', 'measuredAt', 'recordedAt', 'recordedBy'].sort(),
    );
  });

  it('SPEC-048: xóa 204 rồi 404; khoảng ngày lọc theo giờ Việt Nam, quá 366 ngày 422', async () => {
    const f = await fixture();
    const ids: string[] = [];
    for (const measuredAt of [yesterdayAt('20:00'), `${vietnamDate(-2)}T23:59:00+07:00`])
      ids.push(((await (await f.record({ celsius: 37, measuredAt })).json()) as { id: string }).id);
    const listed = async () =>
      (
        (await (await f.list(vietnamDate(-1), vietnamDate(-1))).json()) as { readings: { id: string }[] }
      ).readings.map((r) => r.id);
    expect(await listed()).toEqual([ids[0]]);
    expect((await f.list('2026-01-01', '2027-01-02')).status).toBe(422);
    expect((await t.call(f.main, 'DELETE', `${f.path}/${ids[0]}`)).status).toBe(204);
    expect((await t.call(f.main, 'DELETE', `${f.path}/${ids[0]}`)).status).toBe(404);
    expect(await listed()).toEqual([]);
  });

  it('SPEC-048: chưa đồng thuận 409; member và thiếu CSRF 403', async () => {
    const f = await fixture(false);
    const body = { celsius: 37, measuredAt: yesterdayAt('13:50') };
    for (const response of [
      await f.record(body),
      await f.list(),
      await t.call(f.main, 'DELETE', `${f.path}/00000000-0000-7000-8000-000000000000`),
    ]) {
      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_CONSENT_REQUIRED' } });
    }
    const member = await t.session(f.familyId, 'member');
    expect((await t.call(member, 'POST', f.path, body)).status).toBe(403);
    const noCsrf = await t.app.request(f.path, {
      method: 'POST',
      headers: { cookie: f.main.cookie, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(noCsrf.status).toBe(403);
  });
});
