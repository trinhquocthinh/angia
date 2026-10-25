import { describe, expect, it } from 'vitest';
import { decodeEntryCursor, encodeEntryCursor } from './documentEntryCursor.js';

const cursor = {
  entryDate: '2026-10-01',
  createdKey: '2026-10-13T08:00:00.123456Z',
  id: '0192f000-0000-7000-8000-000000000001',
};

describe('Cursor danh mục chứng từ (SPEC-028)', () => {
  it('TC-269: mã hóa rồi giải mã giữ nguyên bộ ba (ngày, thời điểm lưu micro giây, id)', () => {
    const raw = encodeEntryCursor(cursor);
    expect(raw).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeEntryCursor(raw)).toEqual(cursor);
  });

  it('TC-269: chuỗi hỏng, ngày sai, thời điểm sai hoặc id không phải UUID → null', () => {
    const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
    for (const raw of [
      '',
      '!!!',
      encode('x'),
      encode([cursor.entryDate, cursor.createdKey, cursor.id]),
      encode({ ...cursor, entryDate: '2026-02-30' }),
      encode({ ...cursor, createdKey: 'hôm qua' }),
      encode({ ...cursor, id: 'abc' }),
      encode({ ...cursor, extra: 1 }),
    ])
      expect(decodeEntryCursor(raw)).toBeNull();
  });
});
