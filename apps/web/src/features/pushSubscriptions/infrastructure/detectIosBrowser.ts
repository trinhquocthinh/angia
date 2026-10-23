/** iPhone/iPad đang mở AN GIA trong trình duyệt (chưa mở từ biểu tượng trên Màn hình chính). */
export function detectIosBrowser(): boolean {
  const ios =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone =
    matchMedia('(display-mode: standalone)').matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return ios && !standalone;
}
