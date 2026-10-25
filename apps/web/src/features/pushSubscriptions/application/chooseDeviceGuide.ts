export interface DevicePlatform {
  os: 'ios' | 'android' | 'other';
  /** Trình duyệt nhúng trong Zalo/Facebook/Messenger: không cài được PWA, không bật được thông báo. */
  inAppBrowser: boolean;
  /** Đang mở từ biểu tượng trên Màn hình chính. */
  standalone: boolean;
}

export type DeviceGuideKind =
  'open-in-browser' | 'ios-install' | 'unblock-ios' | 'unblock-android' | 'android-install' | 'none';

// Chọn một hướng dẫn duy nhất theo thứ tự việc người dùng cần làm trước.
export function chooseDeviceGuide(input: {
  platform: DevicePlatform;
  permission: NotificationPermission | 'unsupported';
}): DeviceGuideKind {
  const { platform, permission } = input;
  if (platform.inAppBrowser) return 'open-in-browser';
  if (platform.os === 'ios' && !platform.standalone) return 'ios-install';
  if (permission === 'denied') {
    if (platform.os === 'ios') return 'unblock-ios';
    if (platform.os === 'android') return 'unblock-android';
    return 'none';
  }
  if (platform.os === 'android' && !platform.standalone) return 'android-install';
  return 'none';
}
