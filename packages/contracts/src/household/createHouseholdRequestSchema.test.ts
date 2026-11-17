import { describe, expect, it } from 'vitest';
import { createHouseholdRequestSchema } from './createHouseholdRequestSchema.js';

describe('DTO tạo nhà SPEC-064', () => {
  it.each(['', ' ', 'a'.repeat(61)])('từ chối tên không hợp lệ %s', (name) => {
    expect(createHouseholdRequestSchema.safeParse({ name }).success).toBe(false);
  });
  it('chấp nhận tên đã trim và token tuỳ chọn', () => {
    expect(createHouseholdRequestSchema.parse({ name: ' Nhà Lan ', invitationToken: 'token' })).toEqual({
      name: 'Nhà Lan',
      invitationToken: 'token',
    });
  });
  it('từ chối token rỗng và trường giả mạo quyền', () => {
    expect(createHouseholdRequestSchema.safeParse({ name: 'Nhà', invitationToken: '' }).success).toBe(false);
    expect(createHouseholdRequestSchema.safeParse({ name: 'Nhà', ownerAccountId: 'khác' }).success).toBe(
      false,
    );
  });
});
