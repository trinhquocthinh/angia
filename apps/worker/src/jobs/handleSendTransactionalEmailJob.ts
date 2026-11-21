import { sendTransactionalEmailJobSchema } from '@angia/contracts';
import type { Logger } from 'pino';
import type { Mailer } from '@src/shared/mailer/Mailer.js';

// Payload sai không retry; không ghi người nhận, nội dung hay lỗi SMTP chứa PII vào log.
export function handleSendTransactionalEmailJob(mailer: Mailer, logger: Pick<Logger, 'info' | 'error'>) {
  return async (job: { id: string; data: unknown }): Promise<void> => {
    const parsed = sendTransactionalEmailJobSchema.safeParse(job.data);
    if (!parsed.success) {
      logger.error({ jobId: job.id }, 'Payload email giao dịch không hợp lệ');
      return;
    }
    await mailer.send(parsed.data);
    logger.info({ jobId: job.id }, 'Đã gửi email giao dịch');
  };
}
