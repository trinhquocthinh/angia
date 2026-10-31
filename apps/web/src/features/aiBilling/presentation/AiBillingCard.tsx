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
      className="admin-panel min-w-0 max-[1199px]:self-start rounded-2xl bg-white p-4 sm:p-5 shadow-sm flex flex-col gap-4 admin-reveal"
    >
      <AdminCardHeading
        id="ai-billing-title"
        icon={<BudgetIcon name="receipt" size={20} />}
        title="Phí thực từ nhà cung cấp"
      />
      {state.isError && (
        <p role="alert" className="m-0 text-[12px] leading-5 text-[#93000a]">
          Không thể làm mới phí thực. Số đã ghi nhận không xác nhận tổng phí hiện tại.
        </p>
      )}
      {view ? (
        <AiBillingContent view={view} now={new Date()} />
      ) : (
        !state.isError && (
          <p role="status" className="m-0 text-[13px] text-[#55615f]">
            Đang tải phí thực…
          </p>
        )
      )}
      <button
        type="button"
        onClick={() => void state.refetch()}
        disabled={state.isFetching}
        className="min-h-11 w-full cursor-pointer rounded-xl border-0 bg-[#e4f0f0] px-4 text-[13px] font-semibold text-[#004135] transition-colors enabled:hover:bg-[#deebea] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958]"
      >
        {state.isFetching ? 'Đang tải…' : 'Làm mới số liệu'}
      </button>
    </article>
  );
}
