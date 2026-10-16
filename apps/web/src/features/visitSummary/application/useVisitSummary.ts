import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import type { VisitSummaryRepository } from './ports';
import type { SummaryRange } from './summaryRange';

// SPEC-024: chỉ chính chủ gia đình, hồ sơ đã đồng thuận; đổi khoảng giữ bản cũ tới khi bản mới về.
export function useVisitSummary(
  repository: VisitSummaryRepository,
  session: ProfileSession,
  profile: HealthProfile,
  range: SummaryRange,
) {
  return useQuery({
    queryKey: ['visit-summary', session.account.id, session.family?.id, profile.id, range.from, range.to],
    queryFn: ({ signal }) => repository.get(profile.id, range, signal),
    enabled: session.role === 'main' && Boolean(session.family) && profile.consentStatus === 'confirmed',
    placeholderData: keepPreviousData,
    retry: false,
  });
}
