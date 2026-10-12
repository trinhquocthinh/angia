import { errorJson } from '@src/shared/http/errorResponse.js';
import type { MedicationConflict } from '../domain/MedicationConflict.js';

// Chỉ xuất trường cần đối soát; không trả toàn bộ row DB hoặc phạm vi gia đình.
export function toCourseConflictErrorJson(conflicts: readonly MedicationConflict[]) {
  return errorJson('ERR_COURSE_CONFLICT_UNRESOLVED', {
    conflicts: conflicts.map((conflict) => ({
      itemIndexes: conflict.itemIndexes,
      nameNormalized: conflict.nameNormalized,
      courses: conflict.courses.map((c) => ({
        id: c.id,
        name: c.name,
        strength: c.strength ?? null,
        quantityPerDose: c.quantityPerDose,
        doseUnit: c.doseUnit,
        slots: c.slots,
        startDate: c.startDate,
        endDate: c.endDate,
      })),
    })),
  });
}
