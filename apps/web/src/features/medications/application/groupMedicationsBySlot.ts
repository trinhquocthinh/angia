import type { CurrentMedicationCourse } from '@angia/contracts';
import { AS_NEEDED, DOSE_SLOTS } from '@src/features/documents/application/doseSlots';

export interface MedicationSlotGroup {
  slot: CurrentMedicationCourse['slots'][number];
  label: string;
  courses: CurrentMedicationCourse[];
}

// Design §6: nhóm theo buổi Sáng/Trưa/Chiều/Tối rồi "Khi cần"; thuốc nhiều buổi hiện ở mỗi buổi; tên A→Z.
export function groupMedicationsBySlot(courses: readonly CurrentMedicationCourse[]): MedicationSlotGroup[] {
  const sorted = [...courses].sort((a, b) => a.name.localeCompare(b.name, 'vi') || a.id.localeCompare(b.id));
  return [...DOSE_SLOTS, AS_NEEDED]
    .map(({ value, label }) => ({
      slot: value,
      label,
      courses: sorted.filter((course) => course.slots.includes(value)),
    }))
    .filter((group) => group.courses.length > 0);
}
