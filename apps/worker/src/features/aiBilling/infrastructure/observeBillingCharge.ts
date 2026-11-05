import type pg from 'pg';
import type { BillingSource, ProviderCharge } from '../application/ports.js';
import { insertBillingCharge, registerBillingSource } from './billingSql.js';
import { credentialFingerprint } from './parseBillingSources.js';
export async function observeBillingCharge(
  client: pg.PoolClient,
  source: BillingSource,
  charge: ProviderCharge,
): Promise<void> {
  await registerBillingSource(client, source);
  const row = (
    await client.query<{ status: string; provider: string; credential_fingerprint: string }>(
      'SELECT * FROM ai_billing_sources WHERE id=$1 FOR UPDATE',
      [source.id],
    )
  ).rows[0]!;
  if (
    row.credential_fingerprint !== credentialFingerprint(source) ||
    row.provider !== source.provider ||
    ['counter_reset', 'credential_changed', 'receipt_conflict'].includes(row.status)
  )
    return;
  const result = await insertBillingCharge(client, source.id, charge);
  if (result !== 'duplicate')
    await client.query('UPDATE ai_billing_sources SET status=$2 WHERE id=$1', [
      source.id,
      result === 'conflict' ? 'receipt_conflict' : 'gap',
    ]);
}
