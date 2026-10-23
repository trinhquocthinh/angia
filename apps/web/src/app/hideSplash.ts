// Giữ màn khởi động tối thiểu 1,2s tính từ lúc mở để không nháy; trình duyệt thường (splash ẩn) gỡ ngay.
const MIN_VISIBLE_MS = 1200;
const LEAVE_MS = 320;

export function hideSplash(): void {
  const splash = document.getElementById('splash');
  if (!splash) return;
  if (getComputedStyle(splash).display === 'none') {
    splash.remove();
    return;
  }
  window.setTimeout(
    () => {
      splash.classList.add('sp-leave');
      window.setTimeout(() => splash.remove(), LEAVE_MS);
    },
    Math.max(0, MIN_VISIBLE_MS - performance.now()),
  );
}
