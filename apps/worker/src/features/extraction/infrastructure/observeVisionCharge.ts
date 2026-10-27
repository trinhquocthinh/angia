import { z } from 'zod';
import type { ProviderCharge } from '../../aiBilling/application/ports.js';
import { decimalCost } from '../../aiBilling/infrastructure/parseProviderBilling.js';
export interface VisionBillingObserver {
  observeCharge?: ((charge: ProviderCharge) => Promise<void>) | undefined;
  onBillingObservationError?: ((code: 'billing_observer_failed') => void) | undefined;
}
const metadata = z.object({
  id: z.string().min(1).max(200),
  created: z.number().int().nonnegative().max(253402300799),
  usage: z.object({ cost: z.number().nonnegative() }),
});
export async function observeVisionCharge(value: unknown, observer: VisionBillingObserver): Promise<void> {
  if (!observer.observeCharge) return;
  const parsed = metadata.safeParse(value);
  if (!parsed.success) return;
  try {
    const { id, created, usage } = parsed.data;
    await observer.observeCharge({
      externalId: id,
      chargedAt: new Date(created * 1000),
      counterAmount: decimalCost(usage.cost),
      unitDivisor: '1',
    });
  } catch {
    // Không để việc ghi phí hoặc logger biến thành retry/fallback cho OCR đã trả lời.
    try {
      observer.onBillingObservationError?.('billing_observer_failed');
    } catch {
      /* Bỏ lỗi logger. */
    }
  }
}
