import { afterEach, expect, it, vi } from 'vitest';
import { parsePasswordResetToken } from './readPasswordResetToken';
import { scrubPasswordResetHash } from './scrubPasswordResetHash';

afterEach(() => vi.unstubAllGlobals());

it.each([
  ['#token=abc123', 'abc123'],
  ['#token=tok%2B1%2F2', 'tok+1/2'],
  ['#utm=mail&token=secret-token', 'secret-token'],
  ['#token=  padded  ', 'padded'],
  ['#token=', null],
  ['#token=   ', null],
  ['#other=1', null],
  ['#', null],
  ['', null],
])('TC-764: đọc token từ fragment (ca %#)', (hash, expected) => {
  expect(parsePasswordResetToken(hash)).toBe(expected);
});

it('TC-764: xoá hash chứa token khỏi URL bằng history.replaceState sau khi đọc', () => {
  const replaceState = vi.fn();
  vi.stubGlobal('location', { pathname: '/reset-password', search: '', hash: '#token=secret' });
  vi.stubGlobal('history', { replaceState });
  scrubPasswordResetHash();
  expect(replaceState).toHaveBeenCalledExactlyOnceWith(null, '', '/reset-password');
});

it('giữ nguyên query nếu có và không gọi replaceState khi URL không có hash', () => {
  const replaceState = vi.fn();
  vi.stubGlobal('location', { pathname: '/reset-password', search: '?from=mail', hash: '#token=secret' });
  vi.stubGlobal('history', { replaceState });
  scrubPasswordResetHash();
  expect(replaceState).toHaveBeenCalledExactlyOnceWith(null, '', '/reset-password?from=mail');

  replaceState.mockClear();
  vi.stubGlobal('location', { pathname: '/reset-password', search: '', hash: '' });
  scrubPasswordResetHash();
  expect(replaceState).not.toHaveBeenCalled();
});

it('TC-764: xoá hash nhưng giữ state điều hướng của router', () => {
  const state = { key: 'router-entry', __TSR_index: 2 };
  const replaceState = vi.fn();
  vi.stubGlobal('location', { pathname: '/reset-password', search: '', hash: '#token=fixture' });
  vi.stubGlobal('history', { state, replaceState });
  scrubPasswordResetHash();
  expect(replaceState).toHaveBeenCalledExactlyOnceWith(state, '', '/reset-password');
});
