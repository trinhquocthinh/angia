import { useInfiniteQuery } from '@tanstack/react-query';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import type { SelfProfileRepository } from './ports';
import { selfProfileKey } from './selfProfileKey';
import { useSelfRecovery } from './useSelfRecovery';

// API đã bỏ sự kiện số đo theo BR-049 nên không lọc lại ở đây.
export function useSelfTimeline(repository: SelfProfileRepository, session: ProfileSession) {
  const query = useInfiniteQuery({
    queryKey: [...selfProfileKey(session), 'timeline'],
    retry: false,
    staleTime: 0,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => repository.timeline(pageParam, signal),
    getNextPageParam: (page) => page.nextCursor,
  });
  useSelfRecovery(session, query.error);
  return query;
}
