import { sql } from 'drizzle-orm';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { PushActor } from '../application/ports.js';

// Chung khóa dòng account với logout, quản trị gia đình và đồng bộ IdP.
export async function lockPushAccount(tx: FamilyScopedTx, actor: PushActor): Promise<boolean> {
  const result = await tx.execute(sql`SELECT id FROM accounts
    WHERE id=${actor.accountId} AND family_id=${actor.familyId} FOR UPDATE`);
  return result.rows.length > 0;
}
