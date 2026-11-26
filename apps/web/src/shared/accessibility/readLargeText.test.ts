import { afterEach, expect, it, vi } from 'vitest';
import { readLargeText } from './readLargeText';

afterEach(() => vi.unstubAllGlobals());

it.each([null, '', 'false', '1', 'invalid'])('Chữ lớn: mặc định tắt khi giá trị lưu là %s', (value) => {
  vi.stubGlobal('localStorage', { getItem: () => value });
  expect(readLargeText()).toBe(false);
});
it('Chữ lớn: khôi phục lựa chọn bật trên thiết bị', () => {
  const getItem = vi.fn(() => 'true');
  vi.stubGlobal('localStorage', { getItem });
  expect(readLargeText()).toBe(true);
  expect(getItem).toHaveBeenCalledWith('angia-large-text');
});
it('Chữ lớn: storage bị chặn vẫn mở được ở cỡ chuẩn', () => {
  vi.stubGlobal('localStorage', {
    getItem: () => {
      throw new Error('Bị chặn');
    },
  });
  expect(readLargeText()).toBe(false);
});
