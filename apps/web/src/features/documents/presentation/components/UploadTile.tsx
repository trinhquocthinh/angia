import { useState } from 'react';
import type { UploadItem } from '../../application/uploadQueue';
import { DocumentIcon } from './DocumentIcon';
import { TileStatus } from './TileStatus';

export function UploadTile({
  item,
  locked,
  onRemove,
  onRedact,
}: {
  item: UploadItem;
  locked: boolean;
  onRemove: () => void;
  onRedact: () => void;
}) {
  // Đã che thì chỉ hiện bản đã xuất (bản sẽ gửi), không hiện ảnh gốc.
  const preview = item.thumbnailUrl ?? (item.status === 'needs_redaction' ? item.previewUrl : null);
  const editable = (item.status === 'needs_redaction' || item.status === 'ready') && !locked;
  // Nhớ theo src: ảnh gốc HEIC lỗi hiển thị không được chặn ảnh thu nhỏ của bản đã xuất.
  const [broken, setBroken] = useState<string | null>(null);
  const busy = item.status === 'queued' || item.status === 'uploading';
  return (
    <li className="relative flex aspect-square flex-col overflow-hidden rounded-xl bg-[#deebea] shadow-sm">
      {preview && broken !== preview ? (
        <img
          src={preview}
          alt=""
          onError={() => setBroken(preview)}
          className={`h-full w-full object-cover ${busy ? 'opacity-60' : ''}`}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[#707975]">
          <DocumentIcon name="image" size={32} />
        </span>
      )}
      {editable && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Bỏ ảnh ${item.file.name}`}
          className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#404945] shadow-md hover:text-[#ba1a1a] focus-visible:outline-2 focus-visible:outline-[#286958]"
        >
          <DocumentIcon name="close" size={16} />
        </button>
      )}
      {editable && (
        <button
          type="button"
          onClick={onRedact}
          className={`absolute inset-x-2 bottom-8 min-h-9 rounded-full px-2 text-xs font-semibold shadow-md focus-visible:outline-2 focus-visible:outline-[#286958] ${
            item.status === 'ready' ? 'bg-white/90 text-[#004135]' : 'bg-[#004135] text-white'
          }`}
        >
          {item.status === 'ready' ? 'Chỉnh lại' : 'Che thông tin'}
        </button>
      )}
      <TileStatus item={item} onRemove={onRemove} />
      <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-[#004135]/80 to-transparent p-1.5 text-center text-[10px] font-medium text-white">
        {item.file.name}
      </span>
      <span className="sr-only" aria-live="polite">
        {item.status === 'done' ? 'Đã gửi xong' : item.status === 'failed' ? 'Gửi lỗi' : ''}
      </span>
    </li>
  );
}
