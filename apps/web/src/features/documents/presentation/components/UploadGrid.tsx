import type { ReactNode } from 'react';
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
  onRedact,
  addMore,
}: {
  items: UploadItem[];
  summary: {
    needsRedaction: number;
    ready: number;
    total: number;
    done: number;
    active: number;
    failed: number;
  };
  locked: boolean;
  onRetry: () => void;
  onRemove: (id: string) => void;
  onRedact: (id: string) => void;
  /** Ô chọn thêm ảnh ở cuối lưới; bỏ trống khi không được chọn thêm. */
  addMore?: ReactNode;
}) {
  const shown = items.filter((item) => item.status !== 'rejected');
  if (shown.length === 0) return null;
  return (
    <section className="flex flex-col gap-3" aria-label="Ảnh đã chọn">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <UploadSummary summary={summary} />
        {summary.failed > 0 ? (
          <button
            type="button"
            onClick={onRetry}
            className="flex min-h-11 items-center gap-1 text-xs font-semibold text-[#286958] hover:underline"
          >
            <DocumentIcon name="refresh" size={16} /> Gửi lại {summary.failed} ảnh lỗi
          </button>
        ) : (
          summary.needsRedaction > 0 && (
            <p className="text-xs text-[#55615f]">Bấm “Che thông tin” trên từng ảnh để che trước khi gửi</p>
          )
        )}
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((item) => (
          <UploadTile
            key={item.id}
            item={item}
            locked={locked}
            onRemove={() => onRemove(item.id)}
            onRedact={() => onRedact(item.id)}
          />
        ))}
        {addMore && <li>{addMore}</li>}
      </ul>
    </section>
  );
}
