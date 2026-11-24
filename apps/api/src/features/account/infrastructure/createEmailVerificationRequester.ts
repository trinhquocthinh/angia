import { checkRateLimit } from '@src/shared/rateLimit/application/checkRateLimit.js';
import { recordRateLimitHit } from '@src/shared/rateLimit/application/recordRateLimitHit.js';
import { rateLimitPolicies } from '@src/shared/rateLimit/domain/rateLimitPolicies.js';
import { createRateLimitStore } from '@src/shared/rateLimit/infrastructure/createRateLimitStore.js';
import { createHash, randomBytes } from 'node:crypto';
import { SEND_TRANSACTIONAL_EMAIL_QUEUE, sendTransactionalEmailJobSchema } from '@angia/contracts';
import { and, eq, isNull } from 'drizzle-orm';
import type { PgBoss } from 'pg-boss';
import type { Database } from '@src/shared/db/createDatabase.js';
import { accounts, emailVerificationTokens } from '@src/shared/db/schema/index.js';
import { toPgBossDb } from '@src/shared/queue/toPgBossDb.js';
import type { AccountEmails } from '../application/ports.js';
import { hasVerifiedEmailOwner } from './hasVerifiedEmailOwner.js';

export function createEmailVerificationRequester(
  db: Database,
  boss: PgBoss,
  appBaseUrl: string,
): AccountEmails['requestVerification'] {
  return (accountId, now, rateLimit) =>
    db.transaction(async (tx) => {
      const [account] = await tx.select().from(accounts).where(eq(accounts.id, accountId)).for('update');
      if (!account) return { ok: false, code: 'ERR_INVALID_CREDENTIALS' };
      const transactionalRateLimit = { ...rateLimit, store: createRateLimitStore(tx) };
      const policy = rateLimitPolicies.email_verification_send;
      const limit = await checkRateLimit(transactionalRateLimit, policy, accountId);
      if (limit.blocked)
        return { ok: false, code: 'ERR_RATE_LIMITED', retryAfterSeconds: limit.retryAfterSeconds };
      if (account.lockedAt !== null) return { ok: false, code: 'ERR_ACCOUNT_LOCKED' };
      const email = account.pendingEmail ?? account.email;
      if (!email) return { ok: false, code: 'ERR_VALIDATION' };
      if (account.emailVerifiedAt !== null && account.pendingEmail === null) return { ok: true, sent: false };
      if (await hasVerifiedEmailOwner(tx, accountId, email)) return { ok: false, code: 'ERR_EMAIL_TAKEN' };
      const token = randomBytes(32).toString('base64url');
      // Worker bỏ payload sai không retry: email lọt regex domain nhưng sai z.email() phải báo lỗi ngay.
      const job = sendTransactionalEmailJobSchema.safeParse({
        to: email,
        subject: 'Xác minh email AN GIA',
        text: `Bạn vừa yêu cầu xác minh email cho tài khoản AN GIA.\n\nMở liên kết sau trong 24 giờ để xác minh:\n${appBaseUrl.replace(/\/+$/, '')}/verify-email#token=${token}\n\nNếu bạn không yêu cầu, hãy bỏ qua email này.`,
      });
      if (!job.success) return { ok: false, code: 'ERR_VALIDATION' };
      await tx
        .delete(emailVerificationTokens)
        .where(and(eq(emailVerificationTokens.accountId, accountId), isNull(emailVerificationTokens.usedAt)));
      await tx.insert(emailVerificationTokens).values({
        accountId,
        email,
        tokenHash: createHash('sha256').update(token).digest('hex'),
        expiresAt: new Date(now.getTime() + 86_400_000),
      });
      const jobId = await boss.send(SEND_TRANSACTIONAL_EMAIL_QUEUE, job.data, {
        db: toPgBossDb(tx),
        deleteAfterSeconds: 60,
        retentionSeconds: 86400,
      });
      if (!jobId) throw new Error('Không tạo được việc gửi email xác minh');
      await recordRateLimitHit(transactionalRateLimit, policy, accountId);
      return { ok: true, sent: true };
    });
}
