import { eq } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { accounts } from '@src/shared/db/schema/index.js';

// Cùng khoá account với cấp phiên, Push và thu hồi; nhận transaction ngoài cho use case/audit.
export async function withLockedIdentityAccount(
  db: Pick<Database, 'transaction'>,
  accountId: string,
  work: (tx: FamilyScopedTx, familyId: string | null) => Promise<void>,
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [account] = await tx
      .select({ familyId: accounts.familyId })
      .from(accounts)
      .where(eq(accounts.id, accountId))
      .for('update');
    if (!account) return false;
    await work(tx, account.familyId);
    return true;
  });
}
