import type pg from 'pg';
import type { BillingSource, ProviderCharge } from '../application/ports.js';
import { credentialFingerprint } from './parseBillingSources.js';
export const STICKY_SQL = "('counter_reset','credential_changed','receipt_conflict')";
export async function registerBillingSource(client: pg.PoolClient, source: BillingSource): Promise<void> {
  await client.query(
    `INSERT INTO ai_billing_sources(id,provider,credential_fingerprint) VALUES($1,$2,$3)
    ON CONFLICT(id) DO UPDATE SET status=CASE
      WHEN ai_billing_sources.status IN ${STICKY_SQL} THEN ai_billing_sources.status
      WHEN ai_billing_sources.provider<>excluded.provider OR ai_billing_sources.credential_fingerprint<>excluded.credential_fingerprint THEN 'credential_changed'
      WHEN ai_billing_sources.status='missing_credential' THEN 'unverified'
      ELSE ai_billing_sources.status END`,
    [source.id, source.provider, credentialFingerprint(source)],
  );
}
export async function insertBillingCharge(
  client: pg.PoolClient,
  sourceId: string,
  charge: ProviderCharge,
): Promise<'inserted' | 'duplicate' | 'conflict'> {
  const params = [sourceId, charge.externalId, charge.chargedAt, charge.counterAmount, charge.unitDivisor];
  const insert = await client.query(
    `INSERT INTO ai_provider_charges(source_id,external_id,charged_at,counter_amount,unit_divisor)
    VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
    params,
  );
  if (insert.rowCount) return 'inserted';
  const same = await client.query(
    `SELECT 1 FROM ai_provider_charges WHERE source_id=$1 AND external_id=$2
    AND charged_at=$3 AND counter_amount=$4 AND unit_divisor=$5`,
    params,
  );
  return same.rowCount ? 'duplicate' : 'conflict';
}
export async function billingTransaction<T>(
  pool: pg.Pool,
  action: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const value = await action(client);
    await client.query('COMMIT');
    return value;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
