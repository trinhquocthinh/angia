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
      className="rounded-[12px] py-3 px-4 m-0 text-[13px] leading-[20px] text-[#93000a] bg-[#ffdad6]"
      role="alert"
    >
      <p>{error instanceof AdminRequestError ? error.message : 'Không thể tải dữ liệu quản trị.'}</p>
      <button
        type="button"
        className="admin-button inline-flex items-center justify-center gap-2 min-h-11 py-[10px] px-4 border-0 rounded-[12px] bg-[#286958] text-white text-[14px] leading-[20px] font-semibold cursor-pointer shadow-[0_1px_2px_#0000000d] transition-[transform,background-color,box-shadow] duration-[160ms] ease-[ease] [&:hover]:bg-[#004135] [&:hover]:shadow-[0_4px_12px_#0041350f] [&:active]:scale-[0.99] motion-reduce:[&:active]:transform-none admin-button-secondary bg-[#e4f0f0]! text-[#404945]! [&:hover]:bg-[#d9e5e4]!"
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
