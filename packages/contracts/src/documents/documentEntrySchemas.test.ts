import { describe, expect, it } from 'vitest';
import { documentEntryQuerySchema, documentEntrySchema } from './documentEntrySchemas.js';

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

it('TC-409: danh mục dùng hasImage và không nhận hai trạng thái đã bỏ', () => {
  const entry = {
    id: '0199bc85-8918-7000-8000-000000000001',
    origin: 'document',
    type: null,
    status: 'manual_entry',
    entryDate: '2026-10-28',
    dateKnown: false,
    createdAt: '2026-10-28T03:00:00Z',
    hasImage: false,
    records: { prescription: null, labResults: [], measurements: [] },
  };
  expect(documentEntrySchema.parse(entry)).toEqual(entry);
  expect(documentEntrySchema.safeParse({ ...entry, origin: 'manual', status: 'manual_record' }).success).toBe(
    true,
  );
  expect(documentEntrySchema.safeParse({ ...entry, hasImage: undefined, hasOcrImage: false }).success).toBe(
    false,
  );
  for (const status of ['awaiting_privacy', 'rejected']) {
    expect(documentEntrySchema.safeParse({ ...entry, status }).success).toBe(false);
  }
});
