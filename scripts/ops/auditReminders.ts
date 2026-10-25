import { parseArgs } from 'node:util';
import { assessReminderTiming } from './assessReminderTiming.js';
import { readReminderRows } from './readReminderRows.js';
import { renderReminderAuditReport } from './renderReminderAuditReport.js';

// E9-S3-T3/TC-096: đối soát lời nhắc thuốc 7 ngày trên SIT/Production từ reminders + reminder_deliveries.
// Cách dùng: `yarn ops:reminder-audit [--since ISO] [--until ISO]`, kết nối qua REMINDER_AUDIT_DATABASE_URL
// (role app của môi trường; script đặt phiên chỉ đọc). Mặc định `until` lùi 60 phút để mọi lời nhắc
// đã hết cửa sổ gửi. Mã thoát 1 khi chưa đạt.
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const SEND_WINDOW_MS = 60 * 60 * 1000;

const parseDate = (value: string | undefined, fallback: Date) => (value ? new Date(value) : fallback);

const main = async (): Promise<number> => {
  const connectionString = process.env.REMINDER_AUDIT_DATABASE_URL;
  if (!connectionString) {
    console.error('Thiếu REMINDER_AUDIT_DATABASE_URL');
    return 2;
  }
  const { values } = parseArgs({ options: { since: { type: 'string' }, until: { type: 'string' } } });
  const until = parseDate(values.until, new Date(Date.now() - SEND_WINDOW_MS));
  const since = parseDate(values.since, new Date(until.getTime() - SEVEN_DAYS_MS));
  if (Number.isNaN(since.getTime()) || Number.isNaN(until.getTime())) {
    console.error(`--since/--until không hợp lệ: ${values.since ?? ''} ${values.until ?? ''}`);
    return 2;
  }
  const { reminders, deliveries } = await readReminderRows(connectionString, since, until);
  const verdict = assessReminderTiming(reminders, deliveries);
  console.log(
    renderReminderAuditReport({
      generatedAt: new Date().toISOString(),
      since: since.toISOString(),
      until: until.toISOString(),
      verdict,
    }),
  );
  return verdict.passed ? 0 : 1;
};

process.exitCode = await main();
