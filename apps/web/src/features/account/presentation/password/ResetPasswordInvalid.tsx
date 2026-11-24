import { useEffect, useRef } from 'react';
import { PasswordResetIcon } from '@src/features/account/presentation/password/PasswordResetIcon';

export function ResetPasswordInvalid() {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  return (
    <div className="reset-state">
      <header className="reset-heading reset-state-heading">
        <span className="reset-badge reset-badge-invalid">
          <PasswordResetIcon name="reset-lock_clock" />
        </span>
        <h2 id="reset-title" ref={heading} tabIndex={-1}>
          Liên kết không dùng được
        </h2>
      </header>
      <p className="reset-status-message" role="status" aria-live="polite" aria-atomic="true">
        Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
      </p>
      <a className="reset-cta" href="/forgot-password">
        <span>Yêu cầu liên kết mới</span>
        <PasswordResetIcon name="reset-refresh" />
      </a>
    </div>
  );
}
