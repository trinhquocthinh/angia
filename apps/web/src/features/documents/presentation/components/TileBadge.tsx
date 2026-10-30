import type { UploadItem } from '../../application/uploadQueue';

const WAITING = 'bg-[#ffdbc9]/50 text-[#833b00]';
const NEUTRAL = 'bg-[#e4f0f0] text-[#404945]';
const BADGES: Record<UploadItem['status'], { label: string; className: string }> = {
  needs_redaction: { label: 'Chưa che', className: WAITING },
  ready: { label: 'Đã che', className: 'bg-[#aef0da]/60 text-[#004135]' },
  queued: { label: 'Đang chờ', className: NEUTRAL },
  uploading: { label: 'Đang gửi', className: NEUTRAL },
  done: { label: 'Đã gửi', className: 'bg-[#aef0da]/60 text-[#004135]' },
  failed: { label: 'Gửi lỗi', className: 'bg-[#ffdad6] text-[#93000a]' },
  rejected: { label: 'Bị loại', className: 'bg-[#ffdad6] text-[#93000a]' },
};

export function TileBadge({ status }: { status: UploadItem['status'] }) {
  const { label, className } = BADGES[status];
  return (
    <span
      className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full bg-current ${status === 'uploading' ? 'animate-pulse motion-reduce:animate-none' : ''}`}
      />
      {label}
    </span>
  );
}
