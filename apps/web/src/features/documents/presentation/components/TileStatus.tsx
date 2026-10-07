import type { UploadItem } from '../../application/uploadQueue';
import { DocumentIcon } from './DocumentIcon';

// Lớp phủ theo trạng thái: đang nén, chờ/% tiến trình (hoặc lời nhắn máy chủ bận), đã gửi, lỗi kèm "Bỏ ảnh".
export function TileStatus({ item, onRemove }: { item: UploadItem; onRemove: () => void }) {
  const busy = item.status === 'queued' || item.status === 'uploading';
  return (
    <>
      {item.status === 'preparing' && (
        <span className="absolute inset-x-0 bottom-6 flex justify-center">
          <span className="rounded-full bg-[#131d1d]/60 px-2 py-0.5 text-[11px] font-semibold text-white">
            Đang nén…
          </span>
        </span>
      )}
      {item.status === 'done' && (
        <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#286958] text-white shadow-md">
          <DocumentIcon name="check" size={16} />
        </span>
      )}
      {busy && (
        <span className="absolute inset-0 flex flex-col items-center justify-center bg-[#131d1d]/40 p-2 text-white">
          {item.notice ? (
            <span className="text-center text-[11px] font-semibold leading-4">{item.notice}</span>
          ) : (
            <>
              <span className="text-lg font-bold">
                {item.status === 'queued' ? 'Chờ' : `${item.progress}%`}
              </span>
              <span className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/30">
                <span
                  className="block h-full rounded-full bg-[#aef0da]"
                  style={{ width: `${item.progress}%` }}
                />
              </span>
            </>
          )}
        </span>
      )}
      {item.status === 'failed' && (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[#ffdad6]/95 p-2 text-center text-[11px] leading-4 text-[#93000a]">
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
