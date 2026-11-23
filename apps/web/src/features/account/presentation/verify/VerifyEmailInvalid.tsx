import { VerifyEmailIcon } from '@src/features/account/presentation/verify/VerifyEmailIcon';
import { VerifyEmailOutcome } from '@src/features/account/presentation/verify/VerifyEmailOutcome';

export function VerifyEmailInvalid() {
  return (
    <VerifyEmailOutcome
      badge={
        <span className="verify-badge verify-badge-invalid" aria-hidden="true">
          <span className="verify-badge-inner verify-badge-inner-invalid">
            <VerifyEmailIcon name="verify-lock" className="verify-icon-md" />
            <span className="verify-clock-pin">
              <VerifyEmailIcon name="verify-clock" className="verify-icon-xs" />
            </span>
          </span>
        </span>
      }
      title="Liên kết không dùng được"
      body={
        <div className="verify-status" role="status" aria-live="polite" aria-atomic="true">
          <p>Liên kết xác minh không hợp lệ hoặc đã hết hạn.</p>
          <p className="verify-subcopy">Hãy mở Tài khoản và bấm “Xác minh email” để nhận liên kết mới.</p>
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
