import type { PainProfileContext } from './painProfileContext';
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { profileScopeKey } from '@src/features/profiles/application/profileScopeKey';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import type { PainContextReader } from './ports';
import { refreshPainIssueAccess } from './refreshPainIssueAccess';

export function usePainContext(
  api: PainContextReader,
  session: ProfileSession,
  profile: PainProfileContext,
  scope: 'main' | 'self',
  issueId: string,
  range: { from: string; to: string },
) {
  const client = useQueryClient();
  const enabled =
    Boolean(session.family) &&
    session.family?.id === profile.familyId &&
    profile.consentStatus === 'confirmed' &&
    (scope === 'self' ? session.account.healthProfileId === profile.id : session.role === 'main');
  const query = useQuery({
    queryKey: [
      ...profileScopeKey(session),
      'pain',
      scope,
      profile.id,
      'context',
      issueId,
      range.from,
      range.to,
    ],
    enabled,
    retry: false,
    staleTime: 0,
    queryFn: ({ signal }) => {
      if (!enabled) throw new Error('Không thể đọc bối cảnh thuốc trong phạm vi này.');
      return api.context(scope === 'self' ? null : profile.id, issueId, range, signal);
    },
  });
  useEffect(() => {
    if (query.error instanceof MedicationRequestError && [401, 403, 404, 409].includes(query.error.status))
      void refreshPainIssueAccess(client, session);
  }, [client, query.error, session]);
  return { ...query, data: enabled && !query.isError ? query.data : undefined };
}
