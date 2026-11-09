import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile, VisitSummary } from '@angia/contracts';
import { confirmConsentByAttestation } from '@src/shared/test/confirmConsentByAttestation.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import { manualReading } from '@src/shared/test/healthDataFixtures.js';
import { seedAsNeededCourse } from '@src/shared/test/seedAsNeededDose.js';
import { seedPendingDocument } from '@src/shared/test/seedPendingDocument.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { createVisitSummaryRepository } from '../infrastructure/createVisitSummaryRepository.js';

const profiles = '/api/health-profiles';
const range = '?from=2026-07-01&to=2026-09-30';

describe('API bản tóm tắt tái khám SPEC-024 (E6-S1-T1)', () => {
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
    const created = await t.call(main, 'POST', profiles, { birthYear: 1950, displayName: 'Mẹ' });
    const profile = (await created.json()) as HealthProfile;
    if (consent) await confirmConsentByAttestation(t, main, profile.id);
    return { familyId, main, profile, base: `${profiles}/${profile.id}/visit-summary` };
  };
  type Fixture = Awaited<ReturnType<typeof fixture>>;
  it('từ chối JSON quá 1 MiB qua middleware thật trước khi tạo hồ sơ', async () => {
    const main = await t.session(await t.family());
    const response = await t.call(main, 'POST', profiles, {
      displayName: 'Hồ sơ thử',
      birthYear: 2000,
      ignored: 'x'.repeat(1024 * 1024),
    });
    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_REQUEST_TOO_LARGE' } });
    const saved = await t.call(main, 'GET', profiles);
    expect(await saved.json()).toEqual([]);
  });
  const insertMeasurement = (f: Fixture, measuredOn: string) =>
    t.owner.query(
      `INSERT INTO measurements (id, family_id, health_profile_id, kind, measured_on, systolic, diastolic,
         manual_without_source) VALUES ($1, $2, $3, 'blood_pressure', $4, 130, 85, true)`,
      [randomUUID(), f.familyId, f.profile.id, measuredOn],
    );
  const insertLab = (f: Fixture, resultDate: string, value: string) =>
    t.owner.query(
      `INSERT INTO lab_results (id, family_id, health_profile_id, result_date, test_name, test_name_normalized,
         value, unit, manual_without_source) VALUES ($1, $2, $3, $4, 'HbA1c', 'hba1c', $5, '%', true)`,
      [randomUUID(), f.familyId, f.profile.id, resultDate, value],
    );
  const addCourse = (f: Fixture, name: string) =>
    t.call(f.main, 'POST', `${profiles}/${f.profile.id}/medication-courses`, {
      name,
      quantityPerDose: 1,
      doseUnit: 'viên',
      slots: ['morning'],
      startDate: '2026-09-01',
    });
  const getSummary = async (f: Fixture, query = range) => {
    const response = await t.call(f.main, 'GET', `${f.base}${query}`);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    return (await response.json()) as VisitSummary;
  };

  it('TC-065: tóm tắt giữ null khi chưa ghi liều và trả giờ ISO sau khi ghi liều Khi cần', async () => {
    const f = await fixture();
    const { courseId } = await seedAsNeededCourse(t, f.main, f.profile.id);
    const before = await getSummary(f);
    expect(before.currentMedications.find((course) => course.id === courseId)).toMatchObject({
      lastDoseAt: null,
    });

    const givenAt = new Date(Date.now() - 60_000).toISOString();
    const recorded = await t.call(f.main, 'POST', `${profiles}/${f.profile.id}/as-needed-doses`, {
      courseId,
      givenAt,
    });
    expect(recorded.status).toBe(201);

    const after = await getSummary(f);
    expect(after.currentMedications.find((course) => course.id === courseId)).toMatchObject({
      lastDoseAt: givenAt,
    });
  });

  it('TC-065: đủ 2 thuốc đang dùng, 10 số đo, đúng 1 HbA1c mới nhất, ngày tạo và dòng miễn trừ', async () => {
    const f = await fixture();
    for (const name of ['Amlodipin', 'Metformin']) expect((await addCourse(f, name)).status).toBe(201);
    for (let day = 1; day <= 10; day++) await insertMeasurement(f, `2026-08-${String(day).padStart(2, '0')}`);
    await insertMeasurement(f, '2026-06-30');
    await insertLab(f, '2026-07-10', '7.4');
    await insertLab(f, '2026-09-15', '6.9');
    await t.call(f.main, 'POST', `${profiles}/${f.profile.id}/adherence-periods`, {
      medicationName: 'Amlodipin',
      status: 'taking',
      fromDate: '2026-09-01',
    });
    const before = Date.now();
    const summary = await getSummary(f);
    expect(summary.showsVitals).toBe(true);
    expect(summary.profile).toEqual({ id: f.profile.id, displayName: 'Mẹ', birthYear: 1950 });
    expect(Date.parse(summary.createdAt)).toBeGreaterThanOrEqual(before - 1000);
    expect({ from: summary.from, to: summary.to }).toEqual({ from: '2026-07-01', to: '2026-09-30' });
    expect(summary.currentMedications.map((course) => course.name).sort()).toEqual([
      'Amlodipin',
      'Metformin',
    ]);
    expect(summary.measurements.map((m) => m.measuredOn)).toEqual(
      Array.from({ length: 10 }, (_, i) => `2026-08-${String(i + 1).padStart(2, '0')}`),
    );
    expect(summary.latestLabResults).toHaveLength(1);
    expect(summary.latestLabResults[0]).toMatchObject({ testName: 'HbA1c', value: '6.9' });
    expect(summary.adherencePeriods).toHaveLength(1);
    expect(summary.adherencePeriods[0]).not.toHaveProperty('medicationNameNormalized');
    expect(summary.disclaimer).toBe('Tài liệu tổng hợp từ gia đình, không phải chỉ định y khoa.');
  });

  it('TC-065: kho summary chỉ tải bản xét nghiệm mới nhất mỗi tên, phân xử ngày/thời điểm/id và giữ RLS', async () => {
    const f = await fixture();
    await insertLab(f, '2025-01-01', 'old');
    const ids = [
      '00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000002',
      '00000000-0000-4000-8000-000000000003',
      '00000000-0000-4000-8000-000000000004',
    ];
    for (const [i, id] of ids.entries())
      await t.owner.query(
        `INSERT INTO lab_results (id,family_id,health_profile_id,result_date,test_name,test_name_normalized,
        value,manual_without_source,created_at) VALUES ($1,$2,$3,$4,$5,'hba1c',$6,true,$7)`,
        [
          id,
          f.familyId,
          f.profile.id,
          i === 3 ? '2026-10-01' : '2026-09-20',
          i === 2 ? 'hba1c' : 'HbA1c',
          String(i),
          i === 0 ? '2026-09-20T08:00Z' : '2026-09-20T09:00Z',
        ],
      );
    const repository = createVisitSummaryRepository(t.database);
    const rows = await repository.withFamily(f.familyId, (store) =>
      store.listLabResults(f.profile.id, '2026-09-30'),
    );
    expect(rows.map((row) => row.id)).toEqual([ids[2]]);
    const summary = await getSummary(f);
    expect(summary.latestLabResults.map((row) => row.id)).toEqual([ids[2]]);
    const other = await fixture();
    const denied = await repository.withFamily(other.familyId, (store) =>
      store.listLabResults(f.profile.id, '2026-09-30'),
    );
    expect(denied).toEqual([]);
  });

  it('TC-445: trẻ chưa bật không trả số đo; bật lại trả đủ dữ liệu trong khoảng', async () => {
    const f = await fixture();
    const currentYear = Number(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
      }).format(new Date()),
    );
    await t.owner.query('UPDATE health_profiles SET birth_year = $1, vitals_enabled = NULL WHERE id = $2', [
      currentYear - 5,
      f.profile.id,
    ]);
    for (const day of ['2026-08-01', '2026-08-02', '2026-08-03']) {
      await insertMeasurement(f, day);
    }
    await insertMeasurement(f, '2026-06-30');
    await insertLab(f, '2026-09-15', '6.9');
    const hidden = await getSummary(f);
    expect(hidden.showsVitals).toBe(false);
    expect(hidden.measurements).toEqual([]);
    expect(hidden.latestLabResults).toHaveLength(1);
    expect(hidden.profile).not.toHaveProperty('vitalsEnabled');
    const updated = await t.call(f.main, 'PATCH', `${profiles}/${f.profile.id}`, {
      vitalsEnabled: true,
    });
    expect(updated.status).toBe(200);
    const visible = await getSummary(f);
    expect(visible.showsVitals).toBe(true);
    expect(visible.measurements.map((item) => item.measuredOn)).toEqual([
      '2026-08-01',
      '2026-08-02',
      '2026-08-03',
    ]);
    expect(visible.latestLabResults).toEqual(hidden.latestLabResults);
  });

  it('TC-066: số đo trong chứng từ pending_review không xuất hiện trên bản tóm tắt', async () => {
    const f = await fixture();
    const owner = { familyId: f.familyId, profileId: f.profile.id, accountId: f.main.accountId };
    await seedPendingDocument(t, owner, { ...manualReading, measuredAt: '2026-08-15' });
    const summary = await getSummary(f);
    expect(summary.measurements).toEqual([]);
    expect(summary.latestLabResults).toEqual([]);
  });

  it('mặc định 3 tháng tới hôm nay; khoảng sai → 422; chưa đồng thuận → 409', async () => {
    const f = await fixture();
    const summary = await getSummary(f, '');
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
    expect(summary.to).toBe(today);
    expect(summary.from < summary.to).toBe(true);
    for (const query of [
      '?from=2026-09-30&to=2026-09-01',
      '?from=2025-01-01&to=2026-09-30',
      '?to=2099-01-01',
    ])
      expect((await t.call(f.main, 'GET', `${f.base}${query}`)).status).toBe(422);
    const pending = await fixture(false);
    expect((await t.call(pending.main, 'GET', `${pending.base}${range}`)).status).toBe(409);
  });

  it('SPEC-006: hồ sơ gia đình khác và hồ sơ không tồn tại cùng trả 404 như nhau', async () => {
    const victim = await fixture();
    await insertMeasurement(victim, '2026-08-01');
    const attacker = await fixture();
    await expectCrossFamilyDenied(
      () => t.call(attacker.main, 'GET', victim.base),
      () => t.call(attacker.main, 'GET', `${profiles}/${randomUUID()}/visit-summary`),
    );
  });
});
