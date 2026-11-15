import { eq, sql } from 'drizzle-orm';
import { accountCredentials, pushSubscriptions, sessions } from '@src/shared/db/schema/index.js';
import { withFamilyScope, type FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';

// Caller đã giữ khoá account. Tăng version để snapshot trước hash không sống lại sau unlock.
export async function revokeIdentityAccess(
  tx: FamilyScopedTx,
  accountId: string,
  familyId: string | null,
): Promise<void> {
  await tx
    .update(accountCredentials)
    .set({
      credentialVersion: sql`${accountCredentials.credentialVersion} + 1`,
      updatedAt: sql`now()`,
    })
    .where(eq(accountCredentials.accountId, accountId));
  if (familyId)
    await withFamilyScope(tx, familyId, async (scoped) => {
      await scoped.delete(pushSubscriptions).where(eq(pushSubscriptions.accountId, accountId));
    });
  await tx.delete(sessions).where(eq(sessions.accountId, accountId));
}
