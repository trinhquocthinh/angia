import { sql } from 'drizzle-orm';
import type { ScanQuotaContext } from '../application/ports.js';
import type { QuotaTx } from './quotaTypes.js';
// Chỉ khóa ngân sách; đọc snapshot billing sau khi đã có mọi khóa có thể chờ.
export async function lockQuotaBudget(tx: QuotaTx, month: string, context: ScanQuotaContext): Promise<void> {
  await tx.execute(
    sql`INSERT INTO extraction_spend (month, cap_usd) VALUES (${month}, COALESCE((SELECT cap_usd FROM extraction_spend ORDER BY month DESC LIMIT 1), ${context.defaultMonthlyCapUsd}::numeric)) ON CONFLICT DO NOTHING`,
  );
  await tx.execute(sql`SELECT month FROM extraction_spend WHERE month=${month} FOR UPDATE`);
}
