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
function AiBudgetToggle({
  editing,
  onToggle,
  capUsd,
  save,
}: {
  editing: boolean;
  onToggle: () => void;
  capUsd: number;
  save: Props['save'];
}) {
  return (
    <div className="relative z-10 flex flex-col gap-3">
      <button
        type="button"
        aria-expanded={editing}
        aria-controls="ai-budget-form"
        onClick={onToggle}
        className="inline-flex min-h-btn w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border/45 bg-bg px-4 text-button-secondary font-semibold text-accent transition-colors duration-150 hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <BudgetIcon name="tune" size={18} />
        {editing ? 'Đóng điều chỉnh' : 'Điều chỉnh trần chi phí'}
      </button>
      {editing && (
        <div id="ai-budget-form">
          <AiBudgetForm
            capUsd={capUsd}
            pending={save.isPending}
            saved={save.isSuccess}
            error={save.error}
            onSave={(cap) => save.mutate(cap)}
          />
        </div>
      )}
    </div>
  );
}

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
      className="profile-bento-card relative flex min-w-0 flex-col justify-between gap-4 overflow-hidden p-5 sm:p-6 [&_fieldset]:m-0 [&_fieldset]:grid [&_fieldset]:min-w-0 [&_fieldset]:gap-3.5 [&_fieldset]:border-0 [&_fieldset]:p-0 [&_form]:grid [&_label]:grid [&_label]:gap-1.5 [&_label]:text-caption [&_label]:font-semibold [&_label]:text-text-secondary"
      aria-labelledby="ai-budget-title"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 -bottom-6 h-28 w-28 rounded-full bg-accent/5"
      />
      <div className="relative z-10 flex flex-col gap-4">
        <AiBudgetHeader monthLabel={view?.monthLabel ?? null} />
        {budget.isError ? (
          <p role="alert" className="m-0 rounded-2xl bg-danger-soft px-4 py-3 text-body text-danger">
            {budget.error instanceof AdminRequestError ? budget.error.message : 'Không thể tải ngân sách AI.'}
          </p>
        ) : budget.data && view ? (
          <>
            <AiBudgetActualSummary budget={budget.data} actual={actual} />
            <p className="m-0 flex items-center gap-1.5 text-caption text-text-secondary tabular-nums">
              <BudgetIcon name="clock" />
              Trần hạn mức {view.monthLabel.toLocaleLowerCase('vi')} · Đặt lại vào {view.resetDate}
            </p>
          </>
        ) : (
          <p className="m-0 text-caption text-text-secondary">Đang tải ngân sách…</p>
        )}
      </div>
      {!budget.isError && budget.data && view && (
        <AiBudgetToggle
          editing={editing}
          onToggle={() => setEditing((open) => !open)}
          capUsd={budget.data.monthlyCapUsd}
          save={save}
        />
      )}
    </article>
  );
}
