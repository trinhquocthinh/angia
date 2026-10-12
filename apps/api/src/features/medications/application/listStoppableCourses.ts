import type { MedicationCourse } from '../domain/MedicationCourse.js';
import { isStoppableCourse } from '../domain/stopMedicationCourse.js';
import type { MedicationManagementRepository, MedicationClock } from './managementPorts.js';
import { medicationToday } from './medicationToday.js';
type Outcome =
  | { ok: true; value: { today: string; courses: MedicationCourse[] } }
  | { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_CONSENT_REQUIRED' };
// Danh sách chọn đợt để dừng: chỉ đợt còn hiệu lực hôm nay (BR-029); không phải danh mục lịch sử theo ngày D.
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
    const courses = (await store.findMedicationCourses(profileId)).filter((course) =>
      isStoppableCourse(course, today),
    );
    return { ok: true, value: { today, courses } };
  });
}
