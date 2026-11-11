import type { UploadItem } from '../../application/uploadQueue';
import { DocumentIcon } from './DocumentIcon';

// Lớp phủ theo trạng thái: chờ/% tiến trình (hoặc lời nhắn máy chủ bận), đã gửi, lỗi kèm "Bỏ ảnh".
export function TileStatus({ item, onRemove }: { item: UploadItem; onRemove: () => void }) {
  const busy = item.status === 'queued' || item.status === 'uploading';
  return (
    <>
      {item.status === 'done' && (
        <span className="angia-modal-pop absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-on-accent shadow-md">
          <DocumentIcon name="check" size={16} />
        </span>
      )}
      {busy && (
        <span className="absolute inset-0 flex flex-col items-center justify-center bg-overlay/70 p-3 text-on-overlay backdrop-blur-[2px]">
          {item.notice ? (
            <span className="text-center text-[11px] font-semibold leading-4">{item.notice}</span>
          ) : (
            <>
              <span className="text-lg font-bold tabular-nums">
                {item.status === 'queued' ? 'Chờ' : `${item.progress}%`}
              </span>
              <span className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-on-overlay/30">
                <span
                  className="block h-full origin-left rounded-full bg-on-overlay transition-transform duration-300 ease-out motion-reduce:transition-none"
                  style={{ transform: `scaleX(${item.progress / 100})` }}
                />
              </span>
            </>
          )}
        </span>
      )}
      {item.status === 'failed' && (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-danger-soft/95 p-2 text-center text-[11px] leading-4 text-danger">
          <DocumentIcon name="warning" size={18} />
          {item.error}
          <button type="button" onClick={onRemove} className="min-h-8 font-semibold underline">
            Bỏ ảnh
          </button>
        </span>
      )}
    </>
  );
}
