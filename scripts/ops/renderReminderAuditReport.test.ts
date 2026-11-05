import { describe, expect, it } from 'vitest';
import { assessReminderTiming } from './assessReminderTiming.js';
import { renderReminderAuditReport } from './renderReminderAuditReport.js';

const scheduledAt = new Date('2026-10-26T01:00:00Z');
const reminders = [
  {
    kind: 'medication' as const,
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
    kind: 'medication' as const,
    deliveryId: 'd1',
    reminderId: reminders[0]!.reminderId,
    status: 'accepted',
    attempts: 1,
    lastError: null,
    acceptedAt: new Date(scheduledAt.getTime() + 30_000),
  },
];

describe('renderReminderAuditReport', () => {
  it('TC-480: báo cáo tỷ lệ theo medication/revisit và tỷ lệ gộp', () => {
    const medication = { ...reminders[0]!, kind: 'medication' as const };
    const revisit = { ...medication, kind: 'revisit' as const, reminderId: 'r', slot: 'two_days_before' };
    const report = renderReminderAuditReport({
      generatedAt: '2026-11-02T00:00:00Z',
      since: '2026-10-26',
      until: '2026-11-01',
      verdict: assessReminderTiming(
        [medication, revisit],
        [
          deliveries[0]!,
          { ...deliveries[0]!, reminderId: 'r', kind: 'revisit', status: 'gone', acceptedAt: null },
        ],
      ),
    });
    expect(report).toContain('| Loại |');
    expect(report).toContain('| medication | 1 | 1 | 100.0% |');
    expect(report).toContain('| revisit | 1 | 0 | 0.0% |');
    expect(report).toContain('| Tổng | 2 | 1 | 50.0% |');
  });
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
