import { useState } from 'react';
import type { UploadItem } from '../../application/uploadQueue';
import { DocumentIcon } from './DocumentIcon';
import { TileStatus } from './TileStatus';

export function UploadTile({
  item,
  locked,
  onRemove,
}: {
  item: UploadItem;
  locked: boolean;
  onRemove: () => void;
}) {
  const preview = item.previewUrl;
  const [broken, setBroken] = useState(false);
  const busy = item.status === 'queued' || item.status === 'uploading';
  return (
    <li className="relative flex aspect-square flex-col overflow-hidden rounded-xl bg-[#deebea] shadow-sm">
      {preview && !broken ? (
        <img
          src={preview}
          alt=""
          onError={() => setBroken(true)}
          className={`h-full w-full object-cover ${busy ? 'opacity-60' : ''}`}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[#707975]">
          <DocumentIcon name="image" size={32} />
        </span>
      )}
      {item.status === 'ready' && !locked && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Bỏ ảnh ${item.file.name}`}
          className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#404945] shadow-md hover:text-[#ba1a1a] focus-visible:outline-2 focus-visible:outline-[#286958]"
        >
          <DocumentIcon name="close" size={16} />
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
