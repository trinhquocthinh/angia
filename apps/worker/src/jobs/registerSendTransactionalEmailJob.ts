import { SEND_TRANSACTIONAL_EMAIL_QUEUE, SEND_TRANSACTIONAL_EMAIL_QUEUE_OPTIONS } from '@angia/contracts';
import type { PgBoss } from 'pg-boss';
import type { Logger } from 'pino';
import type { Mailer } from '@src/shared/mailer/Mailer.js';
import { handleSendTransactionalEmailJob } from './handleSendTransactionalEmailJob.js';

export async function registerSendTransactionalEmailJob(
  boss: PgBoss,
  mailer: Mailer,
  logger: Logger,
): Promise<void> {
  await boss.createQueue(SEND_TRANSACTIONAL_EMAIL_QUEUE, SEND_TRANSACTIONAL_EMAIL_QUEUE_OPTIONS);
  const handle = handleSendTransactionalEmailJob(mailer, logger);
  await boss.work(SEND_TRANSACTIONAL_EMAIL_QUEUE, { batchSize: 1 }, async ([job]) => {
    if (job) await handle(job);
  });
}
