import { createReusedCourses } from '../domain/createReusedCourses.js';
import type { MedicationConflict } from '../domain/MedicationConflict.js';
import type { MedicationCourse } from '../domain/MedicationCourse.js';
import { planMedicationConflicts } from '../domain/planMedicationConflicts.js';
import type { ReuseSelection } from '../domain/ReuseSelection.js';
import { validateReuseRequest } from '../domain/validateReuseRequest.js';
import type { MedicationClock, MedicationManagementRepository } from './managementPorts.js';
import { medicationToday } from './medicationToday.js';

interface ReusePrescriptionRequest {
  familyId: string;
  profileId: string;
  prescriptionId: string;
  startDate: string;
  items: readonly ReuseSelection[];
}
type ReusePrescriptionOutcome =
  | { ok: true; value: MedicationCourse[] }
  | { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_CONSENT_REQUIRED' | 'ERR_VALIDATION' }
  | { ok: false; code: 'ERR_DOSE_INFO_MISSING'; invalidItemIndexes: number[] }
  | { ok: false; code: 'ERR_COURSE_CONFLICT_UNRESOLVED'; conflicts: MedicationConflict[] };

// SPEC-029: kiểm hồ sơ/đơn/lệnh → khóa hồ sơ → xung đột SPEC-015 → thay thế + ghi đợt mới
// trong cùng transaction của withFamily; lỗi ném ra để rollback toàn bộ.
export function reusePrescription(
  repository: MedicationManagementRepository,
  request: ReusePrescriptionRequest,
  now: MedicationClock,
): Promise<ReusePrescriptionOutcome> {
  return repository.withFamily(request.familyId, async (store) => {
    const profile = await store.findProfile(request.profileId);
    if (!profile) return { ok: false, code: 'ERR_NOT_FOUND' };
    if (profile.consentStatus !== 'confirmed') return { ok: false, code: 'ERR_CONSENT_REQUIRED' };
    const prescription = await store.findPrescription(request.profileId, request.prescriptionId);
    if (!prescription) return { ok: false, code: 'ERR_NOT_FOUND' };
    const checked = validateReuseRequest(
      prescription,
      request.startDate,
      request.items,
      medicationToday(now),
    );
    if (!checked.ok) return checked;
    const courses = createReusedCourses(prescription, request.items, request.startDate);
    await store.lockMedicationProfile(request.profileId);
    const plan = planMedicationConflicts(
      await store.findMedicationCourses(request.profileId),
      courses.map((course, index) => ({ ...request.items[index]!, name: course.name })),
      request.startDate,
    );
    if (!plan.ok) return { ok: false, code: 'ERR_COURSE_CONFLICT_UNRESOLVED', conflicts: plan.conflicts };
    await store.replaceMedicationCourses(request.profileId, plan.replaceCourseIds, plan.replacementEndDate);
    return { ok: true, value: await store.insertMedicationCourses(courses) };
  });
}
