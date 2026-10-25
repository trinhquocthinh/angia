import type { ReactNode } from 'react';

type UploadSummaryProps = {
  summary: { preparing: number; ready: number; total: number; done: number; active: number };
};

const Dot = () => <span className="h-1.5 w-1.5 rounded-full bg-[#bfc9c4]" aria-hidden="true" />;
const Part = ({ count, className, children }: { count: number; className: string; children: ReactNode }) =>
  count > 0 ? (
    <>
      <Dot />
      <span className={`text-sm font-semibold ${className}`}>{children}</span>
    </>
  ) : null;

// Dòng tổng hợp phía trên lưới ảnh: số ảnh đã chọn, đang nén, chưa gửi, đã gửi, đang gửi.
export function UploadSummary({ summary }: UploadSummaryProps) {
  return (
    <p className="flex flex-wrap items-center gap-2 text-lg font-bold text-[#131d1d]">
      {summary.total} ảnh đã chọn
      <Part count={summary.preparing} className="text-[#404945]">
        {summary.preparing} đang nén
      </Part>
      <Part count={summary.ready} className="text-[#404945]">
        {summary.ready} chưa gửi
      </Part>
      <Part count={summary.done} className="text-[#286958]">
        {summary.done} đã gửi
      </Part>
      <Part count={summary.active} className="text-[#833b00]">
        {summary.active} đang gửi
      </Part>
    </p>
  );
}
