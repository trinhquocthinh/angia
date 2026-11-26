import { afterEach, expect, it, vi } from 'vitest';
import { storeLargeText } from './storeLargeText';

afterEach(() => vi.unstubAllGlobals());
it.each([false, true])('Chữ lớn: lưu lựa chọn %s trên thiết bị', (value) => {
  const setItem = vi.fn();
  vi.stubGlobal('localStorage', { setItem });
  storeLargeText(value);
  expect(setItem).toHaveBeenCalledWith('angia-large-text', String(value));
});
it('Chữ lớn: lưu bị chặn không làm gián đoạn thao tác', () => {
  vi.stubGlobal('localStorage', {
    setItem: () => {
      throw new Error('Bị chặn');
    },
  });
  expect(() => storeLargeText(true)).not.toThrow();
});
