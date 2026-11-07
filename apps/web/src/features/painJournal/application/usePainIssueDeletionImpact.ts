import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import { profileScopeKey } from '@src/features/profiles/application/profileScopeKey';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import type { PainIssueLifecycleApi } from './ports';
import { canWritePainIssue } from './canWritePainIssue';
import { refreshPainIssueAccess } from './refreshPainIssueAccess';
export function usePainIssueDeletionImpact(
  api: Pick<PainIssueLifecycleApi, 'deletionImpact'>,
  session: ProfileSession,
  profile: HealthProfile,
  scope: 'main' | 'self',
  issueId: string,
) {
  const client = useQueryClient();
  const enabled = canWritePainIssue(session, profile, scope);
  const query = useQuery({
    queryKey: [...profileScopeKey(session), 'pain', scope, profile.id, 'deletion-impact', issueId],
    enabled,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    queryFn: ({ signal }) => {
      if (!enabled) throw new Error('Không thể đọc tác động xóa trong phạm vi này.');
      return api.deletionImpact(scope === 'self' ? null : profile.id, issueId, signal);
    },
  });
  useEffect(() => {
    if (query.error instanceof MedicationRequestError && [401, 403, 404, 409].includes(query.error.status))
      void refreshPainIssueAccess(client, session);
  }, [client, query.error, session]);
  return { ...query, data: enabled && !query.isError && !query.isFetching ? query.data : undefined };
}
