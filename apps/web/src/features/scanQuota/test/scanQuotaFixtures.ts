import type { AdminScanQuotaView } from '@angia/contracts';
export const familyId = '00000000-0000-4000-8000-000000000001';
export const quota = {
  month: '2026-10',
  status: 'approved' as const,
  grantedScans: 12,
  usedScans: 2,
  heldScans: 1,
  remainingScans: 9,
  runtimeActive: true as const,
};
export const view: AdminScanQuotaView = {
  month: '2026-10',
  version: 7,
  policy: null,
  monthlyCapUsd: '5.000000000000',
  actualSpendUsd: null,
  billingStatus: 'incomplete',
  committedRemainingScans: '10',
  availableAdditionalScans: null,
  overAllocatedScans: null,
  runtimeActive: true,
  families: [{ familyId, familyName: 'Gia đình A', quota, previousApprovedScans: 8 }],
};
export const grantInput = {
  month: view.month,
  expectedVersion: view.version,
  grants: [{ familyId, status: 'approved' as const, grantedScans: 12, reason: 'Duyệt tháng' }],
};
