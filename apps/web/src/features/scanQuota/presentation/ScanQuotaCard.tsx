import { useState } from 'react';
import type { useAdminScanQuota } from '../application/useAdminScanQuota';
import { AdminRequestError } from '@src/features/family/application/AdminRequestError';
import { ScanQuotaOverview } from './ScanQuotaOverview';
import { ScanQuotaEditor } from './ScanQuotaEditor';
export function ScanQuotaCard({ state }: { state: ReturnType<typeof useAdminScanQuota> }) {
  const [revision, setRevision] = useState(0);
  const { config, mutation } = state;
  const pending = mutation.isPending || config.isFetching;
  const reload = async () => {
    if (pending) return;
    const result = await config.refetch();
    if (result.isSuccess) {
      setRevision((value) => value + 1);
      mutation.reset();
    }
  };
  const saved = async (promise: Promise<unknown>) => {
    await promise;
    setRevision((value) => value + 1);
  };
  return (
    <article
      aria-labelledby="scan-quota-title"
      aria-busy={pending}
      className="admin-panel min-w-0 self-start rounded-2xl bg-white p-4 sm:p-5 shadow-[0_1px_2px_#0000000d] flex flex-col gap-4 admin-reveal"
    >
      <h2 id="scan-quota-title" className="m-0 text-[18px] leading-6 font-semibold text-[#131d1d]">
        Hạn mức lượt nhận diện
      </h2>
      {config.isError && (
        <p role="alert" className="m-0 text-[12px] text-[#93000a]">
          {config.error instanceof AdminRequestError
            ? config.error.message
            : 'Không thể tải hạn mức lượt. Bản đang sửa vẫn được giữ lại.'}
        </p>
      )}
      {!config.data && !config.isError && <p role="status">Đang tải hạn mức lượt…</p>}
      {config.data && (
        <>
          {!config.isError && <ScanQuotaOverview view={config.data} />}
          <ScanQuotaEditor
            key={revision}
            initial={config.data}
            pending={pending}
            error={mutation.error}
            saved={mutation.isSuccess}
            onPolicy={(input) => saved(state.savePolicy(input))}
            onGrant={(input) => saved(state.grant(input))}
          />
        </>
      )}
      <button
        type="button"
        disabled={pending}
        className="admin-button min-h-10 w-full rounded-xl border-0 bg-[#286958] px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-[#004135] disabled:cursor-wait disabled:opacity-60"
        onClick={() => void reload()}
      >
        Bỏ bản sửa và tải bản mới / tháng hiện tại
      </button>
    </article>
  );
}
