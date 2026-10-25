import type { RangeFlag } from '../application/compareToPrintedRange';

const labels: Record<Exclude<RangeFlag, null>, string> = {
  above: '↑ Trên khoảng in trên phiếu',
  below: '↓ Dưới khoảng in trên phiếu',
};

// Chip trung tính một màu (BR-033 làm rõ 2026-10-25): chỉ nói vị trí so với khoảng in trên phiếu.
export function LabRangeFlag({ flag }: { flag: Exclude<RangeFlag, null> }) {
  return (
    <span className="inline-flex self-end rounded-full bg-[#fff4e5] px-2.5 py-0.5 text-xs font-semibold text-[#B54708]">
      {labels[flag]}
    </span>
  );
}
