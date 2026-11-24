import { VerifyEmailIcon } from '@src/features/account/presentation/verify/VerifyEmailIcon';
import { VerifyEmailOutcome } from '@src/features/account/presentation/verify/VerifyEmailOutcome';

type Props = {
  message: string;
  onRetry: () => void;
};

export function VerifyEmailError({ message, onRetry }: Props) {
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
        <p className="verify-alert" role="alert">
          {message}
        </p>
      }
      actions={
        <>
          <button type="button" className="verify-cta" onClick={onRetry}>
            Thử lại
          </button>
          <a className="verify-secondary-link" href="/account">
            <span>Mở Tài khoản</span>
            <VerifyEmailIcon name="verify-arrow-right" className="verify-icon-sm" />
          </a>
        </>
      }
    />
  );
}
