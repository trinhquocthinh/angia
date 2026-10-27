import type {
  AdminScanQuotaView,
  FamilyScanQuota,
  GrantScanQuotasRequest,
  UpdateScanQuotaPolicyRequest,
} from '@angia/contracts';
export interface ScanQuotaRepository {
  getAdmin(signal?: AbortSignal): Promise<AdminScanQuotaView>;
  getFamily(signal?: AbortSignal): Promise<FamilyScanQuota>;
  savePolicy(input: UpdateScanQuotaPolicyRequest, csrfToken: string): Promise<AdminScanQuotaView>;
  grant(input: GrantScanQuotasRequest, csrfToken: string): Promise<AdminScanQuotaView>;
}
export interface PolicyDraft {
  month: string;
  expectedVersion: number;
  estimatedCostPerScanUsd: string;
  reservePercent: string;
  trialScans: string;
}
export type PolicyErrors = Partial<Record<keyof PolicyDraft, string>>;
export interface GrantDraft {
  selected: boolean;
  grantedScans: string;
  reason: string;
}
export type GrantDrafts = Record<string, GrantDraft>;
export type GrantErrors = Record<string, string>;
export type QuotaWrite =
  { kind: 'policy'; input: UpdateScanQuotaPolicyRequest } | { kind: 'grant'; input: GrantScanQuotasRequest };
