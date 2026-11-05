import type { FamilyUsage } from '@angia/contracts';
import type { useFamilyScanQuota } from '@src/features/scanQuota/application/useFamilyScanQuota';
import { FamilyScanQuotaSummary } from '@src/features/scanQuota/presentation/FamilyScanQuotaSummary';
import { FamilyUsageCard } from './FamilyUsageCard';
export function UploadUsageCards({
  usage,
  scanQuota,
}: {
  usage: FamilyUsage | null;
  scanQuota: ReturnType<typeof useFamilyScanQuota>;
}) {
  return (
    <FamilyUsageCard usage={usage} scanQuota={scanQuota.data ?? null}>
      <FamilyScanQuotaSummary
        quota={scanQuota.data ?? null}
        loading={scanQuota.isPending}
        error={scanQuota.isError}
        onRetry={() => void scanQuota.refetch()}
      />
    </FamilyUsageCard>
  );
}
