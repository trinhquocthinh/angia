import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile, ManualRecordsResponse, MedicationCourse } from '@angia/contracts';
import { acceptConsentInvitation } from '@src/shared/test/acceptConsentInvitation.js';
import { vietnamDate } from '@src/shared/test/createFiniteCourse.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

const item = (name: string, durationDays: number) => ({
  name,
  strength: '5mg',
  quantityPerDose: 1,
  doseUnit: 'viên',
  slots: ['morning'],
  durationDays,
  longTerm: false,
  note: null,
  totalQuantity: null,
});

describe('API Dùng lại đơn thuốc + RLS (SPEC-029)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  async function fixture(issuedDate: string, consent = true) {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const create = async (name: string) =>
      (await (
        await t.call(main, 'POST', '/api/health-profiles', { birthYear: 1950, displayName: name })
      ).json()) as HealthProfile;
    const profile = await create('Bà ngoại');
    await acceptConsentInvitation(t, main, profile.id);
    const saved = (await (
      await t.call(main, 'POST', `/api/health-profiles/${profile.id}/manual-records`, {
        type: 'prescription',
        data: {
          type: 'prescription',
          issuedDate,
          facility: null,
          diagnosis: null,
          items: [item('Amlodipin', 30)],
        },
      })
    ).json()) as ManualRecordsResponse;
    const prescription = saved.prescription!;
    if (!consent)
      await t.owner.query("UPDATE health_profiles SET consent_status='pending' WHERE id=$1", [profile.id]);
    const reuse = (body: object, profileId = profile.id, prescriptionId = prescription.id, user = main) =>
      t.call(user, 'POST', `/api/health-profiles/${profileId}/prescriptions/${prescriptionId}/reuse`, body);
    const rows = async () =>
      (
        await t.owner.query(
          `SELECT prescription_item_id, status, start_date::text, end_date::text FROM medication_courses
          WHERE health_profile_id=$1 ORDER BY start_date`,
          [profile.id],
        )
      ).rows;
    return { familyId, main, profile, prescription, itemId: prescription.items[0]!.id, reuse, rows, create };
  }

  it('TC-278: đơn cũ đã hết hạn → 201 đợt mới gắn cùng dòng đơn, đợt gốc giữ nguyên, có trong danh mục hiện tại', async () => {
    const f = await fixture(vietnamDate(-40));
    const response = await f.reuse({
      startDate: vietnamDate(0),
      items: [{ prescriptionItemId: f.itemId, durationDays: 30, longTerm: false }],
    });
    expect(response.status).toBe(201);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const { courses } = (await response.json()) as { courses: MedicationCourse[] };
    expect(courses).toEqual([
      expect.objectContaining({
        prescriptionItemId: f.itemId,
        source: 'prescription',
        strength: null,
        startDate: vietnamDate(0),
        endDate: vietnamDate(29),
        status: 'active',
      }),
    ]);
    expect(await f.rows()).toEqual([
      {
        prescription_item_id: f.itemId,
        status: 'active',
        start_date: vietnamDate(-40),
        end_date: vietnamDate(-11),
      },
      {
        prescription_item_id: f.itemId,
        status: 'active',
        start_date: vietnamDate(0),
        end_date: vietnamDate(29),
      },
    ]);
    const current = (await (
      await t.call(f.main, 'GET', `/api/health-profiles/${f.profile.id}/medication-courses/current`)
    ).json()) as { courses: MedicationCourse[] };
    expect(current.courses.map((c) => c.id)).toEqual([courses[0]!.id]);
  });

  it('TC-279: đợt gốc còn hiệu lực → 409; Thay thế đóng đợt gốc; Song song giữ đợt gốc', async () => {
    const f = await fixture(vietnamDate(-5));
    const before = await f.rows();
    const base = { prescriptionItemId: f.itemId, durationDays: 10, longTerm: false };
    const conflict = await f.reuse({ startDate: vietnamDate(0), items: [base] });
    expect(conflict.status).toBe(409);
    const body = (await conflict.json()) as {
      error: { code: string; details: { conflicts: { itemIndexes: number[]; courses: { id: string }[] }[] } };
    };
    expect(body.error.code).toBe('ERR_COURSE_CONFLICT_UNRESOLVED');
    expect(body.error.details.conflicts[0]!.itemIndexes).toEqual([0]);
    expect(await f.rows()).toEqual(before);
    const ids = body.error.details.conflicts[0]!.courses.map((c) => c.id);
    const replaced = await f.reuse({
      startDate: vietnamDate(0),
      items: [{ ...base, resolution: 'replace', expectedConflictCourseIds: ids }],
    });
    expect(replaced.status).toBe(201);
    expect(await f.rows()).toEqual([
      expect.objectContaining({ status: 'replaced', end_date: vietnamDate(-1) }),
      expect.objectContaining({ status: 'active', start_date: vietnamDate(0), end_date: vietnamDate(9) }),
    ]);
    const parallelIds = (await f.rows()).length;
    const again = await f.reuse({ startDate: vietnamDate(1), items: [base] });
    const latest = ((await again.json()) as typeof body).error.details.conflicts[0]!.courses.map((c) => c.id);
    const parallel = await f.reuse({
      startDate: vietnamDate(1),
      items: [{ ...base, resolution: 'parallel', expectedConflictCourseIds: latest }],
    });
    expect(parallel.status).toBe(201);
    expect(await f.rows()).toHaveLength(parallelIds + 1);
  });

  it('TC-277: ngày ngoài khoảng → 422 ERR_VALIDATION; thiếu số ngày → ERR_DOSE_INFO_MISSING chỉ rõ dòng', async () => {
    const f = await fixture(vietnamDate(-40));
    const items = [{ prescriptionItemId: f.itemId, durationDays: 30, longTerm: false }];
    for (const startDate of [vietnamDate(-40), vietnamDate(31)]) {
      const response = await f.reuse({ startDate, items });
      expect(response.status).toBe(422);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
    }
    const stranger = await f.reuse({
      startDate: vietnamDate(0),
      items: [{ ...items[0]!, prescriptionItemId: randomUUID() }],
    });
    expect(stranger.status).toBe(422);
    const missing = await f.reuse({
      startDate: vietnamDate(0),
      items: [{ ...items[0]!, durationDays: null }],
    });
    expect(missing.status).toBe(422);
    expect(await missing.json()).toMatchObject({
      error: { code: 'ERR_DOSE_INFO_MISSING', details: { invalidItemIndexes: [0] } },
    });
    expect(await f.rows()).toHaveLength(1);
  });

  it('TC-281: gia đình khác như không tồn tại; hồ sơ khác cùng gia đình 404; chưa đồng thuận 409; member và thiếu CSRF 403', async () => {
    const f = await fixture(vietnamDate(-40));
    const body = {
      startDate: vietnamDate(0),
      items: [{ prescriptionItemId: f.itemId, durationDays: 7, longTerm: false }],
    };
    const attacker = await t.session(await t.family());
    await expectCrossFamilyDenied(
      () => f.reuse(body, f.profile.id, f.prescription.id, attacker),
      () => f.reuse(body, randomUUID(), randomUUID(), attacker),
    );
    const sibling = await f.create('Ông ngoại');
    await acceptConsentInvitation(t, f.main, sibling.id);
    expect((await f.reuse(body, sibling.id)).status).toBe(404);
    const member = await t.session(f.familyId, 'member', 'Thành viên');
    expect((await f.reuse(body, f.profile.id, f.prescription.id, member)).status).toBe(403);
    const noCsrf = await t.app.request(
      `/api/health-profiles/${f.profile.id}/prescriptions/${f.prescription.id}/reuse`,
      {
        method: 'POST',
        headers: { cookie: f.main.cookie, 'content-type': 'application/json' },
        body: JSON.stringify(body),
      },
    );
    expect(noCsrf.status).toBe(403);
    const pending = await fixture(vietnamDate(-40), false);
    const blocked = await pending.reuse({
      ...body,
      items: [{ ...body.items[0]!, prescriptionItemId: pending.itemId }],
    });
    expect(blocked.status).toBe(409);
    expect(await blocked.json()).toMatchObject({ error: { code: 'ERR_CONSENT_REQUIRED' } });
    expect(await f.rows()).toHaveLength(1);
  });
});
