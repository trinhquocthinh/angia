import type { MedicationCourse } from '../domain/MedicationCourse.js';
import type { MedicationManagementRepository, MedicationClock } from './managementPorts.js';
import { medicationToday } from './medicationToday.js';
type Outcome =
  | { ok: true; value: { today: string; courses: MedicationCourse[] } }
  | { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_CONSENT_REQUIRED' };
// Danh sách chọn đợt để dừng; không phải danh mục lịch sử theo ngày D (E4-S4-T1).
export function listStoppableCourses(
  repository: MedicationManagementRepository,
  familyId: string,
  profileId: string,
  now: MedicationClock,
): Promise<Outcome> {
  return repository.withFamily(familyId, async (store) => {
    const profile = await store.findProfile(profileId);
    if (!profile) return { ok: false, code: 'ERR_NOT_FOUND' };
    if (profile.consentStatus !== 'confirmed') return { ok: false, code: 'ERR_CONSENT_REQUIRED' };
    const today = medicationToday(now);
    const courses = (await store.findMedicationCourses(profileId)).filter(
      (course) => course.status === 'active' && course.startDate <= today,
    );
    return { ok: true, value: { today, courses } };
  });
}
