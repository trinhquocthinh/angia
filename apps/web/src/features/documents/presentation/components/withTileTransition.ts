import { flushSync } from 'react-dom';

// Bỏ ảnh: ô ảnh mờ đi và các ô còn lại trượt về chỗ mới bằng View Transition; trình duyệt cũ hoặc giảm chuyển động thì bỏ ngay.
export function withTileTransition(update: () => void) {
  if (
    typeof document.startViewTransition !== 'function' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    update();
    return;
  }
  document.startViewTransition(() => flushSync(update));
}
