import { useEffect, useRef } from 'react';

/** Đưa phần tử về đầu màn hình khi mở (tôn trọng giảm chuyển động). */
export function useScrollIntoViewOnMount<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    ref.current?.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
  }, []);
  return ref;
}
