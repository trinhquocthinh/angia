import type { MedicationCourse } from './MedicationCourse.js';
export type StopCourseResult =
  | { ok: true; value: MedicationCourse }
  | { ok: false; code: 'ERR_VALIDATION' | 'ERR_INVALID_STATE_TRANSITION' };

// BR-029 (thu hẹp 2026-10-12): chỉ dừng đợt active đã bắt đầu và còn hiệu lực hôm nay; đợt đã qua kỳ hạn
// (như đơn cũ nhập để lưu trữ) không còn gì để dừng.
export function isStoppableCourse(
  course: Pick<MedicationCourse, 'status' | 'startDate' | 'endDate'>,
  today: string,
): boolean {
  return (
    course.status === 'active' &&
    course.startDate <= today &&
    (course.endDate === null || course.endDate >= today)
  );
}

// SPEC-017: đầu vào course từ DB; today do Application cấp theo giờ Việt Nam.
export function stopMedicationCourse(
  course: MedicationCourse,
  stopDate: string,
  today: string,
): StopCourseResult {
  if (course.status !== 'active' || (course.endDate !== null && course.endDate < today))
    return { ok: false, code: 'ERR_INVALID_STATE_TRANSITION' };
  const date = new Date(`${stopDate}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(stopDate) ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== stopDate ||
    stopDate < course.startDate ||
    stopDate > today ||
    (course.endDate !== null && stopDate > course.endDate)
  )
    return { ok: false, code: 'ERR_VALIDATION' };
  date.setUTCDate(date.getUTCDate() - 1);
  return { ok: true, value: { ...course, status: 'stopped', endDate: date.toISOString().slice(0, 10) } };
}
