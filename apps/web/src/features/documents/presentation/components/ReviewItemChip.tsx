import type { ReviewItemState } from '../../application/reviewQueuePolling';

// Chip trạng thái theo Stitch 626ca318: chữ + chấm màu (không chỉ dựa vào màu); đang xử lý thì chấm nhấp nháy.
const CHIPS: Record<ReviewItemState, { label: string; className: string; dot: string; busy?: boolean }> = {
  preparing: {
    label: 'Đang chuẩn bị ảnh…',
    className: 'bg-[#d9e5e4] text-[#404945]',
    dot: 'bg-[#707975]',
    busy: true,
  },
  reading: {
    label: 'Đang tự động nhận diện…',
    className: 'bg-[#d9e5e4] text-[#404945]',
    dot: 'bg-[#707975]',
    busy: true,
  },
  ready: { label: 'Đã đọc xong', className: 'bg-[#aef0da] text-[#2f6f5e]', dot: 'bg-[#286958]' },
  manual: { label: 'Cần nhập tay', className: 'bg-[#ffdbc9] text-[#753400]', dot: 'bg-[#602900]' },
  budget: {
    label: 'Chờ lượt tự động nhận diện',
    className: 'bg-[#ffdbc9] text-[#753400]',
    dot: 'bg-[#602900]',
  },
};

export function ReviewItemChip({ state }: { state: ReviewItemState }) {
  const chip = CHIPS[state];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${chip.className}`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${chip.dot} ${chip.busy ? 'animate-pulse motion-reduce:animate-none' : ''}`}
      />
      {chip.label}
    </span>
  );
}
