import { describe, expect, it } from 'vitest';
import { reusablePrescription } from '@src/shared/test/reusablePrescription.js';
import type { MedicationCourse, NewMedicationCourse } from '../domain/MedicationCourse.js';
import type { MedicationManagementRepository } from './managementPorts.js';
import { reusePrescription } from './reusePrescription.js';

type Store = Parameters<Parameters<MedicationManagementRepository['withFamily']>[1]>[0];
const original: MedicationCourse = {
  id: 'old',
  healthProfileId: 'profile-1',
  prescriptionItemId: 'item-1',
  source: 'prescription',
  name: 'Amlodipin',
  nameNormalized: 'amlodipin',
  quantityPerDose: 1,
  doseUnit: 'viên',
  slots: ['morning'],
  startDate: '2026-10-01',
  endDate: '2026-10-30',
  status: 'active',
};
const now = () => new Date('2026-10-12T17:30:00Z'); // 13/10 giờ Việt Nam
const request = {
  familyId: 'f',
  profileId: 'profile-1',
  prescriptionId: 'p-1',
  startDate: '2026-10-13',
  items: [{ prescriptionItemId: 'item-1', durationDays: 30, longTerm: false }],
};

function fixture(options: { consent?: string; prescription?: boolean; failInsert?: boolean } = {}) {
  const log: string[] = [];
  let inserted: readonly NewMedicationCourse[] = [];
  const store: Store = {
    findProfile: async () => ({ consentStatus: options.consent ?? 'confirmed' }),
    findPrescription: async (profileId, id) =>
      options.prescription === false || profileId !== 'profile-1' || id !== 'p-1'
        ? null
        : reusablePrescription('2026-10-01'),
    lockMedicationProfile: async () => void log.push('lock'),
    findMedicationCourses: async () => {
      log.push('read');
      return [original];
    },
    replaceMedicationCourses: async (_p, ids, endDate) => void log.push(`replace:${ids.join()}:${endDate}`),
    insertMedicationCourses: async (inputs) => {
      if (options.failInsert) throw new Error('Lỗi ghi');
      inserted = inputs;
      log.push('insert');
      return inputs.map((input, index) => ({ ...input, id: `new-${index}` }));
    },
    findMedicationHistory: async () => [],
    findMedicationCourse: async () => null,
    stopMedicationCourse: async () => null,
  };
  const repository: MedicationManagementRepository = {
    withFamily: (familyId, work) =>
      work(familyId === 'f' ? store : { ...store, findProfile: async () => null }),
  };
  return { repository, log, inserted: () => inserted };
}

describe('reusePrescription — Dùng lại đơn (SPEC-029)', () => {
  it('TC-279: trùng đợt đang dùng chưa chọn hướng → 409, không ghi', async () => {
    const f = fixture();
    const result = await reusePrescription(f.repository, request, now);
    expect(result).toMatchObject({
      ok: false,
      code: 'ERR_COURSE_CONFLICT_UNRESOLVED',
      conflicts: [{ itemIndexes: [0], nameNormalized: 'amlodipin', courses: [{ id: 'old' }] }],
    });
    expect(f.log).toEqual(['lock', 'read']);
  });

  it('TC-279: Thay thế đóng đợt cũ trước ngày bắt đầu mới rồi ghi đợt mới gắn dòng gốc', async () => {
    const f = fixture();
    const items = [
      { ...request.items[0]!, resolution: 'replace' as const, expectedConflictCourseIds: ['old'] },
    ];
    const result = await reusePrescription(f.repository, { ...request, items }, now);
    expect(result).toMatchObject({ ok: true, value: [{ id: 'new-0', prescriptionItemId: 'item-1' }] });
    expect(f.log).toEqual(['lock', 'read', 'replace:old:2026-10-12', 'insert']);
    expect(f.inserted()).toMatchObject([
      { startDate: '2026-10-13', endDate: '2026-11-11', status: 'active' },
    ]);
  });

  it('TC-280: lỗi ghi đợt mới sau khi thay thế được ném ra để transaction rollback', async () => {
    const f = fixture({ failInsert: true });
    const items = [
      { ...request.items[0]!, resolution: 'replace' as const, expectedConflictCourseIds: ['old'] },
    ];
    await expect(reusePrescription(f.repository, { ...request, items }, now)).rejects.toThrow('Lỗi ghi');
  });

  it('TC-281: gia đình khác, đơn không thuộc hồ sơ, chưa đồng thuận', async () => {
    expect(await reusePrescription(fixture().repository, { ...request, familyId: 'x' }, now)).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
    expect(await reusePrescription(fixture({ prescription: false }).repository, request, now)).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
    expect(await reusePrescription(fixture({ consent: 'pending' }).repository, request, now)).toEqual({
      ok: false,
      code: 'ERR_CONSENT_REQUIRED',
    });
  });

  it('TC-277: kiểm ngày và số ngày trước khi khóa hay ghi', async () => {
    const f = fixture();
    expect(await reusePrescription(f.repository, { ...request, startDate: '2026-10-01' }, now)).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
    });
    const missing = [{ prescriptionItemId: 'item-1', durationDays: null, longTerm: false }];
    expect(await reusePrescription(f.repository, { ...request, items: missing }, now)).toEqual({
      ok: false,
      code: 'ERR_DOSE_INFO_MISSING',
      invalidItemIndexes: [0],
    });
    expect(f.log).toEqual([]);
  });
});
