import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  familyDeletionRequestSchema,
  familyDeletionRevokeSchema,
  familyDeletionResponseSchema,
} from './familyDeletionSchemas.js';

describe('SPEC-069: dữ liệu yêu cầu xoá nhà', () => {
  it('TC-804: nhận tên nhà xác nhận (cắt khoảng trắng) và UUID yêu cầu thu hồi', () => {
    expect(familyDeletionRequestSchema.parse({ confirmFamilyName: ' Nhà Lan ' })).toEqual({
      confirmFamilyName: 'Nhà Lan',
    });
    const requestId = randomUUID();
    expect(familyDeletionRevokeSchema.parse({ requestId })).toEqual({ requestId });
  });
  it('TC-802: từ chối trường thừa, thiếu, rỗng, quá dài và sai kiểu', () => {
    for (const input of [
      {},
      { confirmFamilyName: '' },
      { confirmFamilyName: '   ' },
      { confirmFamilyName: 'a'.repeat(61) },
      { confirmFamilyName: 1 },
      { confirmFamilyName: 'Nhà', familyId: randomUUID() },
    ])
      expect(familyDeletionRequestSchema.safeParse(input).success).toBe(false);
    for (const input of [{}, { requestId: 'sai' }, { requestId: randomUUID(), familyId: randomUUID() }])
      expect(familyDeletionRevokeSchema.safeParse(input).success).toBe(false);
  });
  it('TC-804: phản hồi gồm id, trạng thái pending và executeAt ISO', () => {
    expect(
      familyDeletionResponseSchema.safeParse({
        id: randomUUID(),
        status: 'pending',
        executeAt: new Date().toISOString(),
      }).success,
    ).toBe(true);
  });
});

it('TC-927: yêu cầu hiện tại chỉ nhận pending và thời điểm ISO', () => {
  const value = { id: randomUUID(), status: 'pending', executeAt: new Date(0).toISOString() };
  expect(familyDeletionResponseSchema.parse(value)).toEqual(value);
  for (const invalid of [
    { ...value, status: 'revoked' },
    { ...value, executeAt: 'sai' },
  ])
    expect(familyDeletionResponseSchema.safeParse(invalid).success).toBe(false);
});
