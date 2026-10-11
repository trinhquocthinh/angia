import { normalizeName } from '@src/features/prescriptions/domain/normalizeName.js';
import { getActiveMedications } from './getActiveMedications.js';
import type {
  ConflictCourse,
  ConflictItem,
  MedicationConflict,
  MedicationConflictPlan,
} from './MedicationConflict.js';

// SPEC-015: chỉ thay đợt còn active và có hiệu lực tại ngày bắt đầu mới.
// ID xác nhận phải khớp toàn bộ danh sách hiện tại; không tin ID tùy ý từ client.
export function planMedicationConflicts(
  courses: readonly ConflictCourse[],
  items: readonly ConflictItem[],
  startDate: string,
): MedicationConflictPlan {
  const active = getActiveMedications(
    courses.filter((course) => course.status === 'active'),
    startDate,
  );
  const groups = new Map<string, number[]>();
  items.forEach((item, index) => {
    const name = normalizeName(item.name);
    groups.set(name, [...(groups.get(name) ?? []), index]);
  });
  const conflicts: MedicationConflict[] = [];
  const unresolved: MedicationConflict[] = [];
  const replacements = new Set<string>();
  for (const [nameNormalized, itemIndexes] of groups) {
    const matches = active.filter((course) => course.nameNormalized === nameNormalized);
    if (matches.length === 0) continue;
    const conflict = { nameNormalized, itemIndexes, courses: matches };
    conflicts.push(conflict);
    const resolution = items[itemIndexes[0]!]!.resolution;
    const valid =
      resolution !== undefined &&
      itemIndexes.every((index) => {
        const item = items[index]!;
        const ids = item.expectedConflictCourseIds;
        return (
          item.resolution === resolution &&
          ids !== undefined &&
          ids.length === matches.length &&
          new Set(ids).size === ids.length &&
          matches.every((course) => ids.includes(course.id))
        );
      });
    if (!valid) unresolved.push(conflict);
    else if (resolution === 'replace') matches.forEach((course) => replacements.add(course.id));
  }
  if (unresolved.length > 0) return { ok: false, conflicts };
  const endDate = new Date(`${startDate}T00:00:00.000Z`);
  endDate.setUTCDate(endDate.getUTCDate() - 1);
  return {
    ok: true,
    replaceCourseIds: [...replacements],
    replacementEndDate: endDate.toISOString().slice(0, 10),
  };
}
