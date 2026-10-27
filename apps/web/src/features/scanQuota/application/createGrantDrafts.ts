import type { AdminScanQuotaView } from '@angia/contracts';
import type { GrantDrafts } from './ports';
export function createGrantDrafts(view: AdminScanQuotaView): GrantDrafts {
  return Object.fromEntries(
    view.families.map((family) => [
      family.familyId,
      {
        selected: false,
        grantedScans: String(Math.max(family.quota.grantedScans, family.previousApprovedScans ?? 0)),
        reason: '',
      },
    ]),
  );
}
