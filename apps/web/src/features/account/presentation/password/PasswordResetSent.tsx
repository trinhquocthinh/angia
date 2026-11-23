import { useEffect, useRef } from 'react';
import type { FormEventHandler } from 'react';
import { PasswordResetIcon } from '@src/features/account/presentation/password/PasswordResetIcon';
import { PasswordResetAlert } from '@src/features/account/presentation/password/PasswordResetAlert';
import { PasswordResetBackLink } from '@src/features/account/presentation/password/PasswordResetBackLink';

type Props = {
  busy: boolean;
  error: string | null;
  resent: boolean;
  onResend: FormEventHandler<HTMLFormElement>;
};

export function PasswordResetSent({ busy, error, resent, onResend }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  return (
    <>
      <header className="forgot-heading forgot-sent-heading">
        <span className="forgot-sent-badge">
          <PasswordResetIcon name="mark_email_read" />
        </span>
        <h2 id="forgot-title" ref={heading} tabIndex={-1}>
          Kiểm tra hộp thư của bạn
        </h2>
      </header>
      <p className="forgot-sent-message">
        Nếu email này thuộc một tài khoản đã xác minh, liên kết đặt lại sẽ được gửi trong ít phút. Liên kết có
        hiệu lực 30 phút.
      </p>
      <form noValidate onSubmit={onResend} aria-busy={busy}>
        <button className="forgot-resend" type="submit" disabled={busy}>
          Gửi lại
        </button>
        <PasswordResetAlert message={error} />
        <p className="forgot-live" role="status" aria-live="polite" aria-atomic="true">
          {resent ? 'Đã gửi lại.' : ''}
        </p>
      </form>
      <PasswordResetBackLink />
    </>
  );
}
