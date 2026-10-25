import { afterEach, describe, expect, it, vi } from 'vitest';
import { detectPlatform } from './detectPlatform';
import { detectIosBrowser } from './detectIosBrowser';

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const ANDROID =
  'Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
function stub(userAgent: string, options: { standalone?: boolean; platform?: string; touch?: number } = {}) {
  vi.stubGlobal('navigator', {
    userAgent,
    platform: options.platform ?? '',
    maxTouchPoints: options.touch ?? 0,
  });
  vi.stubGlobal('matchMedia', () => ({ matches: Boolean(options.standalone) }));
}
afterEach(() => vi.unstubAllGlobals());
describe('TC-371 Nhận diện thiết bị cho hướng dẫn cài đặt', () => {
  it('iPhone Safari → ios, chưa cài', () => {
    stub(IPHONE);
    expect(detectPlatform()).toEqual({ os: 'ios', inAppBrowser: false, standalone: false });
    expect(detectIosBrowser()).toBe(true);
  });
  it('iPad báo MacIntel nhưng có cảm ứng → vẫn là ios', () => {
    stub('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15', {
      platform: 'MacIntel',
      touch: 5,
    });
    expect(detectPlatform().os).toBe('ios');
  });
  it('mở từ biểu tượng Màn hình chính → standalone', () => {
    stub(ANDROID, { standalone: true });
    expect(detectPlatform()).toEqual({ os: 'android', inAppBrowser: false, standalone: true });
    stub(IPHONE, { standalone: true });
    expect(detectIosBrowser()).toBe(false);
  });
  it('trình duyệt trong Zalo, Facebook, Messenger → inAppBrowser', () => {
    for (const marker of ['Zalo iOS/24.10.1', 'FBAN/FBIOS;FBAV/480.0', '[FB_IAB/MESSENGER;FBAV/470.0]']) {
      stub(`${IPHONE} ${marker}`);
      expect(detectPlatform().inAppBrowser).toBe(true);
    }
  });
  it('máy tính → other', () => {
    stub('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/129.0.0.0 Safari/537.36', { platform: 'Win32' });
    expect(detectPlatform()).toEqual({ os: 'other', inAppBrowser: false, standalone: false });
  });
});
