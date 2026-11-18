import { expect, it } from 'vitest';
import { prepareInvitationCode } from './prepareInvitationCode';

it('TC-775: nhận mã đủ 12 ký tự, cho phép khoảng trắng và chữ thường', () => {
  expect(prepareInvitationCode(' a7f2 9c4e 8b1d ')).toBe('A7F29C4E8B1D');
  for (const value of ['', 'A7F29C', 'A7F29C4E8B1DD', 'G7F29C4E8B1D']) {
    expect(prepareInvitationCode(value)).toBeNull();
  }
});
