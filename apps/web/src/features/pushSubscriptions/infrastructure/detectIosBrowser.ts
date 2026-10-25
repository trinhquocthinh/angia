import { detectPlatform } from './detectPlatform';

/** iPhone/iPad đang mở AN GIA trong trình duyệt (chưa mở từ biểu tượng trên Màn hình chính). */
export function detectIosBrowser(): boolean {
  const platform = detectPlatform();
  return platform.os === 'ios' && !platform.standalone;
}
