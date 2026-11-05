import { flushSync } from 'react-dom';

// Xóa dòng: thẻ mờ đi và các thẻ còn lại trượt về chỗ mới; trình duyệt cũ hoặc giảm chuyển động thì xóa ngay.
export function withRowTransition(update: () => void) {
  if (
    typeof document.startViewTransition !== 'function' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    update();
    return;
  }
  document.startViewTransition(() => flushSync(update));
}
