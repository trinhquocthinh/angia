import type { Logger } from 'pino';
import { sendReminders } from '@src/features/reminderDelivery/application/sendReminders.js';
import type {
  DeliveryRepository,
  ReminderNotifier,
  SendRemindersTotals,
} from '@src/features/reminderDelivery/application/ports.js';

export interface SendRemindersPolicy {
  now(): Date;
}

// SPEC-027: log chỉ có id nội bộ, mã lỗi và số đếm — không tên thuốc, endpoint hay nội dung push.
// Job chạy mỗi phút nên lượt không có việc chỉ ghi debug. Không ném lỗi: retryLimit 0, lượt sau tự chạy lại.
// Output job (pg-boss lưu vào DB) = totals (spec §5.2); job.signal dừng lượt khi job hết hạn.
export function handleSendRemindersJob(
  repository: DeliveryRepository,
  notifier: ReminderNotifier,
  policy: SendRemindersPolicy,
  logger: Logger,
) {
  return async (job: { id: string; data: unknown; signal?: AbortSignal }): Promise<SendRemindersTotals> => {
    const result = await sendReminders(repository, notifier, {
      now: () => policy.now(),
      signal: job.signal,
    });
    const { totals, failedFamilies } = result;
    const active = failedFamilies > 0 || Object.values(totals).some((count) => count > 0);
    if (active) logger.info({ totals, failedFamilies }, 'Đã xử lý lượt gửi lời nhắc thuốc');
    else logger.debug({ totals, failedFamilies }, 'Lượt gửi lời nhắc không có việc');
    if (result.expiredBeforeFanoutReminderIds.length > 0)
      logger.warn(
        { reminderIds: result.expiredBeforeFanoutReminderIds },
        'Lời nhắc đã quá hạn trước khi fan-out, bỏ qua',
      );
    if (result.failures.length > 0)
      logger.warn({ failures: result.failures }, 'Gia đình chưa gửi được lời nhắc, lượt sau thử lại');
    if (totals.failed + totals.expired > 0)
      logger.warn(
        { failed: totals.failed, expired: totals.expired, failedByCode: result.failedByCode },
        'Có đích gửi lỗi hoặc hết hạn',
      );
    if (result.aborted) logger.error({ totals, failedFamilies }, 'Lượt gửi lời nhắc bị hủy giữa chừng');
    return totals;
  };
}
