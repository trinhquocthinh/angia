import type { FormEvent } from 'react';

/** Rung trường bị trình duyệt từ chối; không thay đổi quy tắc kiểm tra dữ liệu. */
export function shakeRegistrationField(event: FormEvent<HTMLFormElement>) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const target = input.closest('.registration-control') ?? input;
  target
    .getAnimations()
    .filter((animation) => animation.id === 'registration-invalid')
    .forEach((animation) => animation.cancel());
  const animation = target.animate(
    [0, -6, 6, -6, 6, 0].map((offset) => ({
      transform: `translateX(${offset}px)`,
    })),
    { duration: 400, easing: 'ease-in-out' },
  );
  animation.id = 'registration-invalid';
}
