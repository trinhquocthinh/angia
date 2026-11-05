import type { AiBillingView } from '@angia/contracts';

export type AiBillingSource = AiBillingView['sources'][number];
interface AiBillingSnapshot {
  confirmedSpendUsd: string;
  sources: AiBillingSource[];
}
export interface AiBillingRepository {
  readMonth(month: string): Promise<AiBillingSnapshot>;
}
export interface AiBillingDependencies {
  repository: AiBillingRepository;
  now(): Date;
}
