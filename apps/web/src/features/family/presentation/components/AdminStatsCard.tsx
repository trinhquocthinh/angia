import type { useAdminStats } from '../../application/useAdminStats';
import { RegistrationCardHeading } from './RegistrationCardHeading';
import { AdminStatsSummary } from './AdminStatsSummary';
import { AdminStatsTable } from './AdminStatsTable';
export function AdminStatsCard({ state }: { state: ReturnType<typeof useAdminStats> }) {
  return (
    <article
      aria-label="Thống kê không định danh"
      className="profile-bento-card [&_select:focus-visible]:outline-2 [&_select:focus-visible]:outline-offset-2 [&_select:focus-visible]:outline-focus flex min-w-0 flex-col gap-5 p-5 sm:p-6"
    >
      <RegistrationCardHeading title="Thống kê không định danh" icon="analytics" />
      {state.isError ? (
        <div role="status">
          <p className="m-0 text-body text-text-secondary">Không tải được thống kê. Thử lại.</p>
          <button
            type="button"
            className="rounded-2xl border border-border/45 bg-bg px-4 py-2 text-body text-text-primary disabled:opacity-65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus mt-3 min-h-11"
            onClick={() => void state.refetch()}
          >
            Thử lại
          </button>
        </div>
      ) : state.isPending ? (
        <p role="status" className="m-0 text-body text-text-secondary">
          Đang tải thống kê…
        </p>
      ) : (
        state.data && (
          <>
            {state.data.weeks[0] && <AdminStatsSummary week={state.data.weeks[0]} />}
            <AdminStatsTable weeks={state.data.weeks} />
          </>
        )
      )}
    </article>
  );
}
