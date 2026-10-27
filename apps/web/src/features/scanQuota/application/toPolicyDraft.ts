import type { AdminScanQuotaView } from '@angia/contracts';
import type { PolicyDraft } from './ports';
export function toPolicyDraft(view: AdminScanQuotaView): PolicyDraft {
  const points = view.policy?.reserveBasisPoints;
  const reservePercent =
    points === undefined ? '' : `${Math.floor(points / 100)}.${String(points % 100).padStart(2, '0')}`;
  return {
    month: view.month,
    expectedVersion: view.version,
    estimatedCostPerScanUsd: view.policy?.estimatedCostPerScanUsd ?? '',
    reservePercent,
    trialScans: view.policy ? String(view.policy.trialScans) : '',
  };
}
