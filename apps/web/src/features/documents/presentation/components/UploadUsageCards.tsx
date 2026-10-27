import type { FamilyUsage } from '@angia/contracts';
import type { useFamilyScanQuota } from '@src/features/scanQuota/application/useFamilyScanQuota';
import { FamilyScanQuotaCard } from '@src/features/scanQuota/presentation/FamilyScanQuotaCard';
import { FamilyUsageCard } from './FamilyUsageCard';
export function UploadUsageCards({
  usage,
  scanQuota,
}: {
  usage: FamilyUsage | null;
  scanQuota: ReturnType<typeof useFamilyScanQuota>;
}) {
  return (
    <>
      {usage && <FamilyUsageCard usage={usage} />}
      <FamilyScanQuotaCard
        quota={scanQuota.data ?? null}
        loading={scanQuota.isPending}
        error={scanQuota.isError}
        onRetry={() => void scanQuota.refetch()}
      />
    </>
  );
}
