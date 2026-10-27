import { sql } from 'drizzle-orm';
import type { QuotaTx } from './quotaTypes.js';
import { QuotaRejection } from './quotaRejection.js';
// Membership khóa account trước family; giữ KEY SHARE actor trước mọi khóa quota để tránh đảo thứ tự khi ghi FK audit.
export async function lockQuotaActor(tx: QuotaTx, actorId: string): Promise<void> {
  const result = await tx.execute(sql`SELECT id FROM accounts WHERE id=${actorId} FOR KEY SHARE`);
  if (!result.rows[0]) throw new QuotaRejection('ERR_NOT_FOUND');
}
