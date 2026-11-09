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

  it.each([
    { kind: 'temperature', data: { celsius: 38.5 } },
    {
      kind: 'as_needed_dose',
      data: {
        courseId: '00000000-0000-4000-8000-000000000002',
        name: 'Paracetamol',
        quantity: 0.5,
        unit: 'gói',
      },
    },
    {
      kind: 'pain_entry',
      data: {
        issueId: '00000000-0000-4000-8000-000000000003',
        region: 'knee',
        side: 'left',
        level: 6,
        note: null,
      },
    },
    {
      kind: 'pain_issue_status',
      data: {
        issueId: '00000000-0000-4000-8000-000000000003',
        region: 'head',
        side: 'center',
        change: 'reopened',
      },
    },
    {
      kind: 'exercise_started',
      data: {
        issueId: '00000000-0000-4000-8000-000000000003',
        region: 'knee',
        side: 'right',
        exerciseId: '00000000-0000-4000-8000-000000000001',
        name: 'Duỗi gối',
        source: 'self',
      },
    },
  ])('TC-503/504/715: nhận sự kiện và cursor $kind', ({ kind, data }) => {
    const key = {
      id: '00000000-0000-4000-8000-000000000001',
      date: '2026-10-30',
      time: '00:01',
      kind,
    };
    expect(timelineEventSchema.parse({ ...key, data })).toEqual({ ...key, data });
    expect(timelineCursorSchema.parse(key)).toEqual(key);
    expect(timelineEventSchema.safeParse({ ...key, data: {} }).success).toBe(false);
  });

  it('TC-715: sự kiện đau từ chối mức ngoài 1–10, vùng/bên lạ và thay đổi trạng thái lạ', () => {
    const key = { id: '00000000-0000-4000-8000-000000000001', date: '2026-10-30', time: null };
    const at = { issueId: key.id, region: 'knee', side: 'left' };
    for (const event of [
      { ...key, kind: 'pain_entry', data: { ...at, level: 11, note: null } },
      { ...key, kind: 'pain_entry', data: { ...at, region: 'tail', level: 5, note: null } },
      { ...key, kind: 'pain_issue_status', data: { ...at, change: 'closed' } },
      { ...key, kind: 'exercise_started', data: { ...at, exerciseId: key.id, name: 'A', source: 'other' } },
    ])
      expect(timelineEventSchema.safeParse(event).success).toBe(false);
  });
});
