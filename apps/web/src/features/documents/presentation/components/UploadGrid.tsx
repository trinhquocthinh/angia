import type { UploadItem } from '../../application/uploadQueue';
import { DocumentIcon } from './DocumentIcon';
import { UploadTile } from './UploadTile';

export function UploadGrid({
  items,
  summary,
  locked,
  onRetry,
  onRemove,
}: {
  items: UploadItem[];
  summary: { ready: number; total: number; done: number; active: number; failed: number };
  locked: boolean;
  onRetry: () => void;
  onRemove: (id: string) => void;
}) {
  const shown = items.filter((item) => item.status !== 'rejected');
  if (shown.length === 0) return null;
  return (
    <section className="flex flex-col gap-2" aria-label="Ảnh đã chọn">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex flex-wrap items-center gap-2 text-lg font-bold text-[#131d1d]">
          {summary.total} ảnh đã chọn
          {summary.ready > 0 && (
            <>
              <Dot />
              <span className="text-sm font-semibold text-[#404945]">{summary.ready} chưa gửi</span>
            </>
          )}
          {summary.done > 0 && (
            <>
              <Dot />
              <span className="text-sm font-semibold text-[#286958]">{summary.done} đã gửi</span>
            </>
          )}
          {summary.active > 0 && (
            <>
              <Dot />
              <span className="text-sm font-semibold text-[#833b00]">{summary.active} đang gửi</span>
            </>
          )}
        </p>
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
const Dot = () => <span className="h-1.5 w-1.5 rounded-full bg-[#bfc9c4]" aria-hidden="true" />;
