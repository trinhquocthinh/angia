import type { PgBoss } from 'pg-boss';
import type { Logger } from 'pino';
import type {
  DeliveryRepository,
  ReminderNotifier,
} from '@src/features/reminderDelivery/application/ports.js';
import { handleSendRemindersJob, type SendRemindersPolicy } from './handleSendRemindersJob.js';

// SPEC-027: quét mỗi phút giờ Việt Nam. singleton: mỗi lúc một lượt; retryLimit 0 vì lượt sau (1 phút)
// tự nhặt đích còn pending; expireInSeconds 300 chặn lượt kẹt giữ hàng đợi quá lâu.
const SEND_REMINDERS_QUEUE = 'send-reminders';
const EVERY_MINUTE_CRON = '* * * * *';

export async function registerSendRemindersJob(
  boss: PgBoss,
  repository: DeliveryRepository,
  notifier: ReminderNotifier,
  policy: SendRemindersPolicy,
  logger: Logger,
): Promise<void> {
  await boss.createQueue(SEND_REMINDERS_QUEUE, { policy: 'singleton', retryLimit: 0, expireInSeconds: 300 });
  await boss.schedule(SEND_REMINDERS_QUEUE, EVERY_MINUTE_CRON, null, { tz: 'Asia/Ho_Chi_Minh' });
  const handle = handleSendRemindersJob(repository, notifier, policy, logger);
  await boss.work(SEND_REMINDERS_QUEUE, { batchSize: 1 }, async ([job]) => {
    if (job) return handle(job);
    return undefined;
  });
}
