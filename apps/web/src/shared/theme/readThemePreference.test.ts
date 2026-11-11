import { afterEach, describe, expect, it, vi } from 'vitest';
import { readThemePreference } from './readThemePreference';

afterEach(() => vi.unstubAllGlobals());

describe('Lựa chọn nền trên thiết bị', () => {
  it.each(['light', 'dark', 'system'] as const)('TC-857 — đọc lựa chọn %s đã lưu', (value) => {
    vi.stubGlobal('localStorage', { getItem: () => value });
    expect(readThemePreference()).toBe(value);
  });

  it.each([null, '', 'invalid'])('TC-856 — chưa có lựa chọn hợp lệ (%s) thì theo máy', (value) => {
    vi.stubGlobal('localStorage', { getItem: () => value });
    expect(readThemePreference()).toBe('system');
  });

  it('TC-856 — storage bị chặn vẫn mở được theo nền máy', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('Bị chặn');
      },
    });
    expect(readThemePreference()).toBe('system');
  });
});
