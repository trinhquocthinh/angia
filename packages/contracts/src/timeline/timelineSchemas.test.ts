import { describe, expect, it } from 'vitest';
import { timelineEventSchema, timelineQuerySchema, timelineCursorSchema } from './timelineSchemas.js';

describe('Hợp đồng dòng thời gian (SPEC-049)', () => {
  it('TC-504: giới hạn mặc định 50 và chỉ nhận số nguyên từ 1 đến 100', () => {
    expect(timelineQuerySchema.parse({})).toEqual({ limit: 50 });
    expect(timelineQuerySchema.parse({ limit: '100' }).limit).toBe(100);
    for (const limit of ['0', '101', '1.5', 'abc']) {
      expect(timelineQuerySchema.safeParse({ limit }).success).toBe(false);
    }
  });

  it('TC-503: kiểm tra dữ liệu đúng kind, không nhận loại chưa triển khai', () => {
    const event = {
      id: '2026-10-30',
      kind: 'revisit',
      date: '2026-10-30',
      time: null,
      data: { prescriptionIds: ['00000000-0000-4000-8000-000000000001'] },
    };
    expect(timelineEventSchema.safeParse(event).success).toBe(true);
    expect(timelineEventSchema.safeParse({ ...event, kind: 'course_stopped' }).success).toBe(false);
    expect(timelineEventSchema.safeParse({ ...event, kind: 'temperature' }).success).toBe(false);
  });

  it('TC-504: cursor kiểm ngày lịch, giờ, kind, ID và trường thừa', () => {
    const cursor = { date: '2026-10-30', time: null, kind: 'revisit', id: '2026-10-30' };
    expect(timelineCursorSchema.safeParse(cursor).success).toBe(true);
    for (const extra of [
      { date: '2026-02-30' },
      { time: '25:00' },
      { kind: 'other' },
      { id: '' },
      { familyId: 'foreign' },
      { kind: 'prescription' },
    ]) {
      expect(timelineCursorSchema.safeParse({ ...cursor, ...extra }).success).toBe(false);
    }
  });
});
