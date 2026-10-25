import type { UploadItem } from '../../application/uploadQueue';
import { DocumentIcon } from './DocumentIcon';
import { UploadSummary } from './UploadSummary';
import { UploadTile } from './UploadTile';

export function UploadGrid({
  items,
  summary,
  locked,
  onRetry,
  onRemove,
}: {
  items: UploadItem[];
  summary: { preparing: number; ready: number; total: number; done: number; active: number; failed: number };
  locked: boolean;
  onRetry: () => void;
  onRemove: (id: string) => void;
}) {
  const shown = items.filter((item) => item.status !== 'rejected');
  if (shown.length === 0) return null;
  return (
    <section className="flex flex-col gap-2" aria-label="Ảnh đã chọn">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <UploadSummary summary={summary} />
        {summary.failed > 0 && (
          <button
            type="button"
            onClick={onRetry}
            className="flex min-h-11 items-center gap-1 text-xs font-semibold text-[#286958] hover:underline"
          >
            <DocumentIcon name="refresh" size={16} /> Gửi lại {summary.failed} ảnh lỗi
          </button>
        )}
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
        {shown.map((item) => (
          <UploadTile key={item.id} item={item} locked={locked} onRemove={() => onRemove(item.id)} />
        ))}
      </ul>
    </section>
  );
}
