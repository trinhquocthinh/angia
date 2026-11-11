import { describeAiBudget } from '../../application/aiBudgetView';
import type { AiBudget } from '../../application/ports';

const BAR = { normal: 'bg-text-secondary', warning: 'bg-warning', exhausted: 'bg-danger' } as const;

// Stitch f9e3fb04 "Chi phí AI tháng này": số lớn tabular, thanh trung tính, chỉ đổi màu từ 90% định mức.
export function AiBudgetSummary({ budget }: { budget: AiBudget }) {
  const view = describeAiBudget(budget);
  return (
    <div className="flex flex-col gap-1.5 pt-1">
      <p className="m-0 flex items-baseline gap-2 flex-wrap">
        <span className="font-['Newsreader',Georgia,serif] text-[34px] leading-tight font-semibold text-text-primary tabular-nums tracking-tight">
          {view.spent}
        </span>
        <span className="font-['Newsreader',Georgia,serif] text-[20px] leading-7 font-semibold text-text-secondary tabular-nums">
          / {view.cap} USD
        </span>
      </p>
      <div className="flex items-center justify-between gap-2 text-[11px] leading-[14px] font-medium tracking-[0.03em] text-text-secondary">
        <span>Đã dùng {view.percentLabel} định mức</span>
        <span className="text-accent font-semibold">Còn lại {view.remaining} USD</span>
      </div>
      <div
        role="progressbar"
        aria-label="Mức đã dùng so với trần"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={view.percent}
        className="w-full h-2.5 rounded-full bg-accent-soft overflow-hidden mt-1"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none ${BAR[view.level]}`}
          style={{ width: `${view.percent}%` }}
        />
      </div>
      {view.level === 'exhausted' && (
        <p
          role="status"
          className="rounded-[12px] py-2 px-3 mt-1 mb-0 text-[12px] leading-[18px] text-danger bg-danger-soft"
        >
          Đã chạm trần: chứng từ mới sẽ chờ ngân sách (gia đình vẫn nhập tay được).
        </p>
      )}
    </div>
  );
}
