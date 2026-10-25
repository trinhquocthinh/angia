import { stopMedicationCourse } from '../domain/stopMedicationCourse.js';
import { medicationToday } from './medicationToday.js';
import type {
  MedicationManagementRepository,
  StopCourseRequest,
  StopCourseOutcome,
  MedicationClock,
} from './managementPorts.js';
export function stopCourse(
  repository: MedicationManagementRepository,
  request: StopCourseRequest,
  now: MedicationClock,
): Promise<StopCourseOutcome> {
  return repository.withFamily(request.familyId, async (store) => {
    const profile = await store.findProfile(request.profileId);
    if (!profile) return { ok: false, code: 'ERR_NOT_FOUND' };
    if (profile.consentStatus !== 'confirmed') return { ok: false, code: 'ERR_CONSENT_REQUIRED' };
    await store.lockMedicationProfile(request.profileId);
    const course = await store.findMedicationCourse(request.profileId, request.courseId);
    if (!course) return { ok: false, code: 'ERR_NOT_FOUND' };
    const result = stopMedicationCourse(course, request.stopDate, medicationToday(now));
    if (!result.ok) return result;
    const saved = await store.stopMedicationCourse(
      request.profileId,
      request.courseId,
      result.value.endDate!,
    );
    if (!saved) return { ok: false, code: 'ERR_INVALID_STATE_TRANSITION' };
    return { ok: true, value: saved };
  });
}
