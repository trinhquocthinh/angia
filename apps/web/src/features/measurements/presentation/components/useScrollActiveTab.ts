import { useEffect, useRef } from 'react';

// Màn hẹp: dải tab cuộn ngang, kéo tab đang mở vào tầm nhìn (chỉ cuộn ngang, không cuộn trang).
export function useScrollActiveTab(active: string) {
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = navRef.current;
    const current = nav?.querySelector('[aria-current="page"]');
    if (!nav || !current) return;
    const overflow = current.getBoundingClientRect().right - nav.getBoundingClientRect().right;
    if (overflow > 0) nav.scrollLeft += overflow;
  }, [active]);
  return navRef;
}
