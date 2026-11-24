import { VerifyEmailIcon } from '@src/features/account/presentation/verify/VerifyEmailIcon';
import { VerifyEmailOutcome } from '@src/features/account/presentation/verify/VerifyEmailOutcome';

export function VerifyEmailSuccess() {
  return (
    <VerifyEmailOutcome
      badge={
        <span className="verify-badge verify-badge-success" aria-hidden="true">
          <span className="verify-badge-inner verify-badge-inner-success">
            <VerifyEmailIcon name="verify-check" className="verify-icon-lg" />
          </span>
        </span>
      }
      title="Đã xác minh email"
      body={
        <p className="verify-status" role="status" aria-live="polite" aria-atomic="true">
          Email của bạn đã được xác minh. Bạn có thể dùng email này để đăng nhập và đặt lại mật khẩu.
        </p>
      }
      actions={
        <a className="verify-cta" href="/">
          <span>Vào AN GIA</span>
          <VerifyEmailIcon name="verify-arrow-right" className="verify-icon-sm" />
        </a>
      }
    />
  );
}
