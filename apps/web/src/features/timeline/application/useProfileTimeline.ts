import { useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import { profileShowsVitals } from '@src/features/profiles/application/profileShowsVitals';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import type { TimelineRepository } from './ports';

export function useProfileTimeline(
  repository: TimelineRepository,
  session: ProfileSession,
  profile: HealthProfile,
) {
  const client = useQueryClient();
  const showsVitals = profileShowsVitals(profile);
  const enabled =
    session.role === 'main' &&
    session.family?.id === profile.familyId &&
    profile.consentStatus === 'confirmed';
  const query = useInfiniteQuery({
    queryKey: ['timeline', session.account.id, session.family?.id, profile.id, showsVitals],
    enabled,
    retry: false,
    staleTime: 0,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => repository.list(profile.id, pageParam, signal),
    getNextPageParam: (page) => page.nextCursor,
    select: (data) => ({
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        items: page.items.filter((event) => showsVitals || event.kind !== 'measurement'),
      })),
    }),
  });
  useEffect(() => {
    if (query.error instanceof MedicationRequestError && [401, 403, 404, 409].includes(query.error.status)) {
      void client.invalidateQueries({ queryKey: ['current-session'] });
      void client.invalidateQueries({ queryKey: ['profiles', session.account.id, session.family?.id] });
    }
  }, [client, query.error, session.account.id, session.family?.id]);
  // Giữ trang đã tải trong lúc xem thêm; ẩn ngay khi lỗi hoặc làm mới toàn bộ.
  const visible = enabled && !query.isError && (!query.isFetching || query.isFetchingNextPage);
  return { ...query, data: visible ? query.data : undefined };
}
