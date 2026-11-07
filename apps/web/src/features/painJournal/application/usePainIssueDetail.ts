import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import { profileScopeKey } from '@src/features/profiles/application/profileScopeKey';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import type { PainIssueReader } from './ports';
import { refreshPainIssueAccess } from './refreshPainIssueAccess';

export function usePainIssueDetail(
  api: PainIssueReader,
  session: ProfileSession,
  profile: HealthProfile,
  scope: 'main' | 'self',
  issueId: string,
) {
  const client = useQueryClient();
  const enabled =
    Boolean(session.family) &&
    session.family?.id === profile.familyId &&
    profile.consentStatus === 'confirmed' &&
    (scope === 'self' ? session.account.healthProfileId === profile.id : session.role === 'main');
  const query = useQuery({
    queryKey: [...profileScopeKey(session), 'pain', scope, profile.id, 'detail', issueId],
    enabled,
    retry: false,
    staleTime: 0,
    queryFn: ({ signal }) => {
      if (!enabled) throw new Error('Không thể đọc vấn đề đau trong phạm vi này.');
      return api.detail(scope === 'self' ? null : profile.id, issueId, signal);
    },
  });
  useEffect(() => {
    if (query.error instanceof MedicationRequestError && [401, 403, 404, 409].includes(query.error.status))
      void refreshPainIssueAccess(client, session);
  }, [client, query.error, session]);
  return { ...query, data: enabled && !query.isError ? query.data : undefined };
}
