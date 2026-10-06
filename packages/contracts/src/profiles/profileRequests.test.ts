import { describe, expect, it } from 'vitest';
import { createHealthProfileRequestSchema, confirmConsentRequestSchema } from './profileRequests.js';

describe('Hợp đồng tạo hồ sơ và đồng thuận', () => {
  it('TC-008: tên được trim, năm sinh và tài khoản tùy chọn', () => {
    expect(createHealthProfileRequestSchema.parse({ displayName: ' Bé An ' })).toEqual({
      displayName: 'Bé An',
    });
  });
  it.each([
    { displayName: '' },
    { displayName: 'a'.repeat(61) },
    { displayName: 'An', birthYear: 1899 },
    { displayName: 'An', birthYear: 2000.5 },
    { displayName: 'An', linkedAccountId: 'not-uuid' },
  ])('từ chối dữ liệu sai %j', (input) => {
    expect(createHealthProfileRequestSchema.safeParse(input).success).toBe(false);
  });
  it('chỉ chấp nhận hai căn cứ đồng thuận đã quy định', () => {
    expect(confirmConsentRequestSchema.safeParse({ confirmedBy: 'guardian' }).success).toBe(true);
    expect(confirmConsentRequestSchema.safeParse({ confirmedBy: 'other' }).success).toBe(false);
  });
});
