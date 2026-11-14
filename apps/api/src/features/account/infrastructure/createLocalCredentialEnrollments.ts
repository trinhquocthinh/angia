import { and, eq } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { accounts, accountCredentials, sessions } from '@src/shared/db/schema/index.js';
import type { LocalCredentialEnrollments } from '../application/ports.js';

export function createLocalCredentialEnrollments(db: Database): LocalCredentialEnrollments {
  return {
    async findAccount(accountId) {
      const [row] = await db
        .select({
          oidcSubject: accounts.oidcSubject,
          usernameNormalized: accounts.usernameNormalized,
          lockedAt: accounts.lockedAt,
        })
        .from(accounts)
        .where(eq(accounts.id, accountId));
      return row ?? null;
    },
    async insertIfAbsent(input) {
      return db.transaction(async (tx) => {
        const [account] = await tx
          .select({
            oidcSubject: accounts.oidcSubject,
            lockedAt: accounts.lockedAt,
          })
          .from(accounts)
          .where(eq(accounts.id, input.accountId))
          .for('update');
        if (!account) return { ok: false, reason: 'gone' };
        if (account.lockedAt !== null) return { ok: false, reason: 'locked' };
        if (account.oidcSubject === null) return { ok: false, reason: 'forbidden' };
        // Không hồi sinh phiên đã bị thu hồi trong lúc hash.
        const [current] = await tx
          .select({ id: sessions.id })
          .from(sessions)
          .where(and(eq(sessions.id, input.sessionId), eq(sessions.accountId, input.accountId)))
          .for('update');
        if (!current) return { ok: false, reason: 'gone' };
        const [inserted] = await tx
          .insert(accountCredentials)
          .values({
            accountId: input.accountId,
            passwordHash: input.passwordHash,
            credentialVersion: 1,
            updatedAt: input.now,
          })
          .onConflictDoNothing({ target: accountCredentials.accountId })
          .returning({ accountId: accountCredentials.accountId });
        return inserted ? { ok: true } : { ok: false, reason: 'exists' };
      });
    },
  };
}
