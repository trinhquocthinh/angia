import { consentGate } from '@src/features/profiles/domain/consentGate.js';
import { isAsNeededCourse } from '../domain/canRecordAsNeededDose.js';
import { resolveDoseInterval } from '../domain/resolveDoseInterval.js';
import type {
  AsNeededDoseOutcome,
  AsNeededDoseRepository,
  CourseIntervalResult,
  ProfileTarget,
} from './ports.js';

// SPEC-047: người dùng nhập theo nhãn thuốc; giá trị in trên đơn vẫn được ưu tiên và không sửa được.
export function setCourseInterval(
  repository: AsNeededDoseRepository,
  target: ProfileTarget & { courseId: string; text: string | null },
): Promise<AsNeededDoseOutcome<CourseIntervalResult, 'ERR_VALIDATION'>> {
  return repository.withFamily(target.familyId, async (store) => {
    const blocked = consentGate((await store.findProfile(target.profileId))?.consentStatus ?? null);
    if (blocked) return { ok: false, code: blocked };
    const course = await store.findCourse(target.profileId, target.courseId);
    if (!course?.prescriptionItemId || !isAsNeededCourse(course))
      return { ok: false, code: 'ERR_VALIDATION' };
    await store.setUserInterval(target.profileId, target.courseId, target.text);
    return {
      ok: true,
      value: { courseId: course.id, interval: resolveDoseInterval(course.minIntervalText, target.text) },
    };
  });
}
