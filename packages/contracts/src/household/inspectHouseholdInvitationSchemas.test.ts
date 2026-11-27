import { describe, expect, it } from 'vitest';
import { inspectHouseholdInvitationRequestSchema } from './inspectHouseholdInvitationRequestSchema.js';
import { inspectHouseholdInvitationResponseSchema } from './inspectHouseholdInvitationResponseSchema.js';

describe('SPEC-065: DTO kiểm tra lời mời', () => {
  it('SPEC-065: nhận đúng token base64url 43 ký tự', () => {
    expect(inspectHouseholdInvitationRequestSchema.safeParse({ token: `${'A'.repeat(40)}_-9` }).success).toBe(
      true,
    );
  });
  it.each([
    {},
    null,
    { token: 123 },
    { token: 'a'.repeat(12) },
    { token: 'A'.repeat(42) },
    { token: 'A'.repeat(44) },
    { token: `${'A'.repeat(42)}=` },
    { token: ` ${'A'.repeat(43)}` },
    { token: `${'A'.repeat(42)}+` },
    { token: `${'A'.repeat(42)}/` },
    { token: 'A'.repeat(43), familyId: 'bí mật' },
  ])('SPEC-065: từ chối body sai %j', (body) => {
    expect(inspectHouseholdInvitationRequestSchema.safeParse(body).success).toBe(false);
  });
  it.each([
    { kind: 'join_family', role: 'main' },
    { kind: 'join_family', role: 'member' },
    { kind: 'found_family' },
  ])('SPEC-065: nhận kết quả tối thiểu %j', (body) => {
    expect(inspectHouseholdInvitationResponseSchema.parse(body)).toEqual(body);
  });
  it.each([
    { kind: 'join_family' },
    { kind: 'found_family', role: 'main' },
    { kind: 'join_family', role: 'owner' },
    { kind: 'found_family', familyId: 'bí mật' },
  ])('SPEC-065: từ chối kết quả sai hoặc thừa dữ liệu %j', (body) => {
    expect(inspectHouseholdInvitationResponseSchema.safeParse(body).success).toBe(false);
  });
});
