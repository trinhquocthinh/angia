import type { CourseConflict, CreateSelfReportedCourseRequest } from '@angia/contracts';
import type { CourseChoices } from './resolveCoursePrompt';

export function resolveSelfReportedConflict(
  request: CreateSelfReportedCourseRequest,
  conflicts: readonly CourseConflict[],
  choices: CourseChoices,
): CreateSelfReportedCourseRequest | null {
  const conflict = conflicts[0];
  if (!conflict || conflicts.length !== 1) return null;
  const resolution = choices[conflict.nameNormalized];
  if (resolution !== 'replace' && resolution !== 'parallel') return null;
  return { ...request, resolution, expectedConflictCourseIds: conflict.courses.map((c) => c.id) };
}
