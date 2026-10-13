import type { DocumentEntry } from '@angia/contracts';
import { groupEntriesByMonth } from '../../application/groupEntriesByMonth';
import { DocumentEntryCard } from './DocumentEntryCard';
import { EntryListPlaceholder } from './EntryListPlaceholder';

type Props = {
  items: DocumentEntry[] | undefined;
  loading: boolean;
  error: boolean;
  retry: () => void;
  hasMore: boolean;
  loadingMore: boolean;
  loadMore: () => void;
  onOpen: (entry: DocumentEntry) => void;
};

// Dòng thời gian theo tháng (Stitch 10424d70) + nút "Xem thêm" khi còn trang.
export function DocumentEntryList({
  items,
  loading,
  error,
  retry,
  hasMore,
  loadingMore,
  loadMore,
  onOpen,
}: Props) {
  if (loading) return <EntryListPlaceholder state="loading" retry={retry} />;
  if (error || !items) return <EntryListPlaceholder state="error" retry={retry} />;
  if (items.length === 0) return <EntryListPlaceholder state="empty" retry={retry} />;
  return (
    <div className="flex flex-col gap-6">
      {groupEntriesByMonth(items).map((month) => (
        <section key={month.key} aria-labelledby={`month-${month.key}`} className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2
              id={`month-${month.key}`}
              className="flex items-center gap-2 text-lg font-semibold text-[#004135]"
            >
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-[#286958]" />
              {month.label}
            </h2>
            <span className="text-xs text-[#55615f]">{month.items.length} mục</span>
          </div>
          {month.items.map((entry) => (
            <DocumentEntryCard key={entry.id} entry={entry} onOpen={onOpen} />
          ))}
        </section>
      ))}
      {hasMore && (
        <button
          type="button"
          disabled={loadingMore}
          onClick={loadMore}
          className="min-h-11 self-center rounded-xl border border-[#bfc9c4] bg-white px-5 text-sm font-semibold text-[#004135] disabled:opacity-55"
        >
          {loadingMore ? 'Đang tải…' : 'Xem thêm'}
        </button>
      )}
    </div>
  );
}
