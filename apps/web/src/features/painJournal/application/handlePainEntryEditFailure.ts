import type { QueryClient } from '@tanstack/react-query';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import { PainJournalRequestError } from './PainJournalRequestError';
import { refreshPainIssueAccess } from './refreshPainIssueAccess';
import { refreshPainIssueViews } from './refreshPainIssueViews';

export async function handlePainEntryEditFailure(
  client: QueryClient,
  session: ProfileSession,
  profileId: string,
  cause: unknown,
) {
  const lastEntry = cause instanceof PainJournalRequestError && cause.reason === 'last_entry';
  if (lastEntry) await refreshPainIssueViews(client, session, profileId);
  if (cause instanceof MedicationRequestError && [401, 403, 404, 409].includes(cause.status)) {
    await refreshPainIssueAccess(client, session);
    await refreshPainIssueViews(client, session, profileId);
  }
  return {
    lastEntry,
    error: lastEntry
      ? 'Đây là lần ghi duy nhất. Muốn bỏ hẳn, hãy xóa vấn đề.'
      : cause instanceof MedicationRequestError
        ? cause.message
        : 'Không thể cập nhật lần ghi. Vui lòng thử lại.',
  };
}
