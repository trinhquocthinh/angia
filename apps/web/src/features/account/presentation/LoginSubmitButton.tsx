import { useState } from 'react';
import type { PointerEvent } from 'react';
import { Button } from '@src/shared/ui/button/Button';
import { AuthSpinner } from '@src/features/auth/presentation/components/AuthSpinner';
import { LoginIcon } from './LoginIcon';

type Ripple = { x: number; y: number; size: number; id: number };

export function LoginSubmitButton({
  busy,
  disabled = false,
  label = 'Đăng nhập',
  pending = 'Đang đăng nhập…',
}: {
  busy: boolean;
  disabled?: boolean;
  label?: string;
  pending?: string;
}) {
  const [ripple, setRipple] = useState<Ripple | null>(null);
  function showRipple(event: PointerEvent<HTMLButtonElement>) {
    if (busy || disabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    setRipple({
      x: event.clientX - rect.left - size / 2,
      y: event.clientY - rect.top - size / 2,
      size,
      id: event.timeStamp,
    });
  }
  return (
    <Button type="submit" disabled={busy || disabled} onPointerDown={showRipple} className="login-submit">
      {ripple && (
        <span
          key={ripple.id}
          className="login-button-ripple"
          aria-hidden="true"
          style={{ left: ripple.x, top: ripple.y, width: ripple.size, height: ripple.size }}
          onAnimationEnd={() => setRipple(null)}
        />
      )}
      <span className="login-button-content">
        {busy && <AuthSpinner />}
        {busy ? pending : label}
        {!busy && <LoginIcon name="arrow" />}
      </span>
    </Button>
  );
}
