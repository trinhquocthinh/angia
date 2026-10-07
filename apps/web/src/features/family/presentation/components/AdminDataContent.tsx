import { AdminRequestError } from '../../application/AdminRequestError';
import type { useAdminWorkspace } from '../../application/useAdminWorkspace';
import type { AdminCommand } from '../../application/ports';
import type { AdminTask } from '../AdminTask';
import { AdminLoading } from './AdminLoading';
import { AccountsPanel } from './AccountsPanel';
import { FamilyCards } from './FamilyCards';
import { PendingAccountsCard } from './PendingAccountsCard';
import { FamilyAccessCard } from './FamilyAccessCard';

export function AdminDataContent({
  workspace,
  onTask,
  currentFamilyId,
  onSubmit,
  inlineError,
}: {
  workspace: ReturnType<typeof useAdminWorkspace>;
  onTask: (task: AdminTask) => void;
  currentFamilyId: string | null;
  onSubmit: (command: AdminCommand) => void;
  inlineError: Error | null;
}) {
  const { families, accounts, action } = workspace;
  const error = families.error ?? accounts.error;
  if (error)
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
  if (!families.isSuccess || !accounts.isSuccess) return <AdminLoading />;
  return (
    <div className="grid grid-cols-[minmax(0,_760px)_minmax(280px,_1fr)] gap-6 [align-items:start] max-[1199px]:grid-cols-[minmax(0,_1fr)]">
      <div className="flex flex-col gap-6 min-w-0">
        <AccountsPanel
          accounts={accounts.data}
          families={families.data}
          pending={action.isPending}
          onTask={onTask}
        />
        <FamilyCards families={families.data} accounts={accounts.data} currentFamilyId={currentFamilyId} />
      </div>
      <aside className="flex flex-col gap-6 min-w-0 max-[1199px]:grid max-[1199px]:grid-cols-[repeat(2,_minmax(0,_1fr))] max-[600px]:grid-cols-[minmax(0,_1fr)]">
        <PendingAccountsCard
          accounts={accounts.data}
          families={families.data}
          pending={action.isPending}
          error={inlineError}
          onSubmit={onSubmit}
        />
        <FamilyAccessCard />
      </aside>
    </div>
  );
}
