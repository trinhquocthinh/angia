import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import { PainJournalRequestError } from './PainJournalRequestError';
import { refreshPainIssueAccess } from './refreshPainIssueAccess';

export function usePainEntryFailure(session: ProfileSession) {
  const client = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [needsReopen, setNeedsReopen] = useState(false);
  const [existingIssueId, setExistingIssueId] = useState<string | null>(null);
  const clearError = () => {
    setError(null);
    setExistingIssueId(null);
  };
  const handleError = async (cause: unknown) => {
    if (cause instanceof PainJournalRequestError && cause.status === 409) {
      if (cause.code === 'ERR_INVALID_STATE_TRANSITION') {
        setNeedsReopen(true);
        setError('Vấn đề này vừa được đánh dấu đã khỏi.');
        return;
      }
      if (cause.code === 'ERR_PAIN_ISSUE_EXISTS' && cause.existingIssueId)
        setExistingIssueId(cause.existingIssueId);
    }
    setError(
      cause instanceof MedicationRequestError ? cause.message : 'Không thể ghi mức đau. Vui lòng thử lại.',
    );
    if (cause instanceof MedicationRequestError && [401, 403, 404, 409].includes(cause.status))
      await refreshPainIssueAccess(client, session);
  };
  return {
    error,
    needsReopen,
    existingIssueId,
    clearError,
    handleError,
    reopened: () => setNeedsReopen(false),
  };
}
