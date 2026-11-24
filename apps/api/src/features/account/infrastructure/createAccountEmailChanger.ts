import { and, eq } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { accounts, accountCredentials, sessions } from '@src/shared/db/schema/index.js';
import type { AccountEmails } from '../application/ports.js';

export function createAccountEmailChanger(db: Database): AccountEmails['change'] {
  return (input) =>
    db.transaction(async (tx) => {
      const [account] = await tx
        .select()
        .from(accounts)
        .where(eq(accounts.id, input.accountId))
        .for('update');
      if (!account) return { ok: false, code: 'ERR_INVALID_CREDENTIALS' };
      if (account.lockedAt !== null) return { ok: false, code: 'ERR_ACCOUNT_LOCKED' };
      const [credential] = await tx
        .select({ version: accountCredentials.credentialVersion })
        .from(accountCredentials)
        .where(eq(accountCredentials.accountId, input.accountId));
      const [session] = await tx
        .select({ id: sessions.id })
        .from(sessions)
        .where(and(eq(sessions.id, input.sessionId), eq(sessions.accountId, input.accountId)));
      if (!session || credential?.version !== input.expectedCredentialVersion) {
        return { ok: false, code: 'ERR_INVALID_CREDENTIALS' };
      }
      const verified = account.emailVerifiedAt !== null;
      const patch = verified
        ? { pendingEmail: input.email === account.email?.toLowerCase() ? null : input.email }
        : { email: input.email, emailVerifiedAt: null, pendingEmail: null };
      const [updated] = await tx
        .update(accounts)
        .set(patch)
        .where(eq(accounts.id, input.accountId))
        .returning();
      if (!updated) throw new Error('Không cập nhật được email tài khoản');
      return {
        ok: true,
        value: {
          email: updated.email,
          emailVerified: updated.emailVerifiedAt !== null,
          pendingEmail: updated.pendingEmail,
        },
      };
    });
}
