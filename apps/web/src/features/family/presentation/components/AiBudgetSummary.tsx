import { describeAiBudget } from '../../application/aiBudgetView';
import type { AiBudget } from '../../application/ports';

export function AiBudgetSummary({ budget }: { budget: AiBudget }) {
  const view = describeAiBudget(budget);
  return (
    <div className="grid gap-2 mt-3">
      <p className="m-0 text-[12px] leading-[18px] text-[#707975]">{view.monthLabel} · giờ Việt Nam</p>
      <p className="m-0 text-[14px] leading-[20px] text-[#131d1d]">
        Đã dùng <strong className="font-semibold">{view.spent}</strong> / {view.cap}
      </p>
      <div
        role="progressbar"
        aria-label="Mức đã dùng so với trần"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={view.percent}
        className="h-2 rounded-full bg-[#deebea] overflow-hidden"
      >
        <div
          className={`h-full rounded-full ${view.exhausted ? 'bg-[#ba1a1a]' : 'bg-[#286958]'}`}
          style={{ width: `${view.percent}%` }}
        />
      </div>
      {view.exhausted && (
        <p
          role="status"
          className="rounded-[12px] py-2 px-3 m-0 text-[12px] leading-[18px] text-[#93000a] bg-[#ffdad6]"
        >
          Đã chạm trần: chứng từ mới sẽ chờ ngân sách (gia đình vẫn nhập tay được).
        </p>
      )}
    </div>
  );
}
