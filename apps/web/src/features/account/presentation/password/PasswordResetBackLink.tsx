import { PasswordResetIcon } from '@src/features/account/presentation/password/PasswordResetIcon';

export function PasswordResetBackLink() {
  return (
    <a className="forgot-back" href="/login">
      <PasswordResetIcon name="arrow_back" />
      Quay lại đăng nhập
    </a>
  );
}
