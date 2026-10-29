import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile, VisitSummary } from '@angia/contracts';
import { acceptConsentInvitation } from '@src/shared/test/acceptConsentInvitation.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import { manualReading } from '@src/shared/test/healthDataFixtures.js';
import { seedPendingDocument } from '@src/shared/test/seedPendingDocument.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

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
    if (consent) await acceptConsentInvitation(t, main, profile.id);
    return { familyId, main, profile, base: `${profiles}/${profile.id}/visit-summary` };
  };
  type Fixture = Awaited<ReturnType<typeof fixture>>;
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
