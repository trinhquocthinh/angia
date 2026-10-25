import type { CurrentMedicationCourse } from '@angia/contracts';
import { formatDay } from '@src/features/measurements/application/formatMeasurement';

// Nguồn gốc đợt thuốc (Design §6): "Đơn dd/mm/yyyy" theo ngày kê, thuốc bổ là "Tự khai".
export function medicationSourceLabel(
  course: Pick<CurrentMedicationCourse, 'source' | 'prescriptionIssuedDate'>,
): string {
  if (course.source === 'self_reported') return 'Tự khai';
  return course.prescriptionIssuedDate ? `Đơn ${formatDay(course.prescriptionIssuedDate)}` : 'Theo đơn';
}
