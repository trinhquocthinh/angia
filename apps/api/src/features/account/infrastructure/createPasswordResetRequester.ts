import { createHash, randomBytes } from 'node:crypto';
import { and, eq, isNotNull, isNull, sql } from 'drizzle-orm';
import { SEND_TRANSACTIONAL_EMAIL_QUEUE, sendTransactionalEmailJobSchema } from '@angia/contracts';
import type { PgBoss } from 'pg-boss';
import type { Database } from '@src/shared/db/createDatabase.js';
import { accounts, passwordResetTokens } from '@src/shared/db/schema/index.js';
import { toPgBossDb } from '@src/shared/queue/toPgBossDb.js';
import type { EmailPasswordResets } from '../application/passwordResetPorts.js';

export function createPasswordResetRequester(
  db: Database,
  boss: PgBoss,
  appBaseUrl: string,
): EmailPasswordResets['request'] {
  return (email, now) =>
    db.transaction(async (tx) => {
      const [account] = await tx
        .select()
        .from(accounts)
        .where(
          and(
            sql`lower(${accounts.email}) = ${email}`,
            isNotNull(accounts.emailVerifiedAt),
            isNull(accounts.lockedAt),
          ),
        )
        .for('update');
      if (!account) return;
      const token = randomBytes(32).toString('base64url');
      const job = sendTransactionalEmailJobSchema.safeParse({
        to: account.email,
        subject: 'Đặt lại mật khẩu AN GIA',
        text: `Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản AN GIA.\n\nMở liên kết sau trong 30 phút để đặt lại mật khẩu:\n${appBaseUrl.replace(/\/+$/, '')}/reset-password#token=${token}\n\nNếu bạn không yêu cầu, hãy bỏ qua email này.`,
      });
      if (!job.success) throw new Error('Payload email đặt lại mật khẩu không hợp lệ');
      await tx
        .delete(passwordResetTokens)
        .where(and(eq(passwordResetTokens.accountId, account.id), isNull(passwordResetTokens.usedAt)));
      await tx.insert(passwordResetTokens).values({
        accountId: account.id,
        tokenHash: createHash('sha256').update(token).digest('hex'),
        expiresAt: new Date(now.getTime() + 1_800_000),
      });
      const jobId = await boss.send(SEND_TRANSACTIONAL_EMAIL_QUEUE, job.data, {
        db: toPgBossDb(tx),
        deleteAfterSeconds: 60,
        retentionSeconds: 1800,
      });
      if (!jobId) throw new Error('Không tạo được việc gửi email đặt lại mật khẩu');
    });
}
