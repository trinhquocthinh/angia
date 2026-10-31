import { Link } from '@tanstack/react-router';
import { reviewItemState } from '../../application/reviewQueuePolling';
import type { SourceDocument } from '../../application/reviewPorts';
import { ReviewItemChip } from './ReviewItemChip';
import { DocumentIcon, type DocumentIconName } from './DocumentIcon';

const TYPES: Record<string, { title: string; icon: DocumentIconName }> = {
  device_reading: { title: 'Màn hình máy đo', icon: 'monitor' },
  prescription: { title: 'Đơn thuốc', icon: 'prescription' },
  lab_result: { title: 'Kết quả xét nghiệm', icon: 'lab' },
};
const time = (iso: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));

type ReviewQueueItemProps = { document: SourceDocument; profileName: string; active: boolean };

// Hiện ngay khi ảnh vừa lên (AI đang đọc); đơn thuốc/xét nghiệm và nhập tay vẫn hiện để không bị "mất".
// Bố cục Stitch 626ca318: avatar nhỏ + tiêu đề/hồ sơ, chip trạng thái bên phải, dòng phụ loại + giờ.
export function ReviewQueueItem({ document, profileName, active }: ReviewQueueItemProps) {
  const type = TYPES[document.type ?? ''] ?? { title: 'Hình chụp giấy tờ', icon: 'file' as const };
  return (
    <Link
      to="/review/$documentId"
      params={{ documentId: document.id }}
      aria-current={active ? 'page' : undefined}
      className={`relative flex flex-col gap-2 rounded-xl p-3 transition-[background-color,scale] duration-200 active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958] ${active ? 'bg-[#deebea] pl-5 shadow-sm' : 'hover:bg-[#eaf6f5]'}`}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute top-3 bottom-3 left-0 w-1.5 rounded-r-full bg-[#20594b]"
        />
      )}
      <span className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1.5">
        <span className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#aef0da] text-sm font-bold text-[#002019]"
          >
            {profileName.slice(0, 1)}
          </span>
          <span className="flex min-w-0 flex-col">
            <span
              className={`truncate text-sm ${active ? 'font-bold text-[#004135]' : 'font-semibold text-[#131d1d]'}`}
            >
              {type.title}
            </span>
            <span className="truncate text-sm text-[#404945]">{profileName}</span>
          </span>
        </span>
        <ReviewItemChip state={reviewItemState(document)} />
      </span>
      <span className="flex items-center justify-between text-xs text-[#55615f]">
        <span className="flex items-center gap-1">
          <DocumentIcon name={type.icon} size={14} /> Tải lên
        </span>
        <span className="font-medium tabular-nums">{time(document.createdAt)}</span>
      </span>
    </Link>
  );
}
