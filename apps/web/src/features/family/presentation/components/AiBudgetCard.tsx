import { useState } from 'react';
import { AdminRequestError } from '../../application/AdminRequestError';
import { describeAiBudget } from '../../application/aiBudgetView';
import type { useAiBudget } from '../../application/useAiBudget';
import { AiBudgetForm } from './AiBudgetForm';
import { AiBudgetHeader } from './AiBudgetHeader';
import { AiBudgetSummary } from './AiBudgetSummary';
import { BudgetIcon } from './BudgetIcon';

// SPEC-013/BR-018, Stitch f9e3fb04 "Chi phí AI tháng này": Quản trị hệ thống xem chi phí và chỉnh trần toàn hệ thống.
export function AiBudgetCard({ budget, save }: ReturnType<typeof useAiBudget>) {
  const [editing, setEditing] = useState(false);
  const view = budget.data ? describeAiBudget(budget.data) : null;
  return (
    <article
      className="admin-panel min-w-0 bg-white rounded-2xl p-4 sm:p-5 shadow-[0_1px_2px_#0000000d] flex flex-col gap-4 [&_form]:grid [&_fieldset]:grid [&_fieldset]:gap-3 [&_fieldset]:border-0 [&_fieldset]:p-0 [&_fieldset]:m-0 [&_fieldset]:min-w-0 [&_label]:grid [&_label]:gap-[6px] [&_label]:text-[11px] [&_label]:font-semibold [&_label]:text-[#404945] [&_.admin-hint]:text-[11px] [&_.admin-hint]:leading-[18px] [&_.admin-button]:w-full [&_.admin-button]:min-h-10 [&_.admin-button]:text-[12px] admin-reveal"
      aria-labelledby="ai-budget-title"
    >
      <AiBudgetHeader monthLabel={view?.monthLabel ?? null} />
      {budget.isError ? (
        <p role="alert" className="m-0 text-[13px] leading-[20px] text-[#93000a]">
          {budget.error instanceof AdminRequestError ? budget.error.message : 'Không thể tải ngân sách AI.'}
        </p>
      ) : budget.data && view ? (
        <>
          <AiBudgetSummary budget={budget.data} />
          <div className="pt-2 flex flex-col gap-2">
            <p className="m-0 flex items-center gap-1.5 text-[11px] leading-[14px] font-medium tracking-[0.03em] text-[#707975]">
              <BudgetIcon name="clock" />
              Trần hạn mức {view.monthLabel.toLocaleLowerCase('vi')} · Đặt lại vào {view.resetDate}
            </p>
            <button
              type="button"
              aria-expanded={editing}
              aria-controls="ai-budget-form"
              onClick={() => setEditing((open) => !open)}
              className="w-full h-11 px-4 rounded-xl bg-white text-[#131d1d] text-[14px] leading-5 font-semibold shadow-[0_1px_2px_#0000000d] flex items-center justify-center gap-2 cursor-pointer transition-colors duration-150 hover:bg-[#e4f0f0] hover:text-[#004135] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958]"
            >
              <BudgetIcon name="tune" size={18} />
              {editing ? 'Đóng điều chỉnh' : 'Điều chỉnh trần chi phí'}
            </button>
          </div>
          {editing && (
            <div id="ai-budget-form">
              <AiBudgetForm
                capUsd={budget.data.monthlyCapUsd}
                pending={save.isPending}
                saved={save.isSuccess}
                error={save.error}
                onSave={(cap) => save.mutate(cap)}
              />
            </div>
          )}
        </>
      ) : (
        <p className="m-0 text-[13px] leading-[20px] text-[#707975]">Đang tải ngân sách…</p>
      )}
    </article>
  );
}
