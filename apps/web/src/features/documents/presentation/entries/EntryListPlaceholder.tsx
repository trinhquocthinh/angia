import { Link } from '@tanstack/react-router';

// Khung xương 3 thẻ, thẻ lỗi + Thử lại, trạng thái rỗng của danh mục (Design §E5-S4-T1).
export function EntryListPlaceholder({
  state,
  retry,
}: {
  state: 'loading' | 'error' | 'empty';
  retry: () => void;
}) {
  if (state === 'loading')
    return (
      <div role="status" aria-label="Đang tải giấy tờ khám" className="flex flex-col gap-4">
        {[0, 1, 2].map((key) => (
          <div key={key} className="h-32 animate-pulse rounded-xl bg-surface motion-reduce:animate-none" />
        ))}
      </div>
    );
  if (state === 'error')
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-[20px] bg-danger-soft p-5 text-sm">
        <p>Không tải được giấy tờ khám.</p>
        <button
          type="button"
          onClick={retry}
          className="min-h-11 rounded-xl bg-surface px-4 font-semibold text-accent"
        >
          Thử lại
        </button>
      </div>
    );
  return (
    <div className="flex flex-col items-center gap-3 rounded-[20px] border-2 border-dashed border-border bg-surface px-6 py-12 text-center">
      <p className="text-sm font-semibold text-text-primary">Chưa có giấy tờ khám.</p>
      <Link
        to="/upload"
        className="min-h-11 content-center rounded-full bg-accent px-5 text-sm font-semibold text-on-accent"
      >
        Tải ảnh giấy tờ
      </Link>
    </div>
  );
}
