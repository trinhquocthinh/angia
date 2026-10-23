import type { CSSProperties } from 'react';

/** Thứ tự xuất hiện so le cho `.angia-modal-reveal` (mỗi bậc trễ 50ms). */
export function revealStyle(index: number): CSSProperties {
  return { '--reveal-index': index } as CSSProperties;
}
