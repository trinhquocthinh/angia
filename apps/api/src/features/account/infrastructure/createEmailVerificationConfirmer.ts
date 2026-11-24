import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { accounts, emailVerificationTokens } from '@src/shared/db/schema/index.js';
import { writeAdminAuditEvent } from '@src/shared/audit/writeAdminAuditEvent.js';
import type { AccountEmails } from '../application/ports.js';
import { hasVerifiedEmailOwner } from './hasVerifiedEmailOwner.js';
import { isVerifiedEmailConflict } from './isVerifiedEmailConflict.js';

export function createEmailVerificationConfirmer(db: Database): AccountEmails['confirmVerification'] {
  return async (token, now) => {
    try {
      const hash = createHash('sha256').update(token).digest('hex');
      return await db.transaction(async (tx) => {
        const invalid = { ok: false, code: 'ERR_VERIFICATION_TOKEN_INVALID' } as const;
        // Cùng thứ tự khoá account → token với gửi link; đọc lại token sau khi giữ khoá account.
        const [lookup] = await tx
          .select({ accountId: emailVerificationTokens.accountId })
          .from(emailVerificationTokens)
          .where(eq(emailVerificationTokens.tokenHash, hash));
        if (!lookup) return invalid;
        const [account] = await tx
          .select()
          .from(accounts)
          .where(eq(accounts.id, lookup.accountId))
          .for('update');
        if (!account) return invalid;
        const [record] = await tx
          .select()
          .from(emailVerificationTokens)
          .where(eq(emailVerificationTokens.tokenHash, hash))
          .for('update');
        if (!record || record.usedAt !== null || record.expiresAt <= now) return invalid;
        const pending = record.email === account.pendingEmail;
        if (!pending && record.email !== account.email) return invalid;
        if (await hasVerifiedEmailOwner(tx, account.id, record.email))
          return { ok: false, code: 'ERR_EMAIL_TAKEN' };
        await tx
          .update(accounts)
          .set({
            emailVerifiedAt: now,
            ...(pending ? { email: record.email, pendingEmail: null } : {}),
          })
          .where(eq(accounts.id, account.id));
        if (pending)
          await writeAdminAuditEvent(tx, {
            actorAccountId: account.id,
            targetAccountId: account.id,
            ...(account.familyId ? { familyId: account.familyId } : {}),
            action: 'email_changed',
          });
        await tx
          .update(emailVerificationTokens)
          .set({ usedAt: now })
          .where(eq(emailVerificationTokens.id, record.id));
        return { ok: true };
      });
    } catch (error) {
      // Bao gồm lỗi 23505 bọc trong DrizzleQueryError; rollback trước khi ánh xạ kết quả.
      if (isVerifiedEmailConflict(error)) return { ok: false, code: 'ERR_EMAIL_TAKEN' };
      throw error;
    }
  };
}
