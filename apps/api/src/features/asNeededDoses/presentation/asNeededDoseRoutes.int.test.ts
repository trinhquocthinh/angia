import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { CurrentMedications, HealthProfile } from '@angia/contracts';
import { confirmConsentByAttestation } from '@src/shared/test/confirmConsentByAttestation.js';
import { vietnamDate } from '@src/shared/test/createFiniteCourse.js';
import { manualCourse } from '@src/shared/test/healthDataFixtures.js';
import { asNeededItem, seedAsNeededCourse } from '@src/shared/test/seedAsNeededDose.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

describe('API nhật ký liều "Khi cần" (SPEC-047, BR-054)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  const fixture = async (consent = true) => {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const profile = (await (
      await t.call(main, 'POST', '/api/health-profiles', { birthYear: 2020, displayName: 'Bé An' })
    ).json()) as HealthProfile;
    if (consent) await confirmConsentByAttestation(t, main, profile.id);
    const base = `/api/health-profiles/${profile.id}`;
    const doses = `${base}/as-needed-doses`;
    const record = (body: object) => t.call(main, 'POST', doses, body);
    const card = async (courseId: string) => {
      const current = (await (
        await t.call(main, 'GET', `${base}/medication-courses/current`)
      ).json()) as CurrentMedications;
      return current.courses.find((c) => c.id === courseId)!;
    };
    const interval = (courseId: string, text: string | null) =>
      t.call(main, 'PUT', `${base}/medication-courses/${courseId}/interval`, { text });
    return { familyId, main, profile, base, doses, record, card, interval };
  };
  const yesterdayAt = (time: string) => `${vietnamDate(-1)}T${time}:00+07:00`;

  it('TC-495: ghi liều 14:00 → thẻ có liều trước và khoảng cách "Ghi trên đơn", không có giờ liều tiếp', async () => {
    const f = await fixture();
    const item = { ...asNeededItem, minIntervalText: 'cách 4–6 giờ' };
    const { courseId } = await seedAsNeededCourse(t, f.main, f.profile.id, item);
    const response = await f.record({ courseId, givenAt: yesterdayAt('14:00'), quantity: 1, unit: 'gói' });
    expect(response.status).toBe(201);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const givenAt = new Date(yesterdayAt('14:00')).toISOString();
    expect(await response.json()).toEqual({
      id: expect.any(String),
      courseId,
      givenAt,
      quantity: 1,
      unit: 'gói',
      recordedBy: f.main.accountId,
      recordedAt: expect.any(String),
    });
    const card = await f.card(courseId);
    expect(card).toMatchObject({
      lastDoseAt: givenAt,
      interval: { text: 'cách 4–6 giờ', source: 'prescription' },
    });
    expect(Object.keys(card).filter((key) => /next/i.test(key))).toEqual([]);
    const list = await t.call(
      f.main,
      'GET',
      `${f.doses}?courseId=${courseId}&from=${vietnamDate(-1)}&to=${vietnamDate(0)}`,
    );
    expect(((await list.json()) as { doses: { givenAt: string }[] }).doses.map((d) => d.givenAt)).toEqual([
      givenAt,
    ]);
  });

  it('TC-496: không có nguồn → null; người dùng nhập → "user"; đơn có khoảng cách vẫn ưu tiên đơn', async () => {
    const f = await fixture();
    const { courseId } = await seedAsNeededCourse(t, f.main, f.profile.id);
    expect(await f.card(courseId)).toMatchObject({ lastDoseAt: null, interval: null });
    const saved = await f.interval(courseId, ' cách 6 giờ ');
    expect(saved.status).toBe(200);
    expect(await saved.json()).toEqual({ courseId, interval: { text: 'cách 6 giờ', source: 'user' } });
    expect((await f.card(courseId)).interval).toEqual({ text: 'cách 6 giờ', source: 'user' });
    expect((await f.interval(courseId, null)).status).toBe(200);
    expect((await f.card(courseId)).interval).toBeNull();

    const printed = await seedAsNeededCourse(t, f.main, f.profile.id, {
      ...asNeededItem,
      name: 'Ibuprofen',
      minIntervalText: 'cách 8 giờ',
    });
    expect(await (await f.interval(printed.courseId, 'cách 6 giờ')).json()).toEqual({
      courseId: printed.courseId,
      interval: { text: 'cách 8 giờ', source: 'prescription' },
    });
    expect((await f.card(printed.courseId)).interval).toEqual({ text: 'cách 8 giờ', source: 'prescription' });
  });

  it('TC-497: đợt 4 buổi, đợt tự khai và ngày cho trước khi đợt bắt đầu đều ERR_VALIDATION, không ghi', async () => {
    const f = await fixture();
    const daily = {
      ...asNeededItem,
      name: 'Amlodipin',
      quantityPerDose: 1,
      slots: ['morning', 'noon', 'afternoon', 'evening'],
    };
    const { courseId: dailyId } = await seedAsNeededCourse(t, f.main, f.profile.id, daily);
    const selfReported = (await (
      await t.call(f.main, 'POST', `${f.base}/medication-courses`, manualCourse)
    ).json()) as { id: string };
    const { courseId } = await seedAsNeededCourse(t, f.main, f.profile.id);
    for (const body of [
      { courseId: dailyId, givenAt: yesterdayAt('14:00') },
      { courseId: selfReported.id, givenAt: yesterdayAt('14:00') },
      { courseId, givenAt: `${vietnamDate(-2)}T23:59:00+07:00` },
    ]) {
      const response = await f.record(body);
      expect({ body, status: response.status }).toEqual({ body, status: 422 });
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
    }
    for (const id of [dailyId, selfReported.id])
      expect((await f.interval(id, 'cách 6 giờ')).status).toBe(422);
    expect(
      (
        await t.owner.query('SELECT count(*)::int AS n FROM as_needed_doses WHERE health_profile_id=$1', [
          f.profile.id,
        ])
      ).rows[0].n,
    ).toBe(0);
  });

  it('TC-498: giờ tương lai, số lượng 0/âm/> 1000, đơn vị dài và khoảng cách trên dòng không phải "Khi cần" đều 422', async () => {
    const f = await fixture();
    const { courseId } = await seedAsNeededCourse(t, f.main, f.profile.id);
    const valid = { courseId, givenAt: yesterdayAt('14:00') };
    for (const body of [
      { ...valid, givenAt: new Date(Date.now() + 3_600_000).toISOString() },
      { ...valid, quantity: 0 },
      { ...valid, quantity: -1 },
      { ...valid, quantity: 1001 },
      { ...valid, unit: 'x'.repeat(21) },
    ]) {
      const response = await f.record(body);
      expect({ body, status: response.status }).toEqual({ body, status: 422 });
    }
    const daily = { ...asNeededItem, quantityPerDose: 1, slots: ['morning'], minIntervalText: 'cách 6 giờ' };
    const data = {
      type: 'prescription',
      issuedDate: vietnamDate(-1),
      facility: null,
      diagnosis: null,
      items: [daily],
    };
    expect(
      (await t.call(f.main, 'POST', `${f.base}/manual-records`, { type: 'prescription', data })).status,
    ).toBe(422);
    expect(
      (
        await t.owner.query('SELECT count(*)::int AS n FROM as_needed_doses WHERE health_profile_id=$1', [
          f.profile.id,
        ])
      ).rows[0].n,
    ).toBe(0);
  });

  it('SPEC-047: xóa liều 204 rồi 404; khoảng ngày lọc theo giờ Việt Nam, cũ nhất trước', async () => {
    const f = await fixture();
    const { courseId } = await seedAsNeededCourse(t, f.main, f.profile.id);
    const ids: string[] = [];
    for (const time of ['20:00', '08:00'])
      ids.push(
        ((await (await f.record({ courseId, givenAt: yesterdayAt(time) })).json()) as { id: string }).id,
      );
    const today = await f.record({ courseId, givenAt: new Date(Date.now() - 1000).toISOString() });
    expect(today.status).toBe(201);
    const list = async () =>
      (
        (await (
          await t.call(f.main, 'GET', `${f.doses}?from=${vietnamDate(-1)}&to=${vietnamDate(-1)}`)
        ).json()) as { doses: { id: string }[] }
      ).doses.map((d) => d.id);
    expect(await list()).toEqual([ids[1], ids[0]]);
    expect((await t.call(f.main, 'GET', `${f.doses}?from=2026-01-01&to=2027-01-02`)).status).toBe(422);
    expect((await t.call(f.main, 'DELETE', `${f.doses}/${ids[0]}`)).status).toBe(204);
    expect((await t.call(f.main, 'DELETE', `${f.doses}/${ids[0]}`)).status).toBe(404);
    expect(await list()).toEqual([ids[1]]);
  });

  it('SPEC-047: chưa đồng thuận 409; member và thiếu CSRF 403', async () => {
    const f = await fixture(false);
    const course = '00000000-0000-7000-8000-000000000000';
    const body = { courseId: course, givenAt: yesterdayAt('14:00') };
    for (const response of [
      await f.record(body),
      await t.call(f.main, 'GET', `${f.doses}?from=2026-01-01&to=2026-01-31`),
      await t.call(f.main, 'DELETE', `${f.doses}/${course}`),
      await f.interval(course, 'cách 6 giờ'),
    ]) {
      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_CONSENT_REQUIRED' } });
    }
    const member = await t.session(f.familyId, 'member');
    expect((await t.call(member, 'POST', f.doses, body)).status).toBe(403);
    const noCsrf = await t.app.request(f.doses, {
      method: 'POST',
      headers: { cookie: f.main.cookie, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(noCsrf.status).toBe(403);
  });
});
