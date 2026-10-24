import type { DevicePlatform } from '../application/chooseDeviceGuide';

const IN_APP_BROWSER = /Zalo|FBAN|FBAV|FB_IAB|Instagram/i;

/** Đọc hệ điều hành, trình duyệt nhúng và chế độ mở từ Màn hình chính của thiết bị hiện tại. */
export function detectPlatform(): DevicePlatform {
  const ua = navigator.userAgent;
  const ios =
    /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone =
    matchMedia('(display-mode: standalone)').matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return {
    os: ios ? 'ios' : /Android/i.test(ua) ? 'android' : 'other',
    inAppBrowser: IN_APP_BROWSER.test(ua),
    standalone,
  };
}
