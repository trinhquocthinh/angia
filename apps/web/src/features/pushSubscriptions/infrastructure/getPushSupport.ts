import { detectIosBrowser } from './detectIosBrowser';

export function getPushSupport(): string | null {
  // iOS không có lời mời cài tự động như Android: các bước chi tiết nằm ở IosInstallGuide.
  if (detectIosBrowser())
    return 'Trên iPhone, cần thêm AN GIA vào Màn hình chính rồi mở từ biểu tượng đó để bật thông báo.';
  if (
    !isSecureContext ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    !('Notification' in window)
  ) {
    return 'Thiết bị cần kết nối HTTPS và trình duyệt hỗ trợ Web Push.';
  }
  return null;
}
