import { BudgetIcon } from './BudgetIcon';

export function AiBudgetHeader({ monthLabel }: { monthLabel: string | null }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex flex-col min-w-0">
        <span className="flex items-center gap-1 text-[11px] leading-[14px] font-semibold uppercase tracking-wider text-[#286958]">
          <BudgetIcon name="ai" />
          Kiểm soát ngân sách AI
        </span>
        <h2 id="ai-budget-title" className="mt-0.5 text-[18px] leading-6 font-semibold text-[#131d1d]">
          Chi phí AI tháng này
        </h2>
        <p className="mt-0.5 mb-0 text-[13px] leading-5 text-[#707975]">
          Trích xuất OCR y tế &amp; đọc đơn thuốc AI
        </p>
      </div>
      {monthLabel && (
        <span className="inline-flex shrink-0 items-center px-2 py-0.5 rounded bg-[#e4f0f0] text-[#404945] text-[11px] leading-[14px] font-medium">
          {monthLabel}
        </span>
      )}
    </div>
  );
}
