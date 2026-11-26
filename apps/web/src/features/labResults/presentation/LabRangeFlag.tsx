import type { RangeFlag } from '../application/compareToPrintedRange';

const labels: Record<Exclude<RangeFlag, null>, string> = {
  above: '↑ Trên khoảng in trên phiếu',
  below: '↓ Dưới khoảng in trên phiếu',
};

// Chip trung tính hoàn toàn (BR-033, E30-S3-T2 không màu đánh giá): chỉ nói vị trí so với khoảng in trên phiếu.
export function LabRangeFlag({ flag }: { flag: Exclude<RangeFlag, null> }) {
  return (
    <span className="inline-flex self-end rounded-full border border-border/55 bg-surface px-3 py-0.5 text-caption font-semibold text-text-secondary">
      {labels[flag]}
    </span>
  );
}
