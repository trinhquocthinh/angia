import type { AdminScanQuotaView, FamilyScanQuota, GrantScanQuotasRequest } from '@angia/contracts';
export interface ScanQuotaRepository {
  getAdmin(signal?: AbortSignal): Promise<AdminScanQuotaView>;
  getFamily(signal?: AbortSignal): Promise<FamilyScanQuota>;
  grant(input: GrantScanQuotasRequest, csrfToken: string): Promise<AdminScanQuotaView>;
}
export interface GrantDraft {
  selected: boolean;
  grantedScans: string;
  reason: string;
}
export type GrantDrafts = Record<string, GrantDraft>;
export type GrantErrors = Record<string, string>;
export type QuotaWrite = { input: GrantScanQuotasRequest };
