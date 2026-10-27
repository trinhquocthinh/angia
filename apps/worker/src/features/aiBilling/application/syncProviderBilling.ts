import type { BillingReader, BillingRepository, BillingSource } from './ports.js';
export async function syncProviderBilling(
  sources: BillingSource[],
  repository: BillingRepository,
  reader: BillingReader,
): Promise<void> {
  await repository.register(sources);
  for (const source of sources) {
    const lease = await repository.claim(source.id);
    if (!lease) continue;
    try {
      await repository.finish(lease, await reader.read(source));
    } catch (error) {
      await repository.fail(
        lease,
        error instanceof Error && error.message === 'receipt_conflict' ? 'receipt_conflict' : 'error',
      );
    }
  }
}
