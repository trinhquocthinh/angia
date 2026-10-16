import { createPortal } from 'react-dom';
import type { VisitSummary } from '@angia/contracts';
import { SummarySheet } from './SummarySheet';
import { useFitScale } from './useFitScale';

const A4_WIDTH = 794;

// Xem trước đúng tỷ lệ A4 (Design Web §6) và bản sao để in: lệnh in chỉ in bản sao gắn thẳng vào body,
// không kèm sidebar/đầu trang; bản sao ẩn với trình đọc màn hình để không đọc trùng.
export function SummaryPreview({ summary }: { summary: VisitSummary }) {
  const { frame, page, scale, height } = useFitScale(A4_WIDTH);
  return (
    <>
      <div ref={frame} className="flex items-start justify-center overflow-hidden" style={{ height }}>
        <div
          ref={page}
          className="shrink-0"
          style={{ width: A4_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top center' }}
        >
          <SummarySheet summary={summary} />
        </div>
      </div>
      {createPortal(
        <div className="summary-print-root" aria-hidden="true">
          <SummarySheet summary={summary} />
        </div>,
        document.body,
      )}
    </>
  );
}
