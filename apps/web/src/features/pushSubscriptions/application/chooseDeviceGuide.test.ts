import { describe, expect, it } from 'vitest';
import { chooseDeviceGuide, type DevicePlatform } from './chooseDeviceGuide';

const platform = (value: Partial<DevicePlatform>): DevicePlatform => ({
  os: 'other',
  inAppBrowser: false,
  standalone: false,
  ...value,
});
describe('TC-370 Chọn hướng dẫn theo thiết bị', () => {
  it('mở trong Zalo/Facebook → ưu tiên hướng dẫn mở bằng trình duyệt, kể cả trên iPhone', () => {
    const ios = platform({ os: 'ios', inAppBrowser: true });
    expect(chooseDeviceGuide({ platform: ios, permission: 'default' })).toBe('open-in-browser');
    const android = platform({ os: 'android', inAppBrowser: true });
    expect(chooseDeviceGuide({ platform: android, permission: 'denied' })).toBe('open-in-browser');
  });
  it('iPhone trong tab Safari → hướng dẫn thêm vào Màn hình chính', () => {
    const ios = platform({ os: 'ios' });
    expect(chooseDeviceGuide({ platform: ios, permission: 'unsupported' })).toBe('ios-install');
  });
  it('đã chặn quyền thông báo → hướng dẫn mở lại theo hệ điều hành', () => {
    const ios = platform({ os: 'ios', standalone: true });
    expect(chooseDeviceGuide({ platform: ios, permission: 'denied' })).toBe('unblock-ios');
    const android = platform({ os: 'android' });
    expect(chooseDeviceGuide({ platform: android, permission: 'denied' })).toBe('unblock-android');
  });
  it('Android chưa cài → gợi ý cài lên màn hình chính', () => {
    const android = platform({ os: 'android' });
    expect(chooseDeviceGuide({ platform: android, permission: 'default' })).toBe('android-install');
    expect(chooseDeviceGuide({ platform: android, permission: 'granted' })).toBe('android-install');
  });
  it('đã mở từ biểu tượng hoặc máy tính → không cần hướng dẫn', () => {
    const installed = platform({ os: 'android', standalone: true });
    expect(chooseDeviceGuide({ platform: installed, permission: 'granted' })).toBe('none');
    const iosApp = platform({ os: 'ios', standalone: true });
    expect(chooseDeviceGuide({ platform: iosApp, permission: 'default' })).toBe('none');
    expect(chooseDeviceGuide({ platform: platform({}), permission: 'denied' })).toBe('none');
  });
});
