import { describe, expect, it } from 'vitest';
import {
  createHealthProfileRequestSchema,
  updateHealthProfileRequestSchema,
  confirmConsentRequestSchema,
  deleteHealthProfileRequestSchema,
} from './profileRequests.js';

describe('Hợp đồng tạo hồ sơ và đồng thuận', () => {
  it('TC-008: tên được trim, năm sinh bắt buộc và tài khoản tùy chọn', () => {
    expect(createHealthProfileRequestSchema.parse({ displayName: ' Bé An ', birthYear: 2020 })).toEqual({
      displayName: 'Bé An',
      birthYear: 2020,
    });
  });
  it.each([
    { displayName: '', birthYear: 2020 },
    { displayName: 'a'.repeat(61), birthYear: 2020 },
    { displayName: 'An', birthYear: 1899 },
    { displayName: 'An', birthYear: 2000.5 },
    { displayName: 'An', birthYear: 2020, linkedAccountId: 'not-uuid' },
  ])('TC-441: từ chối dữ liệu tạo hồ sơ sai %j', (input) => {
    expect(createHealthProfileRequestSchema.safeParse(input).success).toBe(false);
  });
  it('chỉ chấp nhận hai căn cứ đồng thuận đã quy định', () => {
    expect(confirmConsentRequestSchema.safeParse({ confirmedBy: 'guardian' }).success).toBe(true);
    expect(confirmConsentRequestSchema.safeParse({ confirmedBy: 'other' }).success).toBe(false);
  });
});

describe('Hợp đồng năm sinh và sửa hồ sơ', () => {
  it.each([undefined, null])('TC-441: từ chối tạo hồ sơ với năm sinh %s', (birthYear) => {
    expect(createHealthProfileRequestSchema.safeParse({ displayName: 'Bé An', birthYear }).success).toBe(
      false,
    );
  });

  it('TC-441: chấp nhận mốc năm sinh 1900', () => {
    expect(createHealthProfileRequestSchema.safeParse({ displayName: 'An', birthYear: 1900 }).success).toBe(
      true,
    );
  });

  it.each([
    { birthYear: 2020 },
    { vitalsEnabled: true },
    { vitalsEnabled: false },
    { birthYear: 2020, vitalsEnabled: false },
  ])('TC-441: chấp nhận bản sửa hợp lệ %j', (input) => {
    expect(updateHealthProfileRequestSchema.parse(input)).toEqual(input);
  });

  it.each([
    {},
    { displayName: 'Tên mới' },
    { birthYear: undefined },
    { birthYear: null },
    { birthYear: 1899 },
    { birthYear: 2000.5 },
    { vitalsEnabled: null },
    { vitalsEnabled: 'true' },
  ])('TC-441: từ chối bản sửa không hợp lệ %j', (input) => {
    expect(updateHealthProfileRequestSchema.safeParse(input).success).toBe(false);
  });
});

describe('Hợp đồng xóa hồ sơ (SPEC-007)', () => {
  it('giữ nguyên tên nhập lại, không trim để so chính xác', () => {
    expect(deleteHealthProfileRequestSchema.parse({ confirmName: ' Mẹ ' })).toEqual({ confirmName: ' Mẹ ' });
  });
  it.each([{}, { confirmName: '' }, { confirmName: 'a'.repeat(61) }])('từ chối dữ liệu sai %j', (input) => {
    expect(deleteHealthProfileRequestSchema.safeParse(input).success).toBe(false);
  });
});
