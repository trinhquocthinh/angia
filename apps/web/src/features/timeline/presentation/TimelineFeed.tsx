import type { TimelineEvent } from '@angia/contracts';
import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';
import { TimelineEventCard } from './TimelineEventCard';
import { TimelineLoadState } from './TimelineLoadState';

type Props = {
  /** undefined: tự xem, không có link sang đơn (SPEC-042). */
  profileId: string | undefined;
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
      <div
        role="status"
        className="profile-bento-card flex flex-col items-center gap-3 border border-dashed border-border/60 px-6 py-10 text-center"
      >
        <ProfileSectionIcon name="history" size={52} />
        <p className="text-body font-medium text-text-secondary">Chưa có sự kiện sức khỏe đã ghi nhận.</p>
      </div>
    );
  return (
    <section aria-label="Sự kiện sức khỏe" className="flex min-w-0 flex-col gap-4" aria-busy={fetchingMore}>
      <ol className="flex min-w-0 flex-col gap-3.5">
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
          className="inline-flex min-h-btn cursor-pointer items-center justify-center self-center rounded-2xl bg-accent px-6 text-button-primary font-semibold text-on-accent shadow-stitch-sm transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {fetchingMore ? 'Đang tải thêm…' : 'Xem thêm'}
        </button>
      )}
      {fetchingMore && (
        <p role="status" className="text-center text-caption text-text-secondary">
          Đang tải thêm sự kiện…
        </p>
      )}
    </section>
  );
}
