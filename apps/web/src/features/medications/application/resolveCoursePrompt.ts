import type { ApproveDocumentRequest } from '@src/features/documents/application/reviewPorts';
import type { CourseConflictPrompt } from './courseConflictPrompt';

export type CourseChoices = Partial<Record<string, 'replace' | 'parallel'>>;
export function resolveCoursePrompt(
  prompt: CourseConflictPrompt,
  choices: CourseChoices,
): ApproveDocumentRequest | null {
  if (
    prompt.conflicts.some(
      (c) => choices[c.nameNormalized] !== 'replace' && choices[c.nameNormalized] !== 'parallel',
    )
  )
    return null;
  const items = prompt.request.data.items.map((item, index) => {
    const conflict = prompt.conflicts.find((c) => c.itemIndexes.includes(index));
    if (!conflict) return { ...item };
    return {
      ...item,
      resolution: choices[conflict.nameNormalized]!,
      expectedConflictCourseIds: conflict.courses.map((course) => course.id),
    };
  });
  return { ...prompt.request, data: { ...prompt.request.data, items } };
}
