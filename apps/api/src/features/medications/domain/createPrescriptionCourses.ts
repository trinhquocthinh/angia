import { normalizeName } from '@src/features/prescriptions/domain/normalizeName.js';
import type { Prescription } from '@src/features/prescriptions/domain/Prescription.js';
import { calculateEndDate } from './calculateEndDate.js';
import type { NewMedicationCourse } from './MedicationCourse.js';

// SPEC-014: đơn đã kiểm BR-025 và đã cấp id cho từng dòng; không tự suy liều hay số ngày.
export function createPrescriptionCourses(prescription: Prescription): NewMedicationCourse[] {
  return prescription.items.map((item) => ({
    healthProfileId: prescription.healthProfileId,
    prescriptionItemId: item.id,
    source: 'prescription',
    name: item.name,
    nameNormalized: normalizeName(item.name),
    quantityPerDose: item.quantityPerDose,
    doseUnit: item.doseUnit,
    slots: [...item.slots],
    startDate: prescription.issuedDate,
    endDate: calculateEndDate(prescription.issuedDate, item.longTerm ? null : item.durationDays),
    status: 'active',
  }));
}
