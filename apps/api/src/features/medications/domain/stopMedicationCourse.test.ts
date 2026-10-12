import { describe, expect, it } from 'vitest';
import { stopMedicationCourse } from './stopMedicationCourse.js';
import { getActiveMedications } from './getActiveMedications.js';
import type { MedicationCourse } from './MedicationCourse.js';
const course: MedicationCourse = {
  id: 'c',
  healthProfileId: 'p',
  prescriptionItemId: null,
  source: 'self_reported',
  name: 'Canxi',
  nameNormalized: 'canxi',
  quantityPerDose: 0.5,
  doseUnit: 'viên',
  slots: ['morning'],
  startDate: '2026-10-01',
  endDate: null,
  status: 'active',
};
describe('Dừng đợt thuốc (SPEC-017)', () => {
  it('TC-051: dừng từ 15/10 giữ lịch sử đến 14/10, không sửa đầu vào', () => {
    const before = structuredClone(course);
    const result = stopMedicationCourse(course, '2026-10-15', '2026-10-15');
    expect(result).toEqual({ ok: true, value: { ...before, status: 'stopped', endDate: '2026-10-14' } });
    expect(course).toEqual(before);
    if (!result.ok) throw new Error('Không dừng được');
    expect(getActiveMedications([result.value], '2026-10-14')).toHaveLength(1);
    expect(getActiveMedications([result.value], '2026-10-15')).toEqual([]);
  });
  it.each(['ended', 'stopped', 'replaced'] as const)('TC-052: trạng thái %s bị từ chối', (status) => {
    expect(
      stopMedicationCourse({ ...course, status, endDate: '2026-10-10' }, '2026-10-05', '2026-10-15'),
    ).toEqual({ ok: false, code: 'ERR_INVALID_STATE_TRANSITION' });
  });
  it.each([
    ['2026-10-01', '2026-09-30'],
    ['2026-03-01', '2026-02-28'],
    ['2024-03-01', '2024-02-29'],
    ['2026-01-01', '2025-12-31'],
  ])('TC-051: dừng ngay ngày bắt đầu %s tạo khoảng rỗng', (startDate, endDate) => {
    expect(stopMedicationCourse({ ...course, startDate }, startDate, '2026-10-15')).toMatchObject({
      ok: true,
      value: { status: 'stopped', endDate },
    });
  });
  it.each(['2026-09-30', '2026-10-16', '2026-02-30', '15/10/2026', '2026-10-15T00:00:00Z', ''])(
    'TC-051: ngày dừng sai hoặc ngoài khoảng bị từ chối: %s',
    (stopDate) => {
      expect(stopMedicationCourse(course, stopDate, '2026-10-15')).toEqual({
        ok: false,
        code: 'ERR_VALIDATION',
      });
    },
  );
  it('TC-051: không kéo dài đợt hữu hạn; cho dừng ở biên cuối và ghi hồi tố', () => {
    const finite = { ...course, endDate: '2026-10-10' };
    expect(stopMedicationCourse(finite, '2026-10-11', '2026-10-15')).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
    });
    expect(stopMedicationCourse(finite, '2026-10-10', '2026-10-15')).toMatchObject({
      ok: true,
      value: { endDate: '2026-10-09' },
    });
  });
});
