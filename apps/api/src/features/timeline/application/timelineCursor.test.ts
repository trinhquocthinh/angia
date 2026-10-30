import { describe, expect, it } from 'vitest';
import { encodeTimelineCursor, decodeTimelineCursor } from './timelineCursor.js';

describe('Cursor dòng thời gian', () => {
  const cursor = {
    date: '2026-10-30',
    time: '07:30',
    kind: 'measurement' as const,
    id: '00000000-0000-4000-8000-000000000001',
  };
  it('TC-504: khứ hồi đủ khóa sắp xếp, hỗ trợ giờ null và ID ngày của lịch hẹn', () => {
    expect(decodeTimelineCursor(encodeTimelineCursor(cursor))).toEqual(cursor);
    const revisit = { ...cursor, kind: 'revisit' as const, time: null, id: cursor.date };
    expect(decodeTimelineCursor(encodeTimelineCursor(revisit))).toEqual(revisit);
  });
  it('TC-504: từ chối base64url/JSON hỏng, trường thừa và cursor không chuẩn', () => {
    for (const raw of [
      '',
      '%bad',
      'e30',
      'bnVsbA',
      'W10',
      `${encodeTimelineCursor(cursor)}=`,
      Buffer.from(JSON.stringify({ ...cursor, extra: true })).toString('base64url'),
    ]) {
      expect(decodeTimelineCursor(raw)).toBeNull();
    }
  });
});
