import type { useForgotPasswordForm } from '@src/features/account/application/useForgotPasswordForm';
import { PasswordResetEmailField } from '@src/features/account/presentation/password/PasswordResetEmailField';
import { PasswordResetIcon } from '@src/features/account/presentation/password/PasswordResetIcon';
import { PasswordResetAlert } from '@src/features/account/presentation/password/PasswordResetAlert';
import { PasswordResetBackLink } from '@src/features/account/presentation/password/PasswordResetBackLink';

export function ForgotPasswordForm({ model }: { model: ReturnType<typeof useForgotPasswordForm> }) {
  const busy = model.form.formState.isSubmitting;
  return (
    <>
      <header className="forgot-heading">
        <h2 id="forgot-title">Quên mật khẩu</h2>
        <p>Nhập email đã xác minh để nhận liên kết đặt lại mật khẩu.</p>
      </header>
      <form noValidate onSubmit={model.submit} aria-busy={busy}>
        <fieldset disabled={busy} className="forgot-fields">
          <PasswordResetEmailField form={model.form} />
          <button className="forgot-submit" type="submit">
            <span>{busy ? 'Đang gửi…' : 'Gửi liên kết đặt lại mật khẩu'}</span>
            <PasswordResetIcon name="arrow_forward" />
          </button>
          <PasswordResetAlert message={model.error} />
        </fieldset>
      </form>
      <PasswordResetBackLink />
      <p className="forgot-caption">
        Chưa xác minh email? Hãy nhờ Chủ hộ hoặc Đồng quản lý đặt lại mật khẩu cho bạn.
      </p>
    </>
  );
}
