import type { useAdminScanQuota } from '@src/features/scanQuota/application/useAdminScanQuota';
import { ScanQuotaCard } from '@src/features/scanQuota/presentation/ScanQuotaCard';
import type { useAiBilling } from '@src/features/aiBilling/application/useAiBilling';
import type { useAiRouting } from '@src/features/aiRouting/application/useAiRouting';
import type { useAdminWorkspace } from '../../application/useAdminWorkspace';
import type { useAiBudget } from '../../application/useAiBudget';
import { AdminAiPanels } from './AdminAiPanels';
import type { AdminCommand } from '../../application/ports';
import type { AdminTask } from '../AdminTask';
import { AdminLoadError } from './AdminLoadError';
import { AdminLoading } from './AdminLoading';
import { AccountsPanel } from './AccountsPanel';
import { FamilyCards } from './FamilyCards';
import { PendingAccountsCard } from './PendingAccountsCard';
import { FamilyAccessCard } from './FamilyAccessCard';

type AdminDataContentProps = {
  workspace: ReturnType<typeof useAdminWorkspace>;
  aiBudget: ReturnType<typeof useAiBudget>;
  aiRouting: ReturnType<typeof useAiRouting>;
  aiBilling: ReturnType<typeof useAiBilling>;
  scanQuota: ReturnType<typeof useAdminScanQuota>;
  currentAccountId: string;
  onTask: (task: AdminTask) => void;
  accountQuery: string;
  onAccountQuery: (query: string) => void;
  currentFamilyId: string | null;
  onSubmit: (command: AdminCommand) => void;
  inlineError: Error | null;
};

export function AdminDataContent({
  workspace,
  aiBudget,
  aiRouting,
  aiBilling,
  scanQuota,
  currentAccountId,
  onTask,
  accountQuery,
  onAccountQuery,
  currentFamilyId,
  onSubmit,
  inlineError,
}: AdminDataContentProps) {
  const { families, accounts, action } = workspace;
  const error = families.error ?? accounts.error;
  if (error) return <AdminLoadError error={error} families={families} accounts={accounts} />;
  if (!families.isSuccess || !accounts.isSuccess) return <AdminLoading />;
  return (
    <div className="grid grid-cols-[minmax(0,_7fr)_minmax(0,_5fr)] gap-6 [align-items:start] max-[1199px]:grid-cols-[minmax(0,_1fr)]">
      <div className="flex flex-col gap-6 min-w-0">
        <AccountsPanel
          accounts={accounts.data}
          families={families.data}
          pending={action.isPending}
          onTask={onTask}
          search={accountQuery}
          onSearch={onAccountQuery}
        />
        <FamilyCards families={families.data} accounts={accounts.data} currentFamilyId={currentFamilyId} />
        <ScanQuotaCard key={currentAccountId} state={scanQuota} />
        <FamilyAccessCard />
      </div>
      <aside className="flex flex-col gap-6 min-w-0 max-[1199px]:grid max-[1199px]:grid-cols-2 max-[600px]:grid-cols-[minmax(0,1fr)]">
        <PendingAccountsCard
          accounts={accounts.data}
          families={families.data}
          pending={action.isPending}
          error={inlineError}
          onSubmit={onSubmit}
        />
        <AdminAiPanels
          budget={aiBudget}
          billing={aiBilling}
          routing={aiRouting}
          accountId={currentAccountId}
          accounts={accounts.data}
        />
      </aside>
    </div>
  );
}
