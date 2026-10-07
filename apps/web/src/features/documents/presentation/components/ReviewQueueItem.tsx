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
export function ReviewQueueItem({ document, profileName, active }: ReviewQueueItemProps) {
  const type = TYPES[document.type ?? ''] ?? { title: 'Ảnh chứng từ', icon: 'file' as const };
  return (
    <Link
      to="/review/$documentId"
      params={{ documentId: document.id }}
      aria-current={active ? 'page' : undefined}
      className={`flex flex-col gap-2 rounded-2xl p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958] ${active ? 'bg-[#c8f5e9] shadow-[inset_4px_0_0_#004135]' : 'hover:bg-[#eaf6f5]'}`}
    >
      <span className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#b3eddf] text-sm font-semibold text-[#004135]"
        >
          {profileName.slice(0, 1)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-semibold text-[#131d1d]">{type.title}</span>
          <span className="truncate text-sm text-[#55615f]">{profileName}</span>
        </span>
        <ReviewItemChip state={reviewItemState(document)} />
      </span>
      <span className="flex items-center justify-between pl-12 text-xs text-[#55615f]">
        <span className="flex items-center gap-1">
          <DocumentIcon name={type.icon} size={14} /> Tải lên
        </span>
        <span>{time(document.createdAt)}</span>
      </span>
    </Link>
  );
}
