import { afterEach, expect, it, vi } from 'vitest';
import {
  capturePendingInvitation,
  readPendingInvitation,
  clearPendingInvitation,
} from './pendingHouseholdInvitation';
const token = 'a'.repeat(43);
afterEach(clearPendingInvitation);
function capture(hash: string, pathname = '/invite') {
  const history = { state: { test: true }, replaceState: vi.fn() };
  capturePendingInvitation({ pathname, hash, search: '?from=test' }, history);
  return history;
}
it('E27-AT-D1: nhận token hợp lệ trong bộ nhớ và luôn xoá fragment, giữ search/state', () => {
  const history = capture(`#token=${token}`);
  expect(readPendingInvitation()).toBe(token);
  expect(history.replaceState).toHaveBeenCalledExactlyOnceWith({ test: true }, '', '/invite?from=test');
  clearPendingInvitation();
  expect(readPendingInvitation()).toBeNull();
});
it.each([
  '',
  '#token=abc',
  `#token=${'a'.repeat(44)}`,
  `#token=${'!'.repeat(43)}`,
  `#token=${token}&token=${token}`,
])('E27-AT-D1: từ chối fragment sai %s và vẫn xoá fragment', (hash) => {
  const history = capture(hash);
  expect(readPendingInvitation()).toBeNull();
  expect(history.replaceState).toHaveBeenCalledOnce();
});
it('E27-AT-D1: không đọc hay sửa URL ở path khác, không xoá lời mời chờ', () => {
  capture(`#token=${token}`);
  const history = capture('#token=wrong', '/login');
  expect(readPendingInvitation()).toBe(token);
  expect(history.replaceState).not.toHaveBeenCalled();
});
it('E27-AT-D1: chấp nhận base64url và giải mã fragment bằng URLSearchParams', () => {
  capture(`#token=${encodeURIComponent('_-A'.repeat(14) + '0')}`);
  expect(readPendingInvitation()).toBe('_-A'.repeat(14) + '0');
});
