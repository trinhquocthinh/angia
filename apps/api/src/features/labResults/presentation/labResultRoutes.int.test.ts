import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile, LabSeries } from '@angia/contracts';
import { acceptConsentInvitation } from '@src/shared/test/acceptConsentInvitation.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

type Seed = { testName: string; resultDate: string; referenceRange?: string | null; createdAt?: string };

describe('API chuỗi xét nghiệm SPEC-021 (E5-S2-T1)', () => {
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
      await t.call(main, 'POST', '/api/health-profiles', { birthYear: 1950, displayName: 'Mẹ' })
    ).json()) as HealthProfile;
    await acceptConsentInvitation(t, main, profile.id);
    return { familyId, main, profile, base: `/api/health-profiles/${profile.id}/lab-result-series` };
  };
  const insertResult = async (familyId: string, profileId: string, seed: Seed) => {
    const id = randomUUID();
    await t.owner.query(
      `INSERT INTO lab_results (id, family_id, health_profile_id, result_date, test_name, test_name_normalized,
         value, unit, reference_range, manual_without_source, created_at)
       VALUES ($1, $2, $3, $4, $5, lower($5), '7.1', '%', $6, true, COALESCE($7::timestamptz, now()))`,
      [
        id,
        familyId,
        profileId,
        seed.resultDate,
        seed.testName,
        seed.referenceRange ?? null,
        seed.createdAt ?? null,
      ],
    );
    return id;
  };
  const getSeries = async (f: Awaited<ReturnType<typeof fixture>>, query = '') => {
    const response = await t.call(f.main, 'GET', `${f.base}${query}`);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    return (await response.json()) as LabSeries[];
  };

  it('TC-060 + TC-061 + TC-257 — gom "HbA1c"/"hba1c", cũ nhất trước, khoảng tham chiếu không in → null', async () => {
    const f = await fixture();
    await insertResult(f.familyId, f.profile.id, { testName: 'hba1c', resultDate: '2026-06-12' });
    await insertResult(f.familyId, f.profile.id, { testName: 'HbA1c', resultDate: '2026-01-05' });
    await insertResult(f.familyId, f.profile.id, {
      testName: 'HbA1c',
      resultDate: '2026-09-30',
      referenceRange: '4.0 - 6.0',
    });
    await insertResult(f.familyId, f.profile.id, { testName: 'Creatinin', resultDate: '2026-10-01' });
    const series = await getSeries(f);
    expect(series.map((group) => group.testName)).toEqual(['Creatinin', 'HbA1c']);
    expect(series[1]!.results.map((r) => r.resultDate)).toEqual(['2026-01-05', '2026-06-12', '2026-09-30']);
    expect(series[1]!.results.map((r) => r.referenceRange)).toEqual([null, null, '4.0 - 6.0']);
    expect(series[0]!.results[0]).toMatchObject({ value: '7.1', unit: '%', sourceDocumentId: null });
  });

  it('TC-258 — lọc testName theo tên chuẩn hóa; tên rỗng/quá dài → 422; chưa có kết quả → []', async () => {
    const f = await fixture();
    expect(await getSeries(f)).toEqual([]);
    await insertResult(f.familyId, f.profile.id, { testName: 'HbA1c', resultDate: '2026-06-12' });
    await insertResult(f.familyId, f.profile.id, { testName: 'Ure', resultDate: '2026-06-12' });
    const filtered = await getSeries(f, '?testName=%20HBA1C%20');
    expect(filtered.map((group) => group.testName)).toEqual(['HbA1c']);
    expect((await t.call(f.main, 'GET', `${f.base}?testName=%20`)).status).toBe(422);
    expect((await t.call(f.main, 'GET', `${f.base}?testName=${'a'.repeat(201)}`)).status).toBe(422);
  });

  it('TC-259 — SPEC-006: hồ sơ gia đình khác và hồ sơ không tồn tại cùng trả 404 như nhau', async () => {
    const victim = await fixture();
    await insertResult(victim.familyId, victim.profile.id, { testName: 'HbA1c', resultDate: '2026-06-12' });
    const attacker = await fixture();
    await expectCrossFamilyDenied(
      () => t.call(attacker.main, 'GET', victim.base),
      () => t.call(attacker.main, 'GET', `/api/health-profiles/${randomUUID()}/lab-result-series`),
    );
  });
});
