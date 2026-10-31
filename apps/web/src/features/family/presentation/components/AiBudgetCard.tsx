import type { AiBillingView } from '@angia/contracts';
import { useState } from 'react';
import { AdminRequestError } from '../../application/AdminRequestError';
import { describeAiBudget } from '../../application/aiBudgetView';
import type { useAiBudget } from '../../application/useAiBudget';
import { AiBudgetForm } from './AiBudgetForm';
import { AiBudgetHeader } from './AiBudgetHeader';
import { BudgetIcon } from './BudgetIcon';
import { AiBudgetActualSummary } from './AiBudgetActualSummary';

// SPEC-013/BR-018, Stitch f9e3fb04 "Chi phí AI tháng này": Quản trị hệ thống xem chi phí và chỉnh trần toàn hệ thống.
type Props = ReturnType<typeof useAiBudget> & {
  billing: { data?: AiBillingView | undefined; isError: boolean; isFetching: boolean };
};
export function AiBudgetCard({ budget, save, billing }: Props) {
  const [editing, setEditing] = useState(false);
  const view = budget.data ? describeAiBudget(budget.data) : null;
  const actual =
    !billing.isError &&
    !billing.isFetching &&
    billing.data?.status === 'ready' &&
    billing.data.month === budget.data?.month
      ? billing.data.actualSpendUsd
      : null;
  return (
    <article
      className="admin-panel min-w-0 bg-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col gap-4 [&_form]:grid [&_fieldset]:grid [&_fieldset]:gap-3 [&_fieldset]:border-0 [&_fieldset]:p-0 [&_fieldset]:m-0 [&_fieldset]:min-w-0 [&_label]:grid [&_label]:gap-[6px] [&_label]:text-xs [&_label]:font-semibold [&_label]:text-[#404945] [&_.admin-hint]:text-xs [&_.admin-hint]:leading-[18px] [&_.admin-button]:w-full [&_.admin-button]:bg-[#004135]! [&_.admin-button:hover]:bg-[#20594b]! admin-reveal"
      aria-labelledby="ai-budget-title"
    >
      <AiBudgetHeader monthLabel={view?.monthLabel ?? null} />
      {budget.isError ? (
        <p role="alert" className="m-0 text-[13px] leading-[20px] text-[#93000a]">
          {budget.error instanceof AdminRequestError ? budget.error.message : 'Không thể tải ngân sách AI.'}
        </p>
      ) : budget.data && view ? (
        <>
          <AiBudgetActualSummary budget={budget.data} actual={actual} />
          <div className="flex flex-col gap-2">
            <p className="m-0 flex items-center gap-1.5 text-xs leading-4 text-[#55615f]">
              <BudgetIcon name="clock" />
              Trần hạn mức {view.monthLabel.toLocaleLowerCase('vi')} · Đặt lại vào {view.resetDate}
            </p>
            <button
              type="button"
              aria-expanded={editing}
              aria-controls="ai-budget-form"
              onClick={() => setEditing((open) => !open)}
              className="w-full h-11 px-4 rounded-xl bg-[#e4f0f0] text-[#004135] text-[13px] leading-5 font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors duration-150 hover:bg-[#deebea] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958]"
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
        <p className="m-0 text-[13px] leading-[20px] text-[#55615f]">Đang tải ngân sách…</p>
      )}
    </article>
  );
}
