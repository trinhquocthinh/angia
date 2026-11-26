import { AdminCardHeading } from '@src/features/family/presentation/components/AdminCardHeading';
import { BudgetIcon } from '@src/features/family/presentation/components/BudgetIcon';
import type { useAiBilling } from '../application/useAiBilling';
import { AiBillingContent } from './AiBillingContent';

export function AiBillingCard({ state }: { state: ReturnType<typeof useAiBilling> }) {
  const view =
    state.isError && state.data
      ? { ...state.data, status: 'incomplete' as const, actualSpendUsd: null }
      : state.data;
  return (
    <article
      aria-labelledby="ai-billing-title"
      aria-busy={state.isFetching}
      className="profile-bento-card relative flex min-w-0 flex-col justify-between gap-4 overflow-hidden p-5 sm:p-6"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 -bottom-6 h-28 w-28 rounded-full bg-secondary/10"
      />
      <div className="relative z-10 flex flex-col gap-4">
        <AdminCardHeading
          id="ai-billing-title"
          icon={<BudgetIcon name="receipt" size={20} />}
          title="Phí thực từ nhà cung cấp"
        />
        {state.isError && (
          <p role="alert" className="m-0 rounded-2xl bg-danger-soft px-4 py-3 text-body text-danger">
            Không thể làm mới phí thực. Số đã ghi nhận không xác nhận tổng phí hiện tại.
          </p>
        )}
        {view ? (
          <AiBillingContent view={view} now={new Date()} />
        ) : (
          !state.isError && (
            <p role="status" className="m-0 text-caption text-text-secondary">
              Đang tải phí thực…
            </p>
          )
        )}
      </div>
      <button
        type="button"
        onClick={() => void state.refetch()}
        disabled={state.isFetching}
        className="relative z-10 min-h-btn w-full cursor-pointer rounded-2xl border border-border/45 bg-bg px-4 text-button-secondary font-semibold text-accent transition-colors enabled:hover:bg-accent-soft disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        {state.isFetching ? 'Đang tải…' : 'Làm mới số liệu'}
      </button>
    </article>
  );
}
