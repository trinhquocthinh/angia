import type { useAdminWorkspace } from '../../application/useAdminWorkspace';
import type { useAiBudget } from '../../application/useAiBudget';
import { AiBudgetCard } from './AiBudgetCard';
import type { AdminCommand } from '../../application/ports';
import type { AdminTask } from '../AdminTask';
import { AdminLoadError } from './AdminLoadError';
import { AdminLoading } from './AdminLoading';
import { AccountsPanel } from './AccountsPanel';
import { FamilyCards } from './FamilyCards';
import { PendingAccountsCard } from './PendingAccountsCard';
import { FamilyAccessCard } from './FamilyAccessCard';

export function AdminDataContent({
  workspace,
  aiBudget,
  onTask,
  currentFamilyId,
  onSubmit,
  inlineError,
}: {
  workspace: ReturnType<typeof useAdminWorkspace>;
  aiBudget: ReturnType<typeof useAiBudget>;
  onTask: (task: AdminTask) => void;
  currentFamilyId: string | null;
  onSubmit: (command: AdminCommand) => void;
  inlineError: Error | null;
}) {
  const { families, accounts, action } = workspace;
  const error = families.error ?? accounts.error;
  if (error) return <AdminLoadError error={error} families={families} accounts={accounts} />;
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
      <aside className="flex flex-col gap-6 min-w-0 max-[1199px]:grid max-[1199px]:grid-cols-2 max-[600px]:grid-cols-[minmax(0,1fr)]">
        <PendingAccountsCard
          accounts={accounts.data}
          families={families.data}
          pending={action.isPending}
          error={inlineError}
          onSubmit={onSubmit}
        />
        <AiBudgetCard {...aiBudget} />
        <FamilyAccessCard />
      </aside>
    </div>
  );
}
