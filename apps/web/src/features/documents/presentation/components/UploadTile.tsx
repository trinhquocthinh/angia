import { useState } from 'react';
import type { UploadItem } from '../../application/uploadQueue';
import { DocumentIcon } from './DocumentIcon';
import { TileActions } from './TileActions';
import { TileBadge } from './TileBadge';
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
    <li className="flex min-w-0 flex-col gap-2 rounded-xl bg-white p-2 shadow-sm">
      <div className="relative h-44 overflow-hidden rounded-lg bg-[#deebea] sm:h-56">
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
          <TileActions
            name={item.file.name}
            ready={item.status === 'ready'}
            onRemove={onRemove}
            onRedact={onRedact}
          />
        )}
        <TileStatus item={item} onRemove={onRemove} />
      </div>
      <div className="flex min-w-0 items-center justify-between gap-2 px-1 pb-1">
        <span title={item.file.name} className="truncate font-mono text-[11px] text-[#131d1d]">
          {item.file.name}
        </span>
        <TileBadge status={item.status} />
      </div>
      <span className="sr-only" aria-live="polite">
        {item.status === 'done' ? 'Đã gửi xong' : item.status === 'failed' ? 'Gửi lỗi' : ''}
      </span>
    </li>
  );
}
