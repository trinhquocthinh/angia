import { describe, expect, it } from 'vitest';
import { acceptHouseholdInvitationRequestSchema } from './acceptHouseholdInvitationRequestSchema.js';
import { createFoundingInvitationRequestSchema } from './createFoundingInvitationRequestSchema.js';

describe('DTO xác nhận và lập nhà', () => {
  it('TC-775: nhận token hoặc mã, không nhận familyId/role từ người gửi', () => {
    expect(acceptHouseholdInvitationRequestSchema.parse({ token: ' ABC123456789 ' })).toEqual({
      token: 'ABC123456789',
    });
    expect(
      acceptHouseholdInvitationRequestSchema.safeParse({ token: 'token', familyId: 'nhà', role: 'main' })
        .success,
    ).toBe(false);
  });
  it.each(['', ' ', 'x'.repeat(513)])('TC-777: từ chối bí mật rỗng/quá giới hạn %#', (token) => {
    expect(acceptHouseholdInvitationRequestSchema.safeParse({ token }).success).toBe(false);
  });
  it('TC-779: lời mời lập nhà không nhận familyId hoặc role', () => {
    expect(createFoundingInvitationRequestSchema.safeParse({ kind: 'found_family' }).success).toBe(true);
    expect(
      createFoundingInvitationRequestSchema.safeParse({ kind: 'found_family', role: 'main' }).success,
    ).toBe(false);
  });
});
