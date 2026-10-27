import { randomUUID } from 'node:crypto';
import type pg from 'pg';
import type {
  BillingRepository,
  BillingLease,
  BillingSnapshot,
  BillingStatus,
} from '../application/ports.js';
import { reconcileCounter } from '../domain/reconcileCounter.js';
import { billingTransaction, insertBillingCharge, STICKY_SQL } from './billingSql.js';
import { observeBillingCharge } from './observeBillingCharge.js';
import { registerBillingSources } from './registerBillingSources.js';
interface SourceRow {
  status: string;
  last_counter: string | null;
  credential_fingerprint: string;
  provider: string;
}
const writable = `status NOT IN ${STICKY_SQL} AND status<>'missing_credential'`;
export function createBillingRepository(pool: pg.Pool): BillingRepository {
  return {
    register: (sources) => registerBillingSources(pool, sources),
    claim: async (sourceId) => {
      const token = randomUUID();
      const result = await pool.query<{ last_counter: string | null }>(
        `UPDATE ai_billing_sources SET lease_token=$2,
        lease_expires_at=now()+interval '120 seconds',last_attempt_at=now()
        WHERE id=$1 AND ${writable} AND (lease_expires_at IS NULL OR lease_expires_at<=now()) RETURNING last_counter`,
        [sourceId, token],
      );
      return result.rows[0] ? { sourceId, token, lastCounter: result.rows[0].last_counter } : null;
    },
    finish: (lease, snapshot) =>
      billingTransaction(pool, (client) => finishSnapshot(client, lease, snapshot)),
    fail: async (lease, status) => {
      await pool.query(
        `UPDATE ai_billing_sources SET status=$3,lease_token=NULL,lease_expires_at=NULL
      WHERE id=$1 AND lease_token=$2 AND lease_expires_at>now() AND ${writable}`,
        [lease.sourceId, lease.token, status],
      );
    },
    observe: (source, charge) =>
      billingTransaction(pool, (client) => observeBillingCharge(client, source, charge)),
  };
}
async function finishSnapshot(
  client: pg.PoolClient,
  lease: BillingLease,
  snapshot: BillingSnapshot,
): Promise<void> {
  const row = (
    await client.query<SourceRow>(
      `SELECT * FROM ai_billing_sources WHERE id=$1 AND lease_token=$2
    AND lease_expires_at>now() AND ${writable} FOR UPDATE`,
      [lease.sourceId, lease.token],
    )
  ).rows[0];
  if (!row) return;
  let status: BillingStatus = reconcileCounter(row.last_counter, snapshot.counter, '0');
  for (const charge of status === 'counter_reset' ? [] : snapshot.charges) {
    if ((await insertBillingCharge(client, lease.sourceId, charge)) === 'conflict') {
      status = 'receipt_conflict';
      break;
    }
  }
  if (status !== 'receipt_conflict' && status !== 'counter_reset') {
    const total = (
      await client.query<{ total: string }>(
        'SELECT coalesce(sum(counter_amount),0)::numeric(40,12)::text AS total FROM ai_provider_charges WHERE source_id=$1',
        [lease.sourceId],
      )
    ).rows[0]!.total;
    status = reconcileCounter(row.last_counter, snapshot.counter, total);
  }
  await client.query(
    `UPDATE ai_billing_sources SET status=$3,
    last_counter=CASE WHEN $3 IN ('counter_reset','receipt_conflict') THEN last_counter ELSE $4::numeric END,
    last_complete_at=CASE WHEN $3='complete' THEN now() ELSE last_complete_at END,lease_token=NULL,lease_expires_at=NULL
    WHERE id=$1 AND lease_token=$2`,
    [lease.sourceId, lease.token, status, snapshot.counter],
  );
}
