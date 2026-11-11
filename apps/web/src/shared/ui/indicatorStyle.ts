import type { CSSProperties } from 'react';

type Measured = { offsetLeft: number; offsetWidth: number };

/** Design §11.4.1: nền chọn trượt tới nút đang chọn; lần đo đầu đặt thẳng vào chỗ, không trượt. */
export function indicatorStyle(target: Measured | null, animate: boolean): CSSProperties {
  if (!target) return { opacity: 0 };
  const style: CSSProperties = {
    opacity: 1,
    width: target.offsetWidth,
    transform: `translateX(${target.offsetLeft}px)`,
  };
  return animate ? style : { ...style, transition: 'none' };
}
