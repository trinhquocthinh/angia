import { AdminRequestError } from '../../application/AdminRequestError';
import type { useAiBudget } from '../../application/useAiBudget';
import { AdminIcon } from './AdminIcon';
import { AiBudgetForm } from './AiBudgetForm';
import { AiBudgetSummary } from './AiBudgetSummary';

// SPEC-013/BR-018: Quản trị hệ thống xem chi phí AI tháng này và chỉnh trần áp dụng toàn hệ thống.
export function AiBudgetCard({ budget, save }: ReturnType<typeof useAiBudget>) {
  return (
    <section
      className="admin-panel min-w-0 bg-white rounded-[16px] shadow-[0_1px_2px_#0000000d] [&_h2]:leading-[24px] [&_h2]:font-semibold [&_h2]:m-0 p-5 [&_h2]:text-[16px] [&_form]:grid [&_form]:mt-4 [&_fieldset]:grid [&_fieldset]:gap-3 [&_fieldset]:border-0 [&_fieldset]:p-0 [&_fieldset]:m-0 [&_fieldset]:min-w-0 [&_label]:grid [&_label]:gap-[6px] [&_label]:text-[11px] [&_label]:font-semibold [&_label]:text-[#404945] [&_.admin-hint]:text-[11px] [&_.admin-hint]:leading-[18px] [&_.admin-button]:w-full [&_.admin-button]:min-h-10 [&_.admin-button]:text-[12px] max-[600px]:p-4 admin-reveal"
      aria-labelledby="ai-budget-title"
    >
      <div className="admin-heading-with-count flex items-center gap-2 text-[#286958] [&_h2]:text-[#131d1d]">
        <AdminIcon name="settings" />
        <h2 id="ai-budget-title">Ngân sách AI</h2>
      </div>
      {budget.isError ? (
        <p role="alert" className="mt-3 mb-0 text-[13px] leading-[20px] text-[#93000a]">
          {budget.error instanceof AdminRequestError ? budget.error.message : 'Không thể tải ngân sách AI.'}
        </p>
      ) : budget.data ? (
        <>
          <AiBudgetSummary budget={budget.data} />
          <AiBudgetForm
            capUsd={budget.data.monthlyCapUsd}
            pending={save.isPending}
            saved={save.isSuccess}
            error={save.error}
            onSave={(cap) => save.mutate(cap)}
          />
        </>
      ) : (
        <p className="mt-3 mb-0 text-[13px] leading-[20px] text-[#707975]">Đang tải ngân sách…</p>
      )}
    </section>
  );
}
