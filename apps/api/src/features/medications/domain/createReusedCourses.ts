import { normalizeName } from '@src/features/prescriptions/domain/normalizeName.js';
import type { Prescription } from '@src/features/prescriptions/domain/Prescription.js';
import { calculateEndDate } from './calculateEndDate.js';
import type { NewMedicationCourse } from './MedicationCourse.js';
import type { ReuseSelection } from './ReuseSelection.js';

// SPEC-029: mỗi dòng chọn sinh một đợt mới gắn dòng gốc; dòng đã được validateReuseRequest kiểm.
export function createReusedCourses(
  prescription: Prescription,
  selections: readonly ReuseSelection[],
  startDate: string,
): NewMedicationCourse[] {
  return selections.map((selection) => {
    const item = prescription.items.find((candidate) => candidate.id === selection.prescriptionItemId);
    if (!item) throw new Error('Dòng thuốc không thuộc đơn đã kiểm');
    return {
      healthProfileId: prescription.healthProfileId,
      prescriptionItemId: item.id,
      source: 'prescription',
      name: item.name,
      nameNormalized: normalizeName(item.name),
      quantityPerDose: item.quantityPerDose,
      doseUnit: item.doseUnit,
      slots: [...item.slots],
      startDate,
      endDate: calculateEndDate(startDate, selection.longTerm ? null : selection.durationDays),
      status: 'active',
    };
  });
}
