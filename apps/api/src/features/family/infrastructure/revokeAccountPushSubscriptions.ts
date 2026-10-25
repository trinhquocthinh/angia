import { eq } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { accounts, pushSubscriptions } from '@src/shared/db/schema/index.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';

// Gọi trong transaction quản trị đang giữ khóa account; nested transaction không dùng owner/BYPASSRLS.
export async function revokeAccountPushSubscriptions(
  tx: Pick<Database, 'select' | 'transaction'>,
  accountId: string,
): Promise<void> {
  const [account] = await tx
    .select({ familyId: accounts.familyId })
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .for('update');
  if (!account?.familyId) return;
  await withFamilyScope(tx, account.familyId, async (scoped) => {
    await scoped.delete(pushSubscriptions).where(eq(pushSubscriptions.accountId, accountId));
  });
}
