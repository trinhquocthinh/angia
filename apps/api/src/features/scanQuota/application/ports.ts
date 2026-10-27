import type {
  AdminScanQuotaView,
  FamilyScanQuota,
  GrantScanQuotasRequest,
  UpdateScanQuotaPolicyRequest,
} from '@angia/contracts';
export type ScanQuotaError =
  'ERR_NOT_FOUND' | 'ERR_SCAN_QUOTA_CONFLICT' | 'ERR_SCAN_QUOTA_UNAVAILABLE' | 'ERR_SCAN_QUOTA_DECREASE';
export type ScanQuotaOutcome = { ok: true; view: AdminScanQuotaView } | { ok: false; code: ScanQuotaError };
export interface ScanQuotaContext {
  now: Date;
  recheckNow?(): Date;
  defaultMonthlyCapUsd: number;
}
export interface ScanQuotaRepository {
  readAdmin(context: ScanQuotaContext): Promise<AdminScanQuotaView>;
  readFamily(familyId: string, now: Date): Promise<FamilyScanQuota>;
  updatePolicy(
    request: UpdateScanQuotaPolicyRequest,
    actorId: string,
    context: ScanQuotaContext,
  ): Promise<ScanQuotaOutcome>;
  grant(
    request: GrantScanQuotasRequest,
    actorId: string,
    context: ScanQuotaContext,
  ): Promise<ScanQuotaOutcome>;
}
export interface ScanQuotaDependencies {
  repository: ScanQuotaRepository;
  now(): Date;
  defaultMonthlyCapUsd: number;
}
