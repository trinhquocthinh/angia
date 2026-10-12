import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile, MeasurementPage, MeasurementSeries } from '@angia/contracts';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import type { SeededSession } from '@src/shared/test/seedAuthFixtures.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

type Seed = { measuredOn: string; measuredTime?: string | null; createdAt?: string };

describe('API số đo: phân trang F09a và chuỗi theo tuần SPEC-020 (E5-S1-T1)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });

  const fixture = async () => {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const profile = (await (
      await t.call(main, 'POST', '/api/health-profiles', { displayName: 'Mẹ' })
    ).json()) as HealthProfile;
    const base = `/api/health-profiles/${profile.id}/measurements`;
    return { familyId, main, profile, base };
  };
  const insertBloodPressure = async (familyId: string, profileId: string, seed: Seed) => {
    const id = randomUUID();
    await t.owner.query(
      `INSERT INTO measurements (id, family_id, health_profile_id, kind, measured_on, measured_time,
         systolic, diastolic, manual_without_source, created_at)
       VALUES ($1, $2, $3, 'blood_pressure', $4, $5, 130, 85, true, COALESCE($6::timestamptz, now()))`,
      [id, familyId, profileId, seed.measuredOn, seed.measuredTime ?? null, seed.createdAt ?? null],
    );
    return id;
  };
  const getJson = async <T>(user: SeededSession, path: string) => {
    const response = await t.call(user, 'GET', path);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    return (await response.json()) as T;
  };

  it('TC-252 — F09a: trang ổn định, không trùng/sót; trùng ngày/giờ/created_at; cursor nhóm khác → trang rỗng', async () => {
    const f = await fixture();
    const sameInstant = '2026-10-09T00:00:00Z';
    const seeds: Seed[] = [
      { measuredOn: '2026-10-10', measuredTime: '07:00' },
      { measuredOn: '2026-10-09', measuredTime: '20:00' },
      { measuredOn: '2026-10-09', measuredTime: null, createdAt: sameInstant },
      { measuredOn: '2026-10-09', measuredTime: null, createdAt: sameInstant },
      { measuredOn: '2026-10-09', measuredTime: '06:00', createdAt: sameInstant },
      { measuredOn: '2026-10-01', measuredTime: '06:00' },
    ];
    const ids: string[] = [];
    for (const seed of seeds) ids.push(await insertBloodPressure(f.familyId, f.profile.id, seed));
    const all = await getJson<MeasurementPage>(f.main, `${f.base}?limit=50`);
    expect(all.nextCursor).toBeNull();
    // Mới nhất trước; cùng ngày: có giờ trước (giờ giảm dần), chưa có giờ ở cuối ngày.
    expect(all.items.map((m) => m.id).slice(0, 3)).toEqual([ids[0], ids[1], ids[4]]);
    expect(all.items.at(-1)!.id).toBe(ids[5]);
    const pages: MeasurementPage[] = [await getJson<MeasurementPage>(f.main, `${f.base}?limit=2`)];
    while (pages.at(-1)!.nextCursor)
      pages.push(await getJson(f.main, `${f.base}?limit=2&cursor=${pages.at(-1)!.nextCursor}`));
    expect(pages).toHaveLength(3);
    expect(pages.flatMap((p) => p.items.map((m) => m.id))).toEqual(all.items.map((m) => m.id));
    const foreign = await fixture();
    await insertBloodPressure(foreign.familyId, foreign.profile.id, { measuredOn: '2026-10-01' });
    expect(await getJson(foreign.main, `${foreign.base}?limit=2&cursor=${pages[0]!.nextCursor}`)).toEqual({
      items: [],
      nextCursor: null,
    });
    expect((await t.call(f.main, 'GET', `${f.base}?limit=101`)).status).toBe(422);
    expect((await t.call(f.main, 'GET', `${f.base}?limit=0`)).status).toBe(422);
  });

  it('TC-058 + TC-085 — chuỗi 8 tuần: 6 điểm cũ nhất trước, 2 tuần không có số đo; Chủ Nhật thuộc tuần trước', async () => {
    const f = await fixture();
    const days = ['2026-10-11', '2026-08-17', '2026-08-31', '2026-09-08', '2026-09-21', '2026-09-28'];
    for (const measuredOn of days) await insertBloodPressure(f.familyId, f.profile.id, { measuredOn });
    await insertBloodPressure(f.familyId, f.profile.id, { measuredOn: '2026-10-12' });
    const series = await getJson<MeasurementSeries>(
      f.main,
      `${f.base}/series?kind=blood_pressure&from=2026-08-17&to=2026-10-11`,
    );
    expect(series.points.map((p) => p.measuredOn)).toEqual([...days].sort());
    expect(series.weeks).toHaveLength(8);
    expect(series.weeks.filter((w) => !w.hasMeasurement).map((w) => w.weekStart)).toEqual([
      '2026-08-24',
      '2026-09-14',
    ]);
    expect(series.weeks.at(-1)).toEqual({ weekStart: '2026-10-05', hasMeasurement: true });
  });

  it('TC-059 — 126 mg/dL hiển thị 7.0 mmol/L; DB giữ nguyên 126 mg/dL', async () => {
    const f = await fixture();
    await t.owner.query(
      `INSERT INTO measurements (id, family_id, health_profile_id, kind, measured_on, glucose_value,
         glucose_unit, manual_without_source)
       VALUES ($1, $2, $3, 'blood_glucose', '2026-10-05', 126, 'mg/dL', true)`,
      [randomUUID(), f.familyId, f.profile.id],
    );
    const series = await getJson<MeasurementSeries>(
      f.main,
      `${f.base}/series?kind=glucose&from=2026-10-01&to=2026-10-31`,
    );
    expect(series.points).toEqual([
      expect.objectContaining({
        glucoseValue: 126,
        glucoseUnit: 'mg/dL',
        displayGlucoseValue: 7,
        displayGlucoseUnit: 'mmol/L',
      }),
    ]);
    const stored = await t.owner.query(
      'SELECT glucose_value, glucose_unit FROM measurements WHERE health_profile_id = $1',
      [f.profile.id],
    );
    expect(stored.rows).toEqual([{ glucose_value: '126', glucose_unit: 'mg/dL' }]);
  });

  it('TC-250 — cửa sổ: from > to, quá 366 ngày, thiếu kind/from → 422; đúng 366 ngày hợp lệ', async () => {
    const f = await fixture();
    const series = (query: string) => t.call(f.main, 'GET', `${f.base}/series?${query}`);
    expect((await series('kind=glucose&from=2026-10-02&to=2026-10-01')).status).toBe(422);
    expect((await series('kind=glucose&from=2025-10-01&to=2026-10-02')).status).toBe(422);
    expect((await series('kind=glucose&from=2025-10-02&to=2026-10-02')).status).toBe(200);
    expect((await series('from=2026-10-01&to=2026-10-02')).status).toBe(422);
    expect((await series('kind=glucose&to=2026-10-02')).status).toBe(422);
    expect((await series('kind=glucose&from=2026-10-01&to=2026-10-02&displayGlucoseUnit=g')).status).toBe(
      422,
    );
  });

  it('SPEC-006: hồ sơ nhóm khác không phân biệt với hồ sơ không tồn tại', async () => {
    const f = await fixture();
    const other = await fixture();
    const query = 'series?kind=blood_pressure&from=2026-10-01&to=2026-10-31';
    const missing = `/api/health-profiles/${randomUUID()}/measurements`;
    await expectCrossFamilyDenied(
      () => t.call(other.main, 'GET', `${f.base}/${query}`),
      () => t.call(other.main, 'GET', `${missing}/${query}`),
    );
    await expectCrossFamilyDenied(
      () => t.call(other.main, 'GET', f.base),
      () => t.call(other.main, 'GET', missing),
    );
  });
});
