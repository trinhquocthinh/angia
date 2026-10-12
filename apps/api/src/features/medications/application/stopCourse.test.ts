import { describe, expect, it } from 'vitest';
import { stopCourse } from './stopCourse.js';
import { listStoppableCourses } from './listStoppableCourses.js';
import type { MedicationManagementRepository } from './managementPorts.js';
import type { MedicationCourse } from '../domain/MedicationCourse.js';
type MedicationManagementStore = Parameters<Parameters<MedicationManagementRepository['withFamily']>[1]>[0];
const course: MedicationCourse = {
  id: 'c',
  healthProfileId: 'p',
  prescriptionItemId: null,
  source: 'self_reported',
  name: 'Canxi',
  nameNormalized: 'canxi',
  quantityPerDose: 1,
  doseUnit: 'viên',
  slots: ['morning'],
  startDate: '2026-10-01',
  endDate: null,
  status: 'active',
};
const request = { familyId: 'f', profileId: 'p', courseId: 'c', stopDate: '2026-10-12' };
const now = () => new Date('2026-10-11T17:00:00Z');
function fixture(
  options: { consent?: string; missing?: boolean; status?: 'ended'; changedOnLock?: boolean } = {},
) {
  let saved = { ...course };
  let locked = false;
  const store: MedicationManagementStore = {
    findProfile: async () => (options.missing ? null : { consentStatus: options.consent ?? 'confirmed' }),
    lockMedicationProfile: async () => {
      locked = true;
      if (options.changedOnLock) saved = { ...saved, status: 'replaced', endDate: '2026-10-10' };
    },
    findMedicationCourse: async () => {
      if (!locked) throw new Error('Phải lấy khóa trước khi đọc');
      return options.status ? { ...saved, status: options.status, endDate: '2026-10-10' } : saved;
    },
    stopMedicationCourse: async (_p, _c, endDate) => {
      saved = { ...saved, status: 'stopped', endDate };
      return saved;
    },
    findMedicationCourses: async () => [saved, { ...course, id: 'future', startDate: '2026-10-13' }],
    findMedicationHistory: async () => [],
    replaceMedicationCourses: async () => undefined,
    insertMedicationCourses: async () => [],
  };
  const repository: MedicationManagementRepository = {
    withFamily: async (familyId, work) => {
      if (familyId !== 'f') return work({ ...store, findProfile: async () => null });
      return work(store);
    },
  };
  return { repository, saved: () => saved };
}
describe('Ghi nhận dừng qua transaction (SPEC-017)', () => {
  it('TC-051: ngày Việt Nam ở biên UTC, khóa trước khi đọc và lưu', async () => {
    const f = fixture();
    expect(await stopCourse(f.repository, request, now)).toMatchObject({
      ok: true,
      value: { status: 'stopped', endDate: '2026-10-11' },
    });
    expect(f.saved().status).toBe('stopped');
    const yesterday = fixture();
    expect(await stopCourse(yesterday.repository, request, () => new Date('2026-10-11T16:59:59Z'))).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
    });
    expect(yesterday.saved().status).toBe('active');
  });
  it.each([{ missing: true }, { consent: 'pending' }, { status: 'ended' as const }, { changedOnLock: true }])(
    'TC-052: không ghi khi không được phép: %j',
    async (options) => {
      const f = fixture(options);
      const result = await stopCourse(f.repository, request, now);
      expect(result).toEqual({
        ok: false,
        code: options.missing
          ? 'ERR_NOT_FOUND'
          : options.consent
            ? 'ERR_CONSENT_REQUIRED'
            : 'ERR_INVALID_STATE_TRANSITION',
      });
      expect(f.saved().status).not.toBe('stopped');
    },
  );
  it('TC-051: khác gia đình không lộ đợt; danh sách loại đợt chưa bắt đầu', async () => {
    const f = fixture();
    expect(await stopCourse(f.repository, { ...request, familyId: 'other' }, now)).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
    expect(await listStoppableCourses(f.repository, 'f', 'p', now)).toMatchObject({
      ok: true,
      value: { today: '2026-10-12', courses: [{ id: 'c' }] },
    });
    expect(await listStoppableCourses(f.repository, 'other', 'p', now)).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
  });
});
