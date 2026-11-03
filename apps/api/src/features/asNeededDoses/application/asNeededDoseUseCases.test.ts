import { describe, expect, it } from 'vitest';
import type { AsNeededCourse, AsNeededDose } from '../domain/AsNeededDose.js';
import { deleteAsNeededDose } from './deleteAsNeededDose.js';
import { listAsNeededDoses } from './listAsNeededDoses.js';
import type { AsNeededDoseRepository, DoseRange } from './ports.js';
import { recordAsNeededDose } from './recordAsNeededDose.js';
import { setCourseInterval } from './setCourseInterval.js';

// 2026-11-03 15:00 giờ Việt Nam.
const now = () => new Date('2026-11-03T08:00:00Z');
const course: AsNeededCourse = {
  id: 'course-1',
  prescriptionItemId: 'item-1',
  slots: ['as_needed'],
  startDate: '2026-11-01',
  endDate: '2026-11-03',
  minIntervalText: null,
  userIntervalText: null,
};

function fake(consentStatus: 'confirmed' | 'withdrawn' = 'confirmed', courses = [course]) {
  const doses: AsNeededDose[] = [];
  const ranges: DoseRange[] = [];
  const intervals: (string | null)[] = [];
  const repository: AsNeededDoseRepository = {
    withFamily: (familyId, work) =>
      work({
        findProfile: async (id) => (familyId === 'family-a' && id === 'me' ? { consentStatus } : null),
        findCourse: async (_profileId, id) => courses.find((c) => c.id === id) ?? null,
        insertDose: async ({ healthProfileId: _p, ...input }) => {
          const dose = { ...input, id: `dose-${doses.length + 1}`, recordedAt: now() };
          doses.push(dose);
          return dose;
        },
        deleteDose: async (_profileId, id) =>
          doses.splice(
            doses.findIndex((d) => d.id === id),
            1,
          ).length > 0,
        listDoses: async (_profileId, range) => (ranges.push(range), doses),
        setUserInterval: async (_profileId, _courseId, text) => void intervals.push(text),
      }),
  };
  return { repository, doses, ranges, intervals };
}
const target = { familyId: 'family-a', profileId: 'me' };
const record = { ...target, accountId: 'acc-main', courseId: 'course-1', quantity: 1, unit: 'gói' };

describe('Nhật ký liều "Khi cần" (SPEC-047)', () => {
  it('TC-495: ghi liều 14:00 lưu đúng dữ liệu người ghi nhập, không có trường giờ liều tiếp', async () => {
    const f = fake();
    const givenAt = new Date('2026-11-03T07:00:00Z');
    const result = await recordAsNeededDose(f.repository, { ...record, givenAt }, now);
    expect(result).toEqual({
      ok: true,
      value: {
        id: 'dose-1',
        courseId: 'course-1',
        givenAt,
        quantity: 1,
        unit: 'gói',
        recordedBy: 'acc-main',
        recordedAt: now(),
      },
    });
  });
  it('TC-497: đợt hết hiệu lực ngày givenAt theo giờ Việt Nam bị từ chối dù UTC còn hôm trước', async () => {
    const f = fake();
    // 2026-11-03T17:30Z = 00:30 ngày 04/11 giờ Việt Nam, sau end_date 03/11.
    const late = () => new Date('2026-11-03T18:00:00Z');
    const givenAt = new Date('2026-11-03T17:30:00Z');
    expect(await recordAsNeededDose(f.repository, { ...record, givenAt }, late)).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
    });
    expect(
      await recordAsNeededDose(f.repository, { ...record, courseId: 'other', givenAt: now() }, now),
    ).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
    });
    expect(f.doses).toEqual([]);
  });
  it('TC-498: givenAt ở tương lai bị từ chối', async () => {
    const f = fake();
    const givenAt = new Date(now().getTime() + 1000);
    expect(await recordAsNeededDose(f.repository, { ...record, givenAt }, now)).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
    });
    expect(f.doses).toEqual([]);
  });
  it('SPEC-047: hồ sơ khác gia đình ERR_NOT_FOUND, đã rút đồng thuận ERR_CONSENT_REQUIRED ở mọi lệnh', async () => {
    const f = fake('withdrawn');
    const calls = (t: typeof target) => [
      recordAsNeededDose(f.repository, { ...record, ...t, givenAt: now() }, now),
      deleteAsNeededDose(f.repository, { ...t, doseId: 'dose-1' }),
      listAsNeededDoses(f.repository, { ...t, from: '2026-11-01', to: '2026-11-03' }),
      setCourseInterval(f.repository, { ...t, courseId: 'course-1', text: 'cách 6 giờ' }),
    ];
    for (const result of await Promise.all(calls({ ...target, familyId: 'family-b' })))
      expect(result).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
    for (const result of await Promise.all(calls(target)))
      expect(result).toEqual({ ok: false, code: 'ERR_CONSENT_REQUIRED' });
    expect(f.intervals).toEqual([]);
  });
  it('SPEC-047: xóa liều không có trả ERR_NOT_FOUND', async () => {
    const f = fake();
    await recordAsNeededDose(f.repository, { ...record, givenAt: now() }, now);
    expect(await deleteAsNeededDose(f.repository, { ...target, doseId: 'dose-1' })).toEqual({
      ok: true,
      value: null,
    });
    expect(await deleteAsNeededDose(f.repository, { ...target, doseId: 'dose-1' })).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
  });
  it('SPEC-047: khoảng đọc đổi ngày Việt Nam thành [00:00 from, 00:00 sau to)', async () => {
    const f = fake();
    await listAsNeededDoses(f.repository, {
      ...target,
      courseId: 'course-1',
      from: '2026-11-01',
      to: '2026-11-03',
    });
    expect(f.ranges).toEqual([
      { courseId: 'course-1', from: new Date('2026-10-31T17:00:00Z'), to: new Date('2026-11-03T17:00:00Z') },
    ]);
  });
  it('TC-496: lưu khoảng cách người dùng nhập; đơn có khoảng cách thì vẫn ưu tiên đơn', async () => {
    const printed = { ...course, id: 'course-2', minIntervalText: 'cách 4–6 giờ' };
    const f = fake('confirmed', [course, printed]);
    expect(
      await setCourseInterval(f.repository, { ...target, courseId: 'course-1', text: 'cách 6 giờ' }),
    ).toEqual({
      ok: true,
      value: { courseId: 'course-1', interval: { text: 'cách 6 giờ', source: 'user' } },
    });
    expect(
      await setCourseInterval(f.repository, { ...target, courseId: 'course-2', text: 'cách 6 giờ' }),
    ).toEqual({
      ok: true,
      value: { courseId: 'course-2', interval: { text: 'cách 4–6 giờ', source: 'prescription' } },
    });
    expect(f.intervals).toEqual(['cách 6 giờ', 'cách 6 giờ']);
  });
  it('TC-498: khoảng cách trên đợt không phải "Khi cần" hoặc đợt tự khai bị từ chối', async () => {
    const daily = { ...course, id: 'daily', slots: ['morning'] };
    const selfReported = { ...course, id: 'self', prescriptionItemId: null };
    const f = fake('confirmed', [daily, selfReported]);
    for (const courseId of ['daily', 'self', 'missing'])
      expect(await setCourseInterval(f.repository, { ...target, courseId, text: 'cách 6 giờ' })).toEqual({
        ok: false,
        code: 'ERR_VALIDATION',
      });
    expect(f.intervals).toEqual([]);
  });
});
