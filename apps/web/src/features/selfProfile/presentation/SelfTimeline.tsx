import type { ProfileSession } from '@src/features/profiles/application/ports';
import { TimelineFeed } from '@src/features/timeline/presentation/TimelineFeed';
import { useSelfTimeline } from '../application/useSelfTimeline';
import { selfProfileRepository as repository } from './selfProfileRepository';

export function SelfTimeline({ session }: { session: ProfileSession }) {
  const query = useSelfTimeline(repository, session);
  return (
    <TimelineFeed
      profileId={undefined}
      items={query.data?.pages.flatMap((page) => page.items)}
      loading={query.isPending}
      error={query.error}
      fetchingMore={query.isFetchingNextPage}
      hasNextPage={query.hasNextPage}
      retry={() => void query.refetch()}
      loadMore={() => {
        if (!query.isFetching && query.hasNextPage) void query.fetchNextPage();
      }}
    />
  );
}
