import { describe, expect, it } from 'vitest';
import { toIdentityClaims } from './toIdentityClaims.js';

describe('toIdentityClaims', () => {
  it('ánh xạ claim chuẩn của Authentik (sub, name, preferred_username, email, groups)', () => {
    expect(
      toIdentityClaims({
        sub: 'hashed',
        name: 'Thịnh',
        preferred_username: 'thinh',
        email: 'a@b.c',
        groups: ['angia-sit-users', 'angia-admins'],
        iss: 'https://idp',
      }),
    ).toEqual({
      subject: 'hashed',
      name: 'Thịnh',
      preferredUsername: 'thinh',
      email: 'a@b.c',
      groups: ['angia-sit-users', 'angia-admins'],
    });
  });

  it('thiếu claim groups (scope profile chưa cấp) thì coi như không thuộc nhóm nào', () => {
    expect(toIdentityClaims({ sub: 'hashed' })).toEqual({ subject: 'hashed', groups: [] });
  });

  it('bỏ qua claim sai kiểu thay vì tin dữ liệu lạ', () => {
    expect(toIdentityClaims({ sub: 'hashed', name: 42, groups: ['ok', 7] })).toEqual({
      subject: 'hashed',
      groups: ['ok'],
    });
  });

  it('thiếu sub thì từ chối', () => {
    expect(() => toIdentityClaims({ name: 'X' })).toThrow('sub');
  });
});
