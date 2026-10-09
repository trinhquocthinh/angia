import type { ReviewItemState } from '../../application/reviewQueuePolling';

const CHIPS: Record<ReviewItemState, { label: string; className: string }> = {
  preparing: { label: 'Đang chuẩn bị ảnh…', className: 'bg-[#fff4e5] text-[#5c3a00]' },
  privacy: { label: 'Chờ kiểm tra riêng tư', className: 'bg-[#e4f0ef] text-[#55615f]' },
  reading: { label: 'AI đang đọc…', className: 'bg-[#fff4e5] text-[#5c3a00]' },
  ready: { label: 'Đã đọc xong', className: 'bg-[#b3eddf] text-[#004135]' },
  manual: { label: 'Cần nhập tay', className: 'bg-[#e4f0ef] text-[#55615f]' },
};

export function ReviewItemChip({ state }: { state: ReviewItemState }) {
  const chip = CHIPS[state];
  return (
    <span
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${chip.className}`}
    >
      {state === 'reading' && (
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-current motion-reduce:animate-none"
        />
      )}
      {chip.label}
    </span>
  );
}
