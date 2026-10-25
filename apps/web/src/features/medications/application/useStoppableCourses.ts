import { useEffect } from 'react';
import { MedicationRequestError } from './MedicationRequestError';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import type { MedicationStoppingRepository } from './stoppingPorts';
export function useStoppableCourses(
  repository: MedicationStoppingRepository,
  session: ProfileSession,
  profile: HealthProfile,
) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['medications', session.account.id, session.family?.id, profile.id, 'stoppable'],
    queryFn: ({ signal }) => repository.list(profile.id, signal),
    enabled: session.role === 'main' && Boolean(session.family) && profile.consentStatus === 'confirmed',
    retry: false,
  });
  useEffect(() => {
    if (
      query.error instanceof MedicationRequestError &&
      (query.error.status === 401 || query.error.status === 403)
    )
      void client.invalidateQueries({ queryKey: ['current-session'] });
  }, [client, query.error]);
  return query;
}
