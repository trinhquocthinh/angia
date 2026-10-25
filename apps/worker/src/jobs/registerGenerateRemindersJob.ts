import type { PgBoss } from 'pg-boss';
import type { Logger } from 'pino';
import type { ReminderRepository } from '@src/features/reminderGeneration/application/ports.js';
import { vietnamToday } from '@src/features/reminderGeneration/domain/vietnamToday.js';
import { handleGenerateRemindersJob, type GenerateRemindersPolicy } from './handleGenerateRemindersJob.js';

// SPEC-027: 00:05 hằng ngày giờ Việt Nam. API không gửi job này nên hằng nằm ở worker.
const GENERATE_REMINDERS_QUEUE = 'generate-reminders';
const DAILY_CRON = '5 0 * * *';

// singleton: mỗi lúc một lượt. Gia đình lỗi → handler ném lỗi, retry 3 lần lùi dần (idempotent).
// Sinh bù hôm nay lúc khởi động (owner chốt 2026-10-23) để worker tắt đúng 00:05 không làm mất một ngày.
export async function registerGenerateRemindersJob(
  boss: PgBoss,
  repository: ReminderRepository,
  policy: GenerateRemindersPolicy,
  logger: Logger,
): Promise<void> {
  await boss.createQueue(GENERATE_REMINDERS_QUEUE, {
    policy: 'singleton',
    retryLimit: 3,
    retryDelay: 60,
    retryBackoff: true,
    expireInSeconds: 1_800,
  });
  await boss.schedule(GENERATE_REMINDERS_QUEUE, DAILY_CRON, null, { tz: 'Asia/Ho_Chi_Minh' });
  await boss.send(GENERATE_REMINDERS_QUEUE, { date: vietnamToday(policy.now()) });
  const handle = handleGenerateRemindersJob(repository, policy, logger);
  await boss.work(GENERATE_REMINDERS_QUEUE, { batchSize: 1 }, async ([job]) => {
    if (job) return handle(job);
    return undefined;
  });
}
