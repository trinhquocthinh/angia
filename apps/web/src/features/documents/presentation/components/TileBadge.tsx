import type { UploadItem } from '../../application/uploadQueue';

const WAITING = 'bg-warning-soft/50 text-warning';
const NEUTRAL = 'bg-accent-soft text-text-secondary';
const BADGES: Record<UploadItem['status'], { label: string; className: string }> = {
  needs_redaction: { label: 'Chưa che', className: WAITING },
  ready: { label: 'Đã che', className: 'bg-accent-soft/60 text-accent' },
  queued: { label: 'Đang chờ', className: NEUTRAL },
  uploading: { label: 'Đang gửi', className: NEUTRAL },
  done: { label: 'Đã gửi', className: 'bg-accent-soft/60 text-accent' },
  failed: { label: 'Gửi lỗi', className: 'bg-danger-soft text-danger' },
  rejected: { label: 'Bị loại', className: 'bg-danger-soft text-danger' },
};

export function TileBadge({ status }: { status: UploadItem['status'] }) {
  const { label, className } = BADGES[status];
  return (
    <span
      className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${className}`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full bg-current ${status === 'uploading' ? 'animate-pulse motion-reduce:animate-none' : ''}`}
      />
      {label}
    </span>
  );
}
