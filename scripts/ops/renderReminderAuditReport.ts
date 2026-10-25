import {
  REQUIRED_DAYS,
  REQUIRED_RATIO,
  TOLERANCE_MS,
  type ReminderTimingVerdict,
} from './assessReminderTiming.js';
import type { DurationSummary } from './summarizeDurations.js';

interface ReportInput {
  generatedAt: string;
  since: string;
  until: string;
  verdict: ReminderTimingVerdict;
}

const seconds = (ms: number | null) => (ms === null ? '—' : `${(ms / 1000).toFixed(1)} s`);
const lagRow = (label: string, summary: DurationSummary) =>
  `| ${label} | ${summary.count} | ${seconds(summary.medianMs)} | ${seconds(summary.p90Ms)} | ` +
  `${seconds(summary.maxMs)} |`;
const counts = (record: Record<string, number>) =>
  Object.entries(record)
    .map(([key, count]) => `${key}: ${count}`)
    .join(', ') || '—';

// Báo cáo Markdown để dán vào hồ sơ nghiệm thu E9-S3-T3, không có dữ liệu sức khỏe. Mã hồ sơ rút gọn
// còn 8 ký tự cuối như báo cáo NFR-3 (UUIDv7 trùng phần đầu).
export function renderReminderAuditReport(input: ReportInput): string {
  const { verdict } = input;
  const ratio = verdict.eligible === 0 ? '—' : `${((verdict.onTime / verdict.eligible) * 100).toFixed(1)}%`;
  return [
    '# TC-096 — Đối soát lời nhắc thuốc 7 ngày (E9-S3-T3)',
    '',
    `Sinh lúc ${input.generatedAt}; lời nhắc dự kiến từ ${input.since} tới ${input.until}.`,
    'Đúng giờ = push service tiếp nhận (`accepted_at`) trong ±5 phút so với `scheduled_at`, tính theo từng',
    'thiết bị. Tiếp nhận HTTP **không chứng minh** thiết bị đã hiện banner hay người dùng đã đọc — đối chiếu',
    'checklist quan sát trên thiết bị trong hồ sơ nghiệm thu.',
    '',
    `Kết luận: ${verdict.passed ? '**ĐẠT**' : '**KHÔNG ĐẠT**'} (≥ ${REQUIRED_RATIO * 100}% trong ` +
      `±${TOLERANCE_MS / 60_000} phút, ${REQUIRED_DAYS} ngày, không trùng hồ sơ/ngày/buổi)`,
    ...verdict.reasons.map((reason) => `- ${reason}`),
    '',
    `Đúng giờ: ${verdict.onTime}/${verdict.eligible} (${ratio}); bộ trùng: ${verdict.duplicateSlots}; ` +
      `lời nhắc không có thiết bị nhận: ${verdict.remindersWithoutDevices}.`,
    `Trạng thái lượt gửi: ${counts(verdict.statuses)}. Lỗi failed: ${counts(verdict.failedByCode)}.`,
    '',
    '| Độ trễ | Số mẫu | Trung vị | p90 | Lớn nhất |',
    '| :-- | --: | --: | --: | --: |',
    lagRow('Tiếp nhận (accepted_at)', verdict.acceptLag),
    lagRow('Fan-out (sent_at)', verdict.fanOutLag),
    '',
    '| Ngày | Lời nhắc | Lượt gửi tính | Đúng giờ |',
    '| :-- | --: | --: | --: |',
    ...verdict.days.map((day) => `| ${day.date} | ${day.reminders} | ${day.eligible} | ${day.onTime} |`),
    '',
    '| Hồ sơ | Lời nhắc | Số ngày |',
    '| :-- | --: | --: |',
    ...verdict.profiles.map((p) => `| ${p.profileId.slice(-8)} | ${p.reminders} | ${p.days} |`),
    '',
  ].join('\n');
}
