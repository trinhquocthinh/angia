import { VerifyEmailIcon } from '@src/features/account/presentation/verify/VerifyEmailIcon';
import { VerifyEmailOutcome } from '@src/features/account/presentation/verify/VerifyEmailOutcome';

export function VerifyEmailTaken() {
  return (
    <VerifyEmailOutcome
      badge={
        <span className="verify-badge verify-badge-warning" aria-hidden="true">
          <span className="verify-badge-inner verify-badge-inner-warning">
            <VerifyEmailIcon name="verify-warning" className="verify-icon-lg" />
          </span>
        </span>
      }
      title="Không xác minh được"
      body={
        <div className="verify-status" role="status" aria-live="polite" aria-atomic="true">
          <p>Email này đã được một tài khoản khác xác minh.</p>
          <p className="verify-subcopy">Hãy dùng một email khác trong Tài khoản.</p>
        </div>
      }
      actions={
        <a className="verify-cta" href="/account">
          <span>Mở Tài khoản</span>
          <VerifyEmailIcon name="verify-arrow-right" className="verify-icon-sm" />
        </a>
      }
    />
  );
}
