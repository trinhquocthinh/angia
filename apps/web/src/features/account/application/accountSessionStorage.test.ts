import { afterEach, expect, it, vi } from 'vitest';
import { readAccountStorage, writeAccountStorage } from './accountSessionStorage';
afterEach(() => vi.unstubAllGlobals());
it('TC-748: bộ nhớ bị chặn không làm hỏng màn tài khoản', () => {
  vi.stubGlobal('sessionStorage', {
    getItem: () => {
      throw new Error('denied');
    },
    setItem: () => {
      throw new Error('denied');
    },
    removeItem: () => {
      throw new Error('denied');
    },
  });
  expect(readAccountStorage('token')).toBeNull();
  expect(() => writeAccountStorage('token', 'csrf')).not.toThrow();
  expect(() => writeAccountStorage('token', null)).not.toThrow();
});
it('TC-748: ghi đọc và xóa token trong phạm vi tab', () => {
  const values = new Map<string, string>();
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  });
  writeAccountStorage('token', 'csrf');
  expect(readAccountStorage('token')).toBe('csrf');
  writeAccountStorage('token', null);
  expect(readAccountStorage('token')).toBeNull();
});
