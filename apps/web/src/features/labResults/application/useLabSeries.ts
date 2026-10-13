import { useQuery } from '@tanstack/react-query';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import type { LabResultsRepository } from './ports';

// SPEC-021: chuỗi xét nghiệm của hồ sơ; chỉ chính chủ gia đình và hồ sơ đã đồng thuận.
export function useLabSeries(
  repository: LabResultsRepository,
  session: ProfileSession,
  profile: HealthProfile | undefined,
) {
  return useQuery({
    queryKey: ['lab-results', session.account.id, session.family?.id, profile?.id, 'series'],
    queryFn: ({ signal }) => repository.series(profile!.id, signal),
    enabled: session.role === 'main' && Boolean(session.family) && profile?.consentStatus === 'confirmed',
    retry: false,
  });
}
