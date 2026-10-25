import type { CurrentMedicationCourse } from '@angia/contracts';
import { doseSlotLabel, sortDoseSlots } from '@src/features/documents/application/doseSlots';
import { medicationSourceLabel } from '@src/features/medications/application/medicationSourceLabel';
import { remainingDaysLabel } from '@src/features/medications/application/remainingDaysLabel';

export interface SummaryMedicationRow {
  id: string;
  name: string;
  dose: string;
  duration: string;
  source: string;
}

function dose(course: CurrentMedicationCourse): string {
  const amount =
    course.quantityPerDose === null
      ? 'Theo đơn'
      : `${course.quantityPerDose.toLocaleString('vi-VN')}${course.doseUnit ? ` ${course.doseUnit}` : ''}`;
  const slots = sortDoseSlots(course.slots).map((slot) => doseSlotLabel(slot).toLocaleLowerCase('vi'));
  return `${amount} · ${slots.join(', ')}`;
}

// Bảng "Thuốc đang dùng" (Design v0.1 §7): thuốc · liều · buổi · thời hạn · nguồn; tên A→Z như danh mục.
// today là ngày tạo bản tóm tắt (Việt Nam) — mốc tính danh mục của SPEC-018.
export function medicationRows(
  courses: readonly CurrentMedicationCourse[],
  today: string,
): SummaryMedicationRow[] {
  return [...courses]
    .sort((a, b) => a.name.localeCompare(b.name, 'vi') || a.id.localeCompare(b.id))
    .map((course) => ({
      id: course.id,
      name: course.strength ? `${course.name} ${course.strength}` : course.name,
      dose: dose(course),
      duration: remainingDaysLabel(course.endDate, today),
      source: medicationSourceLabel(course),
    }));
}
