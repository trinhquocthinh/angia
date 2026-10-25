import type { CourseConflict } from '@angia/contracts';
import type { ApproveDocumentRequest } from '@src/features/documents/application/reviewPorts';
import type { ReviewRequestError } from '@src/features/documents/application/ReviewRequestError';

export interface CourseConflictPrompt {
  request: Extract<ApproveDocumentRequest, { type: 'prescription' }>;
  conflicts: CourseConflict[];
}
export function courseConflictPrompt(
  error: ReviewRequestError | null,
  lastRequest: ApproveDocumentRequest | null,
): {
  formError: ReviewRequestError | null;
  prompt: CourseConflictPrompt | null;
} {
  const conflicts = error?.code === 'ERR_COURSE_CONFLICT_UNRESOLVED' ? error.courseConflicts : [];
  if (
    lastRequest?.type !== 'prescription' ||
    conflicts.length === 0 ||
    !conflicts.every((c) =>
      c.itemIndexes.every(
        (index) => Number.isInteger(index) && index >= 0 && index < lastRequest.data.items.length,
      ),
    )
  )
    return { formError: error, prompt: null };
  return { formError: null, prompt: { request: lastRequest, conflicts } };
}
