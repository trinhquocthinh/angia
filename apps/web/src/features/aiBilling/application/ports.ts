import type { AiBillingView } from '@angia/contracts';

export interface AiBillingRepository {
  get(signal?: AbortSignal): Promise<AiBillingView>;
}
