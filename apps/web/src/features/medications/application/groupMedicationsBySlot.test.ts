import { describe, expect, it } from 'vitest';
import type { CurrentMedicationCourse } from '@angia/contracts';
import { groupMedicationsBySlot } from './groupMedicationsBySlot';
const course = (
  id: string,
  name: string,
  slots: CurrentMedicationCourse['slots'],
): CurrentMedicationCourse => ({
  id,
  healthProfileId: 'p',
  prescriptionItemId: null,
  source: 'self_reported',
  name,
  strength: null,
  quantityPerDose: 1,
  doseUnit: 'viên',
  slots,
  startDate: '2026-10-01',
  endDate: null,
  status: 'active',
  prescriptionIssuedDate: null,
});
describe('Nhóm danh mục thuốc theo buổi (Design §6, E4-S4-T1)', () => {
  it('TC-239: theo thứ tự Sáng/Trưa/Chiều/Tối, thuốc nhiều buổi có mặt ở từng buổi, bỏ buổi trống', () => {
    const groups = groupMedicationsBySlot([
      course('1', 'Metformin', ['evening', 'morning']),
      course('2', 'Amlodipin', ['morning']),
    ]);
    expect(groups.map((group) => group.label)).toEqual(['Sáng', 'Tối']);
    expect(groups[0]!.courses.map((item) => item.name)).toEqual(['Amlodipin', 'Metformin']);
    expect(groups[1]!.courses.map((item) => item.id)).toEqual(['1']);
  });
  it('TC-247: nhóm "Khi cần" nằm sau Tối', () => {
    const groups = groupMedicationsBySlot([
      course('1', 'Hydrocortison', ['as_needed']),
      course('2', 'Amlodipin', ['evening']),
    ]);
    expect(groups.map((group) => group.label)).toEqual(['Tối', 'Khi cần']);
    expect(groups[1]!.courses.map((item) => item.name)).toEqual(['Hydrocortison']);
  });
  it('TC-240: không có thuốc thì không có nhóm', () => {
    expect(groupMedicationsBySlot([])).toEqual([]);
  });
});
