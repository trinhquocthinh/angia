import { useEffect, useRef } from 'react';
import { PasswordResetIcon } from '@src/features/account/presentation/password/PasswordResetIcon';

export function ResetPasswordSuccess() {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  return (
    <div className="reset-state">
      <header className="reset-heading reset-state-heading">
        <span className="reset-badge reset-badge-success">
          <PasswordResetIcon name="reset-verified" />
        </span>
        <h2 id="reset-title" ref={heading} tabIndex={-1}>
          Đã đặt lại mật khẩu
        </h2>
      </header>
      <p className="reset-status-message" role="status" aria-live="polite" aria-atomic="true">
        Mật khẩu đã được đặt lại. Hãy đăng nhập bằng mật khẩu mới.
      </p>
      <a className="reset-cta" href="/login">
        Đăng nhập
      </a>
    </div>
  );
}
