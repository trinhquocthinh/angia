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
      className="profile-bento-card flex flex-col items-start gap-3 border border-danger/20 bg-danger-soft p-6 text-caption text-danger"
      role="alert"
    >
      <p className="m-0 text-body font-medium">
        {error instanceof AdminRequestError ? error.message : 'Không thể tải dữ liệu quản trị.'}
      </p>
      <button
        type="button"
        className="inline-flex min-h-btn cursor-pointer items-center justify-center rounded-2xl border border-border/45 bg-surface px-5 text-button-secondary font-semibold text-accent shadow-2xs transition-colors hover:bg-accent-soft"
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
