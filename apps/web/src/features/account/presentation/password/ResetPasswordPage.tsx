import { useResetPasswordForm } from '@src/features/account/application/useResetPasswordForm';
import { submitPasswordReset } from '@src/features/account/infrastructure/submitPasswordReset';
import { LoginLayout } from '@src/features/account/presentation/LoginLayout';
import { ResetPasswordForm } from '@src/features/account/presentation/password/ResetPasswordForm';
import { ResetPasswordInvalid } from '@src/features/account/presentation/password/ResetPasswordInvalid';
import { ResetPasswordSuccess } from '@src/features/account/presentation/password/ResetPasswordSuccess';
import '@src/features/account/presentation/password/forgot-password.css';
import '@src/features/account/presentation/password/reset-password.css';

export function ResetPasswordPage() {
  const model = useResetPasswordForm(submitPasswordReset);
  return (
    <LoginLayout clayIcons titleId="reset-title">
      <div className="reset-password">
        {model.stage === 'form' && <ResetPasswordForm model={model} />}
        {model.stage === 'invalid' && <ResetPasswordInvalid />}
        {model.stage === 'done' && <ResetPasswordSuccess />}
      </div>
    </LoginLayout>
  );
}
