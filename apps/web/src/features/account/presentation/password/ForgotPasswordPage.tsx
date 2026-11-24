import { useForgotPasswordForm } from '@src/features/account/application/useForgotPasswordForm';
import { submitPasswordResetRequest } from '@src/features/account/infrastructure/submitPasswordResetRequest';
import { LoginLayout } from '@src/features/account/presentation/LoginLayout';
import { ForgotPasswordForm } from '@src/features/account/presentation/password/ForgotPasswordForm';
import { PasswordResetSent } from '@src/features/account/presentation/password/PasswordResetSent';
import '@src/features/account/presentation/password/forgot-password.css';

export function ForgotPasswordPage() {
  const model = useForgotPasswordForm(submitPasswordResetRequest);
  return (
    <LoginLayout clayIcons titleId="forgot-title">
      <div className="forgot-password">
        {model.sent ? (
          <PasswordResetSent
            busy={model.form.formState.isSubmitting}
            error={model.error}
            resent={model.resent}
            onResend={model.submit}
          />
        ) : (
          <ForgotPasswordForm model={model} />
        )}
      </div>
    </LoginLayout>
  );
}
