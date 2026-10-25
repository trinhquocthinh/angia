import { describe, expect, it } from 'vitest';
import { assessReminderTiming } from './assessReminderTiming.js';
import { renderReminderAuditReport } from './renderReminderAuditReport.js';

const scheduledAt = new Date('2026-10-26T01:00:00Z');
const reminders = [
  {
    reminderId: '0199aaaa-0000-7000-8000-00000000r001',
    profileId: '0199bbbb-0000-7000-8000-00000000p001',
    date: '2026-10-26',
    slot: 'morning',
    scheduledAt,
    sentAt: scheduledAt,
  },
];
const deliveries = [
  {
    deliveryId: 'd1',
    reminderId: reminders[0]!.reminderId,
    status: 'accepted',
    attempts: 1,
    lastError: null,
    acceptedAt: new Date(scheduledAt.getTime() + 30_000),
  },
];

describe('renderReminderAuditReport', () => {
  const report = renderReminderAuditReport({
    generatedAt: '2026-11-02T00:00:00.000Z',
    since: '2026-10-26T00:00:00.000Z',
    until: '2026-11-01T23:00:00.000Z',
    verdict: assessReminderTiming(reminders, deliveries),
  });

  it('TC-096 ghi kết luận, lý do và bảng theo ngày', () => {
    expect(report).toContain('**KHÔNG ĐẠT**');
    expect(report).toContain('- Mới có 1/7 ngày có lời nhắc');
    expect(report).toContain('| 2026-10-26 | 1 | 1 | 1 |');
  });

  it('BR-040 nhắc rằng tiếp nhận HTTP không chứng minh thiết bị đã hiện hoặc người dùng đã đọc', () => {
    expect(report).toContain('không chứng minh');
  });

  it('chỉ rút gọn mã hồ sơ còn 8 ký tự cuối, không in mã đầy đủ', () => {
    expect(report).toContain('| 0000p001 | 1 | 1 |');
    expect(report).not.toContain(reminders[0]!.profileId);
  });
});
