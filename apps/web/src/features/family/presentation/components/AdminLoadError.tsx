import { AdminRequestError } from '../../application/AdminRequestError';
import type { useAdminWorkspace } from '../../application/useAdminWorkspace';

type Workspace = ReturnType<typeof useAdminWorkspace>;

export function AdminLoadError({
  error,
  families,
  accounts,
}: {
  error: Error;
  families: Workspace['families'];
  accounts: Workspace['accounts'];
}) {
  return (
    <div
      className="rounded-[12px] py-3 px-4 m-0 text-[13px] leading-[20px] text-danger bg-danger-soft"
      role="alert"
    >
      <p>{error instanceof AdminRequestError ? error.message : 'Không thể tải dữ liệu quản trị.'}</p>
      <button
        type="button"
        className="admin-button inline-flex items-center justify-center gap-2 min-h-11 py-[10px] px-4 border-0 rounded-[12px] bg-accent text-on-accent text-[14px] leading-[20px] font-semibold cursor-pointer shadow-[0_1px_2px_color-mix(in_srgb,var(--color-shadow)_5%,transparent)] transition-[transform,background-color,box-shadow] duration-[160ms] ease-[ease] [&:hover]:bg-accent [&:hover]:shadow-[0_4px_12px_color-mix(in_srgb,var(--color-shadow)_6%,transparent)] [&:active]:scale-[0.99] motion-reduce:[&:active]:transform-none admin-button-secondary bg-accent-soft! text-text-secondary! [&:hover]:bg-border!"
        disabled={families.isFetching || accounts.isFetching}
        onClick={() => {
          void families.refetch();
          void accounts.refetch();
        }}
      >
        Thử lại
      </button>
    </div>
  );
}
