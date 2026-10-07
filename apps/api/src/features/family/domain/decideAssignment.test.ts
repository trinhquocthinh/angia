import { describe, expect, it } from 'vitest';
import { decideAssignment } from './decideAssignment.js';

describe('decideAssignment', () => {
  it('nhóm trống chỉ nhận người đầu tiên với vai trò main (BR-007)', () => {
    expect(decideAssignment({ currentFamilyId: null, familyMemberCount: 0, role: 'main' })).toEqual({
      ok: true,
    });
    expect(decideAssignment({ currentFamilyId: null, familyMemberCount: 0, role: 'member' })).toEqual({
      ok: false,
      code: 'ERR_FIRST_ACCOUNT_MUST_BE_MAIN',
    });
  });

  it('nhóm đã có thành viên thì nhận cả vai trò member', () => {
    expect(decideAssignment({ currentFamilyId: null, familyMemberCount: 1, role: 'member' })).toEqual({
      ok: true,
    });
  });

  it('tài khoản đã thuộc một nhóm thì không được gán thêm, kể cả cùng nhóm (BR-001)', () => {
    expect(decideAssignment({ currentFamilyId: 'family-1', familyMemberCount: 0, role: 'main' })).toEqual({
      ok: false,
      code: 'ERR_ACCOUNT_ALREADY_IN_FAMILY',
    });
  });
});
