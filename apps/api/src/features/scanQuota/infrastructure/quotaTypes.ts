import type { ScanQuotaPolicy } from '@angia/contracts';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
export type QuotaTx = FamilyScopedTx;
export interface QuotaState {
  version: number;
  policy: ScanQuotaPolicy | null;
  committed: string;
}
export interface QuotaRow extends Record<string, unknown> {
  status: 'trial' | 'approved';
  granted_scans: string;
  used_scans: string;
  held_scans: string;
}
