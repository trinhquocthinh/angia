import { describe, expect, it } from 'vitest';
import { profileScopeKey } from './profileScopeKey';
describe('Khóa cache hồ sơ theo phiên hiện tại', () => {
  it('không có phiên dùng key rỗng, không trùng dữ liệu tài khoản', () => {
    expect(profileScopeKey(null)).toEqual(['profiles', null, null]);
    expect(profileScopeKey(undefined)).toEqual(['profiles', null, null]);
  });
  it('có phiên bao gồm cả accountId và familyId', () => {
    expect(
      profileScopeKey({
        account: { id: 'a', displayName: 'An', isSystemAdmin: false, healthProfileId: null },
        family: { id: 'f', name: 'Nhà An' },
        role: 'main',
        csrfToken: 'csrf',
      }),
    ).toEqual(['profiles', 'a', 'f']);
  });
});
