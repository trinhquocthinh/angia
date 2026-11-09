import type { QueryClient } from '@tanstack/react-query';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import { PainJournalRequestError } from './PainJournalRequestError';
import { refreshPainIssueAccess } from './refreshPainIssueAccess';
import { refreshPainIssueViews } from './refreshPainIssueViews';
export async function handlePainIssueLifecycleFailure(
  client: QueryClient,
  session: ProfileSession,
  profileId: string,
  cause: unknown,
) {
  if (cause instanceof MedicationRequestError && [401, 403, 404, 409].includes(cause.status)) {
    await refreshPainIssueAccess(client, session);
    await refreshPainIssueViews(client, session, profileId);
  }
  if (
    cause instanceof PainJournalRequestError &&
    cause.code === 'ERR_PAIN_ISSUE_EXISTS' &&
    cause.existingIssueId
  )
    return {
      error: 'Vùng này đang có một vấn đề khác đang theo dõi.',
      existingIssueId: cause.existingIssueId,
    };
  return {
    error:
      cause instanceof MedicationRequestError
        ? cause.message
        : 'Không thể cập nhật vấn đề đau. Vui lòng thử lại.',
    existingIssueId: null,
  };
}
