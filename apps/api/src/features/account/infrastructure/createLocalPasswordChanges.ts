import { and, eq, ne, sql } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { accounts, accountCredentials, sessions } from '@src/shared/db/schema/index.js';
import type { LocalPasswordChanges } from '../application/ports.js';

export function createLocalPasswordChanges(db: Database): LocalPasswordChanges {
  return {
    async findCredential(accountId) {
      const [row] = await db
        .select({
          usernameNormalized: accounts.usernameNormalized,
          passwordHash: accountCredentials.passwordHash,
          credentialVersion: accountCredentials.credentialVersion,
        })
        .from(accounts)
        .innerJoin(accountCredentials, eq(accounts.id, accountCredentials.accountId))
        .where(eq(accounts.id, accountId));
      if (!row || row.usernameNormalized === null) return null;
      return { ...row, usernameNormalized: row.usernameNormalized };
    },
    async replaceIfCurrent(input) {
      return db.transaction(async (tx) => {
        const [account] = await tx
          .select({ lockedAt: accounts.lockedAt })
          .from(accounts)
          .where(eq(accounts.id, input.accountId))
          .for('update');
        if (!account) return { ok: false, reason: 'gone' };
        if (account.lockedAt !== null) return { ok: false, reason: 'locked' };
        // Không hồi sinh phiên đã bị thu hồi trong lúc hash.
        const [current] = await tx
          .select({ id: sessions.id })
          .from(sessions)
          .where(and(eq(sessions.id, input.sessionId), eq(sessions.accountId, input.accountId)));
        if (!current) return { ok: false, reason: 'gone' };
        const [updated] = await tx
          .update(accountCredentials)
          .set({
            passwordHash: input.passwordHash,
            credentialVersion: sql`${accountCredentials.credentialVersion} + 1`,
            updatedAt: input.now,
          })
          .where(
            and(
              eq(accountCredentials.accountId, input.accountId),
              eq(accountCredentials.credentialVersion, input.expectedCredentialVersion),
            ),
          )
          .returning({ accountId: accountCredentials.accountId });
        if (!updated) return { ok: false, reason: 'stale' };
        await tx
          .update(accounts)
          .set({ mustChangePassword: false, tempPasswordExpiresAt: null })
          .where(eq(accounts.id, input.accountId));
        // Chỉ xoá phiên: push_subscriptions tồn tại độc lập, FK tự đặt last_session_id về NULL.
        await tx
          .delete(sessions)
          .where(and(eq(sessions.accountId, input.accountId), ne(sessions.id, input.sessionId)));
        await tx
          .update(sessions)
          .set({ passwordChangeRequired: false })
          .where(eq(sessions.id, input.sessionId));
        return { ok: true };
      });
    },
  };
}
