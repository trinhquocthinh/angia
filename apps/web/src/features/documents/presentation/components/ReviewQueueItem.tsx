import { Link } from '@tanstack/react-router';
import type { SourceDocument } from '../../application/reviewPorts';
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

// E2-S6-T1 chỉ duyệt số đo máy; đơn thuốc/xét nghiệm vẫn hiện trong hàng đợi để không bị "mất".
export function ReviewQueueItem({ document, profileName, active }: ReviewQueueItemProps) {
  const type = TYPES[document.type ?? ''] ?? { title: 'Chứng từ', icon: 'file' as const };
  const ready = document.type === 'device_reading';
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
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${ready ? 'bg-[#b3eddf] text-[#004135]' : 'bg-[#e4f0ef] text-[#55615f]'}`}
        >
          {ready ? 'Đã đọc xong' : 'Duyệt ở bản sau'}
        </span>
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
