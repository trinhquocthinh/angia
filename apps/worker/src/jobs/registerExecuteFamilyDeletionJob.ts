import type { PgBoss } from 'pg-boss';
import { executeFamilyDeletion } from '@src/features/familyDeletion/application/executeFamilyDeletion.js';
import type { FamilyDeletionDependencies } from '@src/features/familyDeletion/application/ports.js';

// SPEC-069: mỗi 5 phút xử lý yêu cầu xoá nhà đến hạn. API không gửi job này.
const EXECUTE_FAMILY_DELETION_QUEUE = 'execute-family-deletion';
const EVERY_FIVE_MINUTES = '*/5 * * * *';

// singleton: mỗi lúc một lượt, không chồng lượt xoá. retryLimit 0: lượt 5 phút sau tự thử lại nhà lỗi.
export async function registerExecuteFamilyDeletionJob(
  boss: PgBoss,
  deps: FamilyDeletionDependencies,
): Promise<void> {
  await boss.createQueue(EXECUTE_FAMILY_DELETION_QUEUE, {
    policy: 'singleton',
    retryLimit: 0,
    expireInSeconds: 270,
  });
  await boss.schedule(EXECUTE_FAMILY_DELETION_QUEUE, EVERY_FIVE_MINUTES, null, { tz: 'Asia/Ho_Chi_Minh' });
  await boss.work(EXECUTE_FAMILY_DELETION_QUEUE, { batchSize: 1 }, async ([job]) => {
    if (!job) return;
    const result = await executeFamilyDeletion(deps);
    deps.logger.info({ jobId: job.id, ...result }, 'Đã xử lý yêu cầu xoá nhà đến hạn');
    // Lỗi từng nhà đã log kèm familyId; pg-boss chỉ lưu mã an toàn, không chứa thông điệp DB.
    if (result.failed) throw new Error('family_deletion_failed');
  });
}
