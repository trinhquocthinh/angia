import { useState } from 'react';
import type { useAdminScanQuota } from '../application/useAdminScanQuota';
import { AdminRequestError } from '@src/features/family/application/AdminRequestError';
import { ScanQuotaHeading } from './ScanQuotaHeading';
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
      className="admin-panel min-w-0 rounded-2xl bg-white p-4 sm:p-5 shadow-sm flex flex-col gap-4 admin-reveal"
    >
      <ScanQuotaHeading month={config.data?.month ?? null} />
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
            onGrant={(input) => saved(state.grant(input))}
          />
        </>
      )}
      <button
        type="button"
        disabled={pending}
        className="min-h-11 w-full cursor-pointer rounded-xl border-0 bg-[#e4f0f0] px-4 py-2 text-[13px] font-semibold text-[#004135] transition-colors enabled:hover:bg-[#deebea] disabled:cursor-wait disabled:opacity-60"
        onClick={() => void reload()}
      >
        Bỏ bản sửa và tải số liệu mới
      </button>
    </article>
  );
}
