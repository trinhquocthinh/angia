import { expect, it } from 'vitest';
import { invitationIsExpired } from './invitationIsExpired';

it('TC-777: chạm thời điểm hết hạn phải khoá gửi và sao chép', () => {
  const expiry = '2026-11-25T07:30:00.000Z';
  expect(invitationIsExpired(expiry, Date.parse('2026-11-25T07:29:59.999Z'))).toBe(false);
  expect(invitationIsExpired(expiry, Date.parse('2026-11-25T07:30:00.000Z'))).toBe(true);
  expect(invitationIsExpired('không phải ngày', 0)).toBe(true);
});
