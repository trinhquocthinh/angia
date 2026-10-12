import type { MedicationCoursePeriod } from './MedicationCoursePeriod.js';

// BR-030: tính theo ngày D, không loại lịch sử dựa trên trạng thái hiện tại.
// courses chỉ chứa các đợt của một hồ sơ, đã được bên gọi kiểm tra phạm vi truy cập.
export function getActiveMedications<T extends MedicationCoursePeriod>(
  courses: readonly T[],
  targetDate: string,
): T[] {
  return courses.filter(
    (course) => course.startDate <= targetDate && (course.endDate === null || course.endDate >= targetDate),
  );
}
