import type { CourseConflict, ReusePrescriptionRequest } from '@angia/contracts';
import type { CourseChoices } from '@src/features/medications/application/resolveCoursePrompt';

// SPEC-015 cho Dùng lại đơn: mọi nhóm phải có lựa chọn; dòng trong nhóm gửi kèm đủ ID đợt cũ.
export function resolveReuseConflict(
  request: ReusePrescriptionRequest,
  conflicts: readonly CourseConflict[],
  choices: CourseChoices,
): ReusePrescriptionRequest | null {
  if (
    conflicts.some((c) => choices[c.nameNormalized] !== 'replace' && choices[c.nameNormalized] !== 'parallel')
  )
    return null;
  const items = request.items.map((item, index) => {
    const conflict = conflicts.find((c) => c.itemIndexes.includes(index));
    if (!conflict) return { ...item };
    return {
      ...item,
      resolution: choices[conflict.nameNormalized]!,
      expectedConflictCourseIds: conflict.courses.map((course) => course.id),
    };
  });
  return { ...request, items };
}
