import type { QueryClient } from '@tanstack/react-query';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import { refreshPainIssueAccess } from './refreshPainIssueAccess';
import { refreshPainIssueViews } from './refreshPainIssueViews';
export async function handleExerciseNoteFailure(
  client: QueryClient,
  session: ProfileSession,
  profileId: string,
  cause: unknown,
) {
  if (cause instanceof MedicationRequestError && [401, 403, 404, 409].includes(cause.status)) {
    await refreshPainIssueAccess(client, session);
    await refreshPainIssueViews(client, session, profileId);
  }
  return cause instanceof MedicationRequestError ? cause.message : 'Không thể lưu bài tập. Vui lòng thử lại.';
}
