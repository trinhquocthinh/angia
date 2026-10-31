import type { TimelineEvent } from '@angia/contracts';
import { TimelineEventCard } from './TimelineEventCard';
import { TimelineLoadState } from './TimelineLoadState';

type Props = {
  profileId: string;
  items: TimelineEvent[] | undefined;
  loading: boolean;
  error: unknown;
  fetchingMore: boolean;
  hasNextPage: boolean;
  retry: () => void;
  loadMore: () => void;
};

export function TimelineFeed({
  profileId,
  items,
  loading,
  error,
  fetchingMore,
  hasNextPage,
  retry,
  loadMore,
}: Props) {
  if (error || loading || !items) return <TimelineLoadState error={error} retry={retry} />;
  if (items.length === 0 && !hasNextPage)
    return (
      <p role="status" className="rounded-xl bg-white p-6 text-sm">
        Chưa có sự kiện sức khỏe đã ghi nhận.
      </p>
    );
  return (
    <section aria-label="Sự kiện sức khỏe" className="flex min-w-0 flex-col gap-4" aria-busy={fetchingMore}>
      <ol className="flex min-w-0 flex-col gap-4">
        {items.map((event) => (
          <li key={`${event.kind}:${event.id}`}>
            <TimelineEventCard profileId={profileId} event={event} />
          </li>
        ))}
      </ol>
      {hasNextPage && (
        <button
          type="button"
          onClick={loadMore}
          disabled={fetchingMore}
          className="min-h-11 self-center rounded-full bg-[#004135] px-6 text-sm font-semibold text-white disabled:opacity-60"
        >
          {fetchingMore ? 'Đang tải thêm…' : 'Xem thêm'}
        </button>
      )}
      {fetchingMore && (
        <p role="status" className="text-center text-sm">
          Đang tải thêm sự kiện…
        </p>
      )}
    </section>
  );
}
