import { describe, expect, it } from 'vitest';
import { assessReminderTiming } from './assessReminderTiming.js';
import type { DeliveryRow, ReminderRow } from './readReminderRows.js';

const MINUTE = 60_000;
const at = (date: string, minutes = 0) =>
  new Date(new Date(`${date}T01:00:00Z`).getTime() + minutes * MINUTE);

const reminder = (id: string, date: string, overrides: Partial<ReminderRow> = {}): ReminderRow => ({
  reminderId: id,
  profileId: 'profile-a',
  date,
  slot: 'morning',
  scheduledAt: at(date),
  sentAt: at(date, 0.5),
  ...overrides,
});
const delivery = (reminderId: string, overrides: Partial<DeliveryRow> = {}): DeliveryRow => ({
  deliveryId: `${reminderId}-d${Math.random()}`,
  reminderId,
  status: 'accepted',
  attempts: 1,
  lastError: null,
  acceptedAt: at(reminderId.slice(0, 10), 1),
  ...overrides,
});
const week = [
  '2026-10-26',
  '2026-10-27',
  '2026-10-28',
  '2026-10-29',
  '2026-10-30',
  '2026-10-31',
  '2026-11-01',
];
const weekReminders = () => week.map((date) => reminder(`${date}-r`, date));
const weekDeliveries = () => week.map((date) => delivery(`${date}-r`));

describe('assessReminderTiming', () => {
  it('TC-096 đạt khi đủ 7 ngày, không trùng buổi và mọi lượt gửi được tiếp nhận trong ±5 phút', () => {
    const verdict = assessReminderTiming(weekReminders(), weekDeliveries());
    expect(verdict.passed).toBe(true);
    expect(verdict.onTime).toBe(7);
    expect(verdict.eligible).toBe(7);
  });

  it('TC-096 không đạt khi tỷ lệ đúng giờ dưới 99%', () => {
    const deliveries = weekDeliveries();
    deliveries[0] = { ...deliveries[0]!, acceptedAt: at(week[0]!, 5.1) };
    const verdict = assessReminderTiming(weekReminders(), deliveries);
    expect(verdict.passed).toBe(false);
    expect(verdict.reasons).toContain('Tỷ lệ đúng giờ 85.7% < 99%');
  });

  it('TC-096 tính gone/failed/expired/pending là trượt, bỏ revoked khỏi mẫu số', () => {
    const deliveries = [
      ...weekDeliveries(),
      delivery(`${week[0]}-r`, { status: 'revoked', acceptedAt: null }),
      delivery(`${week[1]}-r`, { status: 'gone', acceptedAt: null }),
      delivery(`${week[2]}-r`, { status: 'failed', acceptedAt: null, lastError: 'http_500' }),
    ];
    const verdict = assessReminderTiming(weekReminders(), deliveries);
    expect(verdict.eligible).toBe(9);
    expect(verdict.onTime).toBe(7);
    expect(verdict.statuses).toEqual({ accepted: 7, revoked: 1, gone: 1, failed: 1 });
    expect(verdict.failedByCode).toEqual({ http_500: 1 });
  });

  it('BR-037 không đạt khi một hồ sơ có hai lời nhắc cùng ngày/buổi', () => {
    const reminders = [...weekReminders(), reminder('dup', week[0]!)];
    const verdict = assessReminderTiming(reminders, weekDeliveries());
    expect(verdict.duplicateSlots).toBe(1);
    expect(verdict.reasons).toContain('Có 1 bộ hồ sơ/ngày/buổi bị trùng lời nhắc');
  });

  it('TC-096 không đạt khi chưa đủ 7 ngày có lời nhắc', () => {
    const verdict = assessReminderTiming(weekReminders().slice(1), weekDeliveries().slice(1));
    expect(verdict.passed).toBe(false);
    expect(verdict.reasons).toContain('Mới có 6/7 ngày có lời nhắc');
  });

  it('TC-096 không đạt khi không có lượt gửi nào để đo', () => {
    const verdict = assessReminderTiming(weekReminders(), []);
    expect(verdict.reasons).toContain('Chưa có lượt gửi thiết bị nào để đo');
    expect(verdict.remindersWithoutDevices).toBe(7);
  });

  it('thống kê độ trễ tiếp nhận và fan-out theo ngày', () => {
    const verdict = assessReminderTiming(weekReminders(), weekDeliveries());
    expect(verdict.acceptLag.medianMs).toBe(MINUTE);
    expect(verdict.fanOutLag.maxMs).toBe(MINUTE / 2);
    expect(verdict.days[0]).toEqual({ date: week[0], reminders: 1, eligible: 1, onTime: 1 });
  });
});
