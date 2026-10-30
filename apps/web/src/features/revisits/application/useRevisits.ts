import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import { vietnamDate } from '@src/features/visitSummary/application/vietnamDate';
import type { RevisitRepository } from './ports';

export function useRevisits(
  repository: Pick<RevisitRepository, 'list'>,
  session: ProfileSession,
  profile: HealthProfile,
) {
  const client = useQueryClient();
  const enabled =
    session.role === 'main' &&
    session.family?.id === profile.familyId &&
    profile.consentStatus === 'confirmed';
  const query = useQuery({
    queryKey: ['revisits', session.account.id, session.family?.id, profile.id, vietnamDate()],
    enabled,
    retry: false,
    staleTime: 0,
    queryFn: ({ signal }) => repository.list(profile.id, signal),
  });
  useEffect(() => {
    if (query.error instanceof MedicationRequestError && [401, 403, 409].includes(query.error.status)) {
      void client.invalidateQueries({ queryKey: ['current-session'] });
      void client.invalidateQueries({ queryKey: ['profiles', session.account.id, session.family?.id] });
    }
  }, [client, query.error, session.account.id, session.family?.id]);
  return { ...query, data: enabled && !query.isFetching && !query.isError ? query.data : undefined };
}
