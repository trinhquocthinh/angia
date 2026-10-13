import { describe, expect, it } from 'vitest';
import { documentEntryQuerySchema } from './documentEntrySchemas.js';

describe('Hợp đồng danh mục chứng từ của hồ sơ (SPEC-028)', () => {
  it('TC-271: limit mặc định 20, nhận 1–50; loại và cursor tùy chọn', () => {
    expect(documentEntryQuerySchema.parse({})).toEqual({ limit: 20 });
    expect(documentEntryQuerySchema.parse({ limit: '50', type: 'lab_result', cursor: 'abc' })).toEqual({
      limit: 50,
      type: 'lab_result',
      cursor: 'abc',
    });
    for (const query of [{ limit: '0' }, { limit: '51' }, { type: 'xray' }, { cursor: '' }])
      expect(documentEntryQuerySchema.safeParse(query).success).toBe(false);
  });
});
