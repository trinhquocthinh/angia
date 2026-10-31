import { useQuery } from '@tanstack/react-query';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import type { PrescriptionRepository } from './ports';
import { usePrescriptionRecovery } from './usePrescriptionRecovery';

export function usePrescriptionChain(
  repository: Pick<PrescriptionRepository, 'list'>,
  session: ProfileSession,
  profile: HealthProfile,
) {
  const enabled =
    session.role === 'main' &&
    session.family?.id === profile.familyId &&
    profile.consentStatus === 'confirmed';
  const query = useQuery({
    queryKey: ['prescriptions', session.account.id, session.family?.id, profile.id, 'list'],
    enabled,
    retry: false,
    staleTime: 0,
    queryFn: ({ signal }) => repository.list(profile.id, signal),
  });
  usePrescriptionRecovery(query.error, session);
  return { ...query, data: enabled && !query.isFetching && !query.isError ? query.data : undefined };
}
