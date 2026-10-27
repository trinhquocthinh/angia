import type { useAdminScanQuota } from '@src/features/scanQuota/application/useAdminScanQuota';
import { ScanQuotaCard } from '@src/features/scanQuota/presentation/ScanQuotaCard';
import type { useAiBilling } from '@src/features/aiBilling/application/useAiBilling';
import { AiBillingCard } from '@src/features/aiBilling/presentation/AiBillingCard';
import type { useAiRouting } from '@src/features/aiRouting/application/useAiRouting';
import { AiRoutingCard } from '@src/features/aiRouting/presentation/AiRoutingCard';
import type { useAiBudget } from '../../application/useAiBudget';
import { AiBudgetCard } from './AiBudgetCard';

export function AdminAiPanels({
  budget,
  billing,
  routing,
  scanQuota,
  accountId,
  accounts,
}: {
  budget: ReturnType<typeof useAiBudget>;
  billing: ReturnType<typeof useAiBilling>;
  routing: ReturnType<typeof useAiRouting>;
  scanQuota: ReturnType<typeof useAdminScanQuota>;
  accountId: string;
  accounts: { id: string; displayName: string }[];
}) {
  return (
    <>
      <ScanQuotaCard key={accountId} state={scanQuota} />
      <AiBudgetCard {...budget} billing={billing} />
      <AiBillingCard state={billing} />
      <AiRoutingCard
        key={accountId}
        state={routing}
        updatedByName={
          accounts.find((account) => account.id === routing.config.data?.updatedBy)?.displayName ?? null
        }
      />
    </>
  );
}
