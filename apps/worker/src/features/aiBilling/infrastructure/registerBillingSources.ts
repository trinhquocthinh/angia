import type pg from 'pg';
import type { BillingSource } from '../application/ports.js';
import { billingTransaction, registerBillingSource, STICKY_SQL } from './billingSql.js';
export async function registerBillingSources(pool: pg.Pool, sources: BillingSource[]): Promise<void> {
  try {
    await billingTransaction(pool, async (client) => {
      for (const source of sources) await registerBillingSource(client, source);
      await client.query(
        `UPDATE ai_billing_sources SET status='missing_credential',lease_token=NULL,lease_expires_at=NULL
        WHERE NOT(id=ANY($1::uuid[])) AND status NOT IN ${STICKY_SQL}`,
        [sources.map((source) => source.id)],
      );
    });
  } catch {
    // Đăng ký thất bại dừng khởi động worker; không đưa fingerprint hoặc key trong lỗi PostgreSQL ra log.
    throw new Error('billing_registration_failed');
  }
}
