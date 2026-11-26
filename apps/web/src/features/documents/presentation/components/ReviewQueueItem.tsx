import { Link } from '@tanstack/react-router';
import {
  ProfileSectionIcon,
  type ProfileSectionIconName,
} from '@src/features/profiles/presentation/components/ProfileSectionIcon';
import { reviewItemState } from '../../application/reviewQueuePolling';
import type { SourceDocument } from '../../application/reviewPorts';
import { DocumentIcon, type DocumentIconName } from './DocumentIcon';
import { ReviewItemChip } from './ReviewItemChip';

const TYPES: Record<string, { title: string; clay: ProfileSectionIconName; icon: DocumentIconName }> = {
  device_reading: { title: 'Màn hình máy đo', clay: 'monitor_heart', icon: 'monitor' },
  prescription: { title: 'Đơn thuốc', clay: 'receipt_long', icon: 'prescription' },
  lab_result: { title: 'Kết quả xét nghiệm', clay: 'science', icon: 'lab' },
};
const time = (iso: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));

type ReviewQueueItemProps = { document: SourceDocument; profileName: string; active: boolean };

// Hiện ngay khi ảnh vừa lên (AI đang đọc); bố cục Stitch bb3e9ab1: icon 3D đất sét + tiêu đề + chip trạng thái.
export function ReviewQueueItem({ document, profileName, active }: ReviewQueueItemProps) {
  const type = TYPES[document.type ?? ''] ?? {
    title: 'Hình chụp giấy tờ',
    clay: 'folder_open' as const,
    icon: 'file' as const,
  };
  return (
    <Link
      to="/review/$documentId"
      params={{ documentId: document.id }}
      aria-current={active ? 'page' : undefined}
      className={`review-queue-item relative flex flex-col gap-2.5 rounded-2xl p-3.5 transition-[background-color,border-color,scale] duration-200 active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
        active ? 'bg-accent-soft' : 'bg-surface hover:bg-accent-soft/65'
      }`}
    >
      <span className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1.5">
        <span className="flex min-w-0 items-center gap-3">
          <span aria-hidden="true" className={`doc-clay-tile-sm ${active ? 'doc-clay-tile-active' : ''}`}>
            {active ? (
              <DocumentIcon name={type.icon} size={22} />
            ) : (
              <ProfileSectionIcon name={type.clay} size={28} />
            )}
          </span>
          <span className="flex min-w-0 flex-col">
            <span
              className={`truncate text-body ${active ? 'font-bold text-accent' : 'font-semibold text-text-primary'}`}
            >
              {type.title}
            </span>
            <span className="truncate text-caption text-text-secondary">{profileName}</span>
          </span>
        </span>
        <ReviewItemChip state={reviewItemState(document)} />
      </span>
      <span className="flex items-center justify-between text-caption text-text-secondary">
        <span className="flex items-center gap-1.5">
          <DocumentIcon name={type.icon} size={14} /> Tải lên
        </span>
        <span className="font-medium tabular-nums">{time(document.createdAt)}</span>
      </span>
    </Link>
  );
}
