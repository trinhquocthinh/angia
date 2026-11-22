import { eq, sql } from 'drizzle-orm';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { accounts, accountCredentials, sessions } from '@src/shared/db/schema/index.js';
import { writeAdminAuditEvent } from '@src/shared/audit/writeAdminAuditEvent.js';

export async function replaceEmailResetPassword(
  tx: FamilyScopedTx,
  account: { id: string; familyId: string | null },
  passwordHash: string,
  now: Date,
): Promise<void> {
  await tx
    .insert(accountCredentials)
    .values({ accountId: account.id, passwordHash, updatedAt: now })
    .onConflictDoUpdate({
      target: accountCredentials.accountId,
      set: {
        passwordHash,
        credentialVersion: sql`${accountCredentials.credentialVersion} + 1`,
        updatedAt: now,
      },
    });
  await tx
    .update(accounts)
    .set({ mustChangePassword: false, tempPasswordExpiresAt: null })
    .where(eq(accounts.id, account.id));
  await tx.delete(sessions).where(eq(sessions.accountId, account.id));
  await writeAdminAuditEvent(tx, {
    action: 'password_reset_by_email',
    actorAccountId: account.id,
    targetAccountId: account.id,
    ...(account.familyId ? { familyId: account.familyId } : {}),
  });
}
