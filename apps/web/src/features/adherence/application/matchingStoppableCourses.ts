import type { MedicationCourse } from '@angia/contracts';
import { normalizeMedicationName } from './normalizeMedicationName';
import type { AdherencePeriod } from './ports';

// Giai đoạn thực tế (BR-031) độc lập với đợt thuốc chỉ định; ghi "Ngưng" chỉ GỢI Ý dừng các đợt còn
// dừng được (SPEC-017) cùng tên chuẩn hóa và bắt đầu không sau mốc ngưng — người dùng xác nhận mới dừng.
export function matchingStoppableCourses(
  courses: readonly MedicationCourse[],
  saved: AdherencePeriod,
): MedicationCourse[] {
  if (saved.status !== 'stopped') return [];
  const name = normalizeMedicationName(saved.medicationName);
  return courses.filter(
    (course) => normalizeMedicationName(course.name) === name && course.startDate <= saved.fromDate,
  );
}
