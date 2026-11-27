import { AdminStatsCard } from './AdminStatsCard';
import { AdminAuditCard } from './AdminAuditCard';
import type { useAdminStats } from '../../application/useAdminStats';
import type { useAdminAuditEvents } from '../../application/useAdminAuditEvents';
import { RegistrationSwitchCard } from './RegistrationSwitchCard';
import { FoundingInvitationsCard } from './FoundingInvitationsCard';
import type { useRegistrationSwitch } from '../../application/useRegistrationSwitch';
import type { useFoundingInvitations } from '../../application/useFoundingInvitations';
import type { useAdminScanQuota } from '@src/features/scanQuota/application/useAdminScanQuota';
import { ScanQuotaCard } from '@src/features/scanQuota/presentation/ScanQuotaCard';
import type { useAiBilling } from '@src/features/aiBilling/application/useAiBilling';
import { AiBillingCard } from '@src/features/aiBilling/presentation/AiBillingCard';
import type { useAiRouting } from '@src/features/aiRouting/application/useAiRouting';
import { AiRoutingCard } from '@src/features/aiRouting/presentation/AiRoutingCard';
import type { useAdminWorkspace } from '../../application/useAdminWorkspace';
import type { useAiBudget } from '../../application/useAiBudget';
import type { AdminCommand } from '../../application/ports';
import type { AdminTask } from '../AdminTask';
import { AdminLoadError } from './AdminLoadError';
import { AdminLoading } from './AdminLoading';
import { AccountsPanel } from './AccountsPanel';
import { AiBudgetCard } from './AiBudgetCard';
import { FamilyCards } from './FamilyCards';
import { ProfileLinksCard } from './ProfileLinksCard';
import { PendingAccountsCard } from './PendingAccountsCard';
import { FamilyAccessCard } from './FamilyAccessCard';

type AdminDataContentProps = {
  reporting: { stats: ReturnType<typeof useAdminStats>; audit: ReturnType<typeof useAdminAuditEvents> };
  registrationSwitch: ReturnType<typeof useRegistrationSwitch>;
  foundingInvitations: ReturnType<typeof useFoundingInvitations>;
  workspace: ReturnType<typeof useAdminWorkspace>;
  aiBudget: ReturnType<typeof useAiBudget>;
  aiRouting: ReturnType<typeof useAiRouting>;
  aiBilling: ReturnType<typeof useAiBilling>;
  scanQuota: ReturnType<typeof useAdminScanQuota>;
  currentAccountId: string;
  csrfToken: string;
  onTask: (task: AdminTask) => void;
  accountQuery: string;
  onAccountQuery: (query: string) => void;
  currentFamilyId: string | null;
  onSubmit: (command: AdminCommand) => void;
  inlineError: Error | null;
};

export function AdminDataContent(props: AdminDataContentProps) {
  const { workspace, aiBudget, aiRouting, aiBilling, scanQuota, currentAccountId, csrfToken } = props;
  const { families, accounts, action } = workspace;
  const error = families.error ?? accounts.error;
  if (error) return <AdminLoadError error={error} families={families} accounts={accounts} />;
  if (!families.isSuccess || !accounts.isSuccess) return <AdminLoading />;
  const updatedByName =
    accounts.data.find((account) => account.id === aiRouting.config.data?.updatedBy)?.displayName ?? null;
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section
        aria-label="Tài nguyên và chờ xử lý"
        className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
      >
        <AiBudgetCard {...aiBudget} billing={aiBilling} />
        <AiBillingCard state={aiBilling} />
        <PendingAccountsCard
          accounts={accounts.data}
          families={families.data}
          pending={action.isPending}
          error={props.inlineError}
          onSubmit={props.onSubmit}
        />
      </section>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-8">
          <RegistrationSwitchCard {...props.registrationSwitch} />
          <FoundingInvitationsCard {...props.foundingInvitations} />
          <AccountsPanel
            accounts={accounts.data}
            families={families.data}
            pending={action.isPending}
            onTask={props.onTask}
            search={props.accountQuery}
            onSearch={props.onAccountQuery}
          />
          <FamilyCards
            families={families.data}
            accounts={accounts.data}
            currentFamilyId={props.currentFamilyId}
          />
          <ScanQuotaCard key={currentAccountId} state={scanQuota} />
          <AdminStatsCard state={props.reporting.stats} />
          <AdminAuditCard key={currentAccountId} state={props.reporting.audit} />
        </div>
        <aside className="flex min-w-0 flex-col gap-6 lg:col-span-4">
          <AiRoutingCard key={currentAccountId} state={aiRouting} updatedByName={updatedByName} />
          <ProfileLinksCard families={families.data} accounts={accounts.data} csrfToken={csrfToken} />
          <FamilyAccessCard />
        </aside>
      </div>
    </div>
  );
}
