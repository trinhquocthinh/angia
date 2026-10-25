import { describe, expect, it } from 'vitest';
import { listCurrentMedications } from './listCurrentMedications.js';
import type { CurrentMedicationCourse, MedicationManagementRepository } from './managementPorts.js';
type MedicationManagementStore = Parameters<Parameters<MedicationManagementRepository['withFamily']>[1]>[0];
const base: CurrentMedicationCourse = {
  id: 'long',
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
  prescriptionIssuedDate: null,
};
const history: CurrentMedicationCourse[] = [
  base,
  {
    ...base,
    id: 'last-day',
    source: 'prescription',
    endDate: '2026-10-12',
    prescriptionIssuedDate: '2026-10-01',
  },
  { ...base, id: 'overdue', endDate: '2026-10-11' },
  { ...base, id: 'stopped', status: 'stopped', endDate: '2026-10-11' },
  { ...base, id: 'replaced-later', status: 'replaced', endDate: '2026-10-20' },
  { ...base, id: 'future', startDate: '2026-10-13' },
];
// 17:00 UTC ngày 11/10 = 00:00 ngày 12/10 giờ Việt Nam.
const now = () => new Date('2026-10-11T17:00:00Z');
function repository(options: { consent?: string; missing?: boolean } = {}) {
  const store = {
    findProfile: async () => (options.missing ? null : { consentStatus: options.consent ?? 'confirmed' }),
    findMedicationHistory: async () => history,
  } as unknown as MedicationManagementStore;
  const repo: MedicationManagementRepository = {
    withFamily: async (familyId, work) =>
      work(
        familyId === 'f' ? store : ({ ...store, findProfile: async () => null } as MedicationManagementStore),
      ),
  };
  return repo;
}
describe('Danh mục thuốc đang dùng hôm nay (SPEC-018, E4-S4-T1)', () => {
  it('TC-238: lọc theo khoảng hiệu lực tại hôm nay giờ Việt Nam, không theo trạng thái hiện tại', async () => {
    const result = await listCurrentMedications(repository(), 'f', 'p', now);
    expect(result).toMatchObject({ ok: true, value: { today: '2026-10-12' } });
    if (!result.ok) throw new Error('phải thành công');
    expect(result.value.courses.map((course) => course.id)).toEqual(['long', 'last-day', 'replaced-later']);
    expect(result.value.courses[1]).toMatchObject({ prescriptionIssuedDate: '2026-10-01' });
  });
  it('TC-238: hồ sơ không tồn tại/khác gia đình trả ERR_NOT_FOUND, chưa đồng thuận trả ERR_CONSENT_REQUIRED', async () => {
    expect(await listCurrentMedications(repository({ missing: true }), 'f', 'p', now)).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
    expect(await listCurrentMedications(repository(), 'other', 'p', now)).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
    expect(await listCurrentMedications(repository({ consent: 'pending' }), 'f', 'p', now)).toEqual({
      ok: false,
      code: 'ERR_CONSENT_REQUIRED',
    });
  });
});
