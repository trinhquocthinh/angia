import { eq } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { accounts, accountCredentials, sessions } from '@src/shared/db/schema/index.js';
import type { LocalLoginSessions } from '../application/ports.js';

export function createLocalLoginSessions(db: Database): LocalLoginSessions {
  return {
    async createIfCurrent(input) {
      return db.transaction(async (tx) => {
        const [account] = await tx
          .select({ lockedAt: accounts.lockedAt })
          .from(accounts)
          .where(eq(accounts.id, input.accountId))
          .for('update');
        if (!account) return { ok: false, reason: 'gone' };
        if (account.lockedAt !== null) return { ok: false, reason: 'locked' };
        // Đọc sau khi giữ khoá account: cùng thứ tự khoá với lifecycle/đổi mật khẩu.
        const [credential] = await tx
          .select({ version: accountCredentials.credentialVersion })
          .from(accountCredentials)
          .where(eq(accountCredentials.accountId, input.accountId));
        if (!credential || credential.version !== input.expectedCredentialVersion) {
          return { ok: false, reason: 'stale' };
        }
        const [row] = await tx
          .insert(sessions)
          .values({
            accountId: input.accountId,
            authMethod: 'local',
            csrfToken: input.csrfToken,
            expiresAt: input.expiresAt,
            passwordChangeRequired: input.passwordChangeRequired,
          })
          .returning({ sessionId: sessions.id });
        if (!row) throw new Error('INSERT sessions không trả về dòng nào');
        return { ok: true, sessionId: row.sessionId };
      });
    },
  };
}
