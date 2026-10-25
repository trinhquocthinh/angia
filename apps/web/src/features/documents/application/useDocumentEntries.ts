import { useInfiniteQuery } from '@tanstack/react-query';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import type { DocumentEntriesRepository, EntryTypeFilter } from './documentEntryPorts';

// SPEC-028: danh mục phân trang cursor; chỉ main của gia đình với hồ sơ đã đồng thuận.
export function useDocumentEntries(
  repository: DocumentEntriesRepository,
  session: ProfileSession,
  profile: HealthProfile,
  type: EntryTypeFilter | undefined,
) {
  return useInfiniteQuery({
    queryKey: ['documents', session.account.id, session.family?.id, profile.id, 'entries', type ?? 'all'],
    queryFn: ({ pageParam, signal }) => repository.page(profile.id, { type, cursor: pageParam }, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: session.role === 'main' && Boolean(session.family) && profile.consentStatus === 'confirmed',
    retry: false,
  });
}
