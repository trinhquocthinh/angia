import { afterEach, expect, it, vi } from 'vitest';
import { readTextSize } from './readTextSize';
afterEach(() => vi.unstubAllGlobals());
it('Cỡ chữ biểu đồ: không có DOM dùng cỡ chuẩn', () => {
  expect(readTextSize('body')).toBe(16);
  expect(readTextSize('caption')).toBe(14);
});
it('Cỡ chữ biểu đồ: đọc lại token và tính rem theo cỡ chữ trình duyệt', () => {
  let value = '0.875rem';
  vi.stubGlobal('document', { documentElement: {} });
  vi.stubGlobal('getComputedStyle', () => ({ fontSize: '32px', getPropertyValue: () => value }));
  expect(readTextSize('caption')).toBe(28);
  value = '1rem';
  expect(readTextSize('caption')).toBe(32);
});
