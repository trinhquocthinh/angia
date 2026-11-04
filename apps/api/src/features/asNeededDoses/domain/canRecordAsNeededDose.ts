import type { AsNeededCourse } from './AsNeededDose.js';

// BR-054 + BR-030: chỉ đợt "Khi cần" có dòng đơn, còn hiệu lực tại ngày cho thuốc (giờ Việt Nam).
export function canRecordAsNeededDose(course: AsNeededCourse | null, givenDate: string): boolean {
  if (!course?.prescriptionItemId || !isAsNeededCourse(course)) return false;
  return course.startDate <= givenDate && (course.endDate === null || course.endDate >= givenDate);
}

export function isAsNeededCourse(course: Pick<AsNeededCourse, 'slots'>): boolean {
  return course.slots.length === 1 && course.slots[0] === 'as_needed';
}
