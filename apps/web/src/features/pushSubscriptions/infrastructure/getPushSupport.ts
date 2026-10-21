export function getPushSupport(): string | null {
  const ios =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone =
    matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone;
  if (ios && !standalone)
    return 'Trên iPhone: mở AN GIA bằng Safari, chọn Chia sẻ → Thêm vào Màn hình chính, rồi mở biểu tượng AN GIA để bật thông báo.';
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
