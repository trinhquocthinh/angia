import { createHash } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { accounts, passwordResetTokens } from '@src/shared/db/schema/index.js';
import type { EmailPasswordResets } from '../application/passwordResetPorts.js';
import { replaceEmailResetPassword } from './replaceEmailResetPassword.js';

export function createPasswordResetConsumer(db: Database): EmailPasswordResets['consume'] {
  return (token, accountId, passwordHash, now) =>
    db.transaction(async (tx) => {
      const [account] = await tx.select().from(accounts).where(eq(accounts.id, accountId)).for('update');
      if (!account || account.lockedAt !== null) return false;
      const hash = createHash('sha256').update(token).digest('hex');
      const [record] = await tx
        .select()
        .from(passwordResetTokens)
        .where(and(eq(passwordResetTokens.tokenHash, hash), eq(passwordResetTokens.accountId, accountId)))
        .for('update');
      if (!record || record.usedAt !== null || record.expiresAt <= now) return false;
      await replaceEmailResetPassword(tx, account, passwordHash, now);
      await tx.update(passwordResetTokens).set({ usedAt: now }).where(eq(passwordResetTokens.id, record.id));
      return true;
    });
}
