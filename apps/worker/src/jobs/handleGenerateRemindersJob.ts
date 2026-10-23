import type { Logger } from 'pino';
import type { ReminderRepository } from '@src/features/reminderGeneration/application/ports.js';
import { generateReminders } from '@src/features/reminderGeneration/application/generateReminders.js';
import { vietnamToday } from '@src/features/reminderGeneration/domain/vietnamToday.js';

export interface GenerateRemindersPolicy {
  now(): Date;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Job cron không có data → hôm nay giờ Việt Nam; job sinh bù lúc khởi động mang { date }.
function jobDate(data: unknown, policy: GenerateRemindersPolicy): string {
  const date = (data as { date?: unknown } | null)?.date;
  if (date === undefined) return vietnamToday(policy.now());
  if (typeof date !== 'string' || !DATE_PATTERN.test(date))
    throw new Error('generate-reminders: date không hợp lệ');
  return date;
}

// SPEC-027: log và output job (pg-boss lưu vào DB) chỉ có id nội bộ, buổi và số đếm — không tên/liều thuốc.
// Gia đình lỗi → ném lỗi để pg-boss chạy lại; khóa duy nhất bảo đảm lần chạy lại không sinh trùng.
export function handleGenerateRemindersJob(
  repository: ReminderRepository,
  policy: GenerateRemindersPolicy,
  logger: Logger,
) {
  return async (job: { id: string; data: unknown; signal?: AbortSignal }) => {
    const date = jobDate(job.data, policy);
    const result = await generateReminders(repository, date, job.signal);
    for (const { familyId, outcome, reason, skippedProfiles, unscheduledSlots } of result.families) {
      if (outcome === 'error')
        logger.error({ jobId: job.id, date, familyId, reason }, 'Không sinh được lời nhắc của gia đình');
      else if (skippedProfiles.length + unscheduledSlots.length > 0)
        logger.warn(
          { jobId: job.id, date, familyId, skippedProfiles, unscheduledSlots },
          'Bỏ qua hồ sơ chưa đồng thuận/chưa có người nhận hoặc buổi có thuốc nhưng chưa cấu hình khung giờ',
        );
    }
    const summary = {
      jobId: job.id,
      date,
      ...result.totals,
      aborted: result.aborted,
      listError: result.listError,
    };
    if (result.listError || result.totals.failedFamilies > 0) {
      logger.error(summary, 'Sinh lời nhắc chưa trọn vẹn — pg-boss sẽ chạy lại');
      throw new Error('generate-reminders: có gia đình chưa sinh được lời nhắc');
    }
    if (result.aborted) logger.warn(summary, 'Sinh lời nhắc bị hủy do job hết hạn');
    else logger.info(summary, 'Đã sinh lời nhắc thuốc trong ngày');
    return summary;
  };
}
