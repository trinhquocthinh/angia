import { afterEach, expect, it, vi } from 'vitest';
import { readThemeColor } from './readThemeColor';

afterEach(() => vi.unstubAllGlobals());

it('TC-860 — đọc lại token hiện hành khi nền thay đổi, không giữ màu cũ', () => {
  let value = 'light-color';
  vi.stubGlobal('document', { documentElement: {} });
  vi.stubGlobal('getComputedStyle', () => ({ getPropertyValue: () => ` ${value} ` }));
  expect(readThemeColor('accent')).toBe('light-color');
  value = 'dark-color';
  expect(readThemeColor('accent')).toBe('dark-color');
});

it('TC-860 — kết xuất không có DOM giữ tham chiếu token', () => {
  expect(readThemeColor('text-primary')).toBe('var(--color-text-primary)');
});
