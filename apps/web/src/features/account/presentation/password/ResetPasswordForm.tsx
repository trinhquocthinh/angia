import type { useResetPasswordForm } from '@src/features/account/application/useResetPasswordForm';
import { useEffect } from 'react';
import { PasswordResetAlert } from '@src/features/account/presentation/password/PasswordResetAlert';
import { NewPasswordFields } from '@src/features/account/presentation/NewPasswordFields';
import { PasswordResetBackLink } from '@src/features/account/presentation/password/PasswordResetBackLink';
import { PasswordResetIcon } from '@src/features/account/presentation/password/PasswordResetIcon';

export function ResetPasswordForm({ model }: { model: ReturnType<typeof useResetPasswordForm> }) {
  const { setFocus } = model.form;
  useEffect(() => {
    setFocus('password');
  }, [setFocus]);
  const busy = model.form.formState.isSubmitting;
  return (
    <>
      <header className="reset-heading">
        <span className="reset-badge">
          <PasswordResetIcon name="reset-key" />
        </span>
        <div className="reset-heading-copy">
          <h2 id="reset-title">Đặt mật khẩu mới</h2>
          <p>Nhập mật khẩu mới cho tài khoản của bạn.</p>
        </div>
      </header>
      <form noValidate onSubmit={model.submit} aria-busy={busy}>
        <fieldset disabled={busy} className="reset-fields">
          <NewPasswordFields form={model.form} showStrength />
          <button type="submit" className="reset-submit">
            <span>{busy ? 'Đang đặt mật khẩu…' : 'Đặt mật khẩu'}</span>
            <PasswordResetIcon name="reset-arrow_forward" />
          </button>
          <PasswordResetAlert message={model.error} />
        </fieldset>
      </form>
      <PasswordResetBackLink />
    </>
  );
}
