import { useVerifyEmail } from '@src/features/account/application/useVerifyEmail';
import { submitEmailVerificationConfirm } from '@src/features/account/infrastructure/submitEmailVerificationConfirm';
import { LoginLayout } from '@src/features/account/presentation/LoginLayout';
import { VerifyEmailError } from '@src/features/account/presentation/verify/VerifyEmailError';
import { VerifyEmailInvalid } from '@src/features/account/presentation/verify/VerifyEmailInvalid';
import { VerifyEmailPending } from '@src/features/account/presentation/verify/VerifyEmailPending';
import { VerifyEmailSuccess } from '@src/features/account/presentation/verify/VerifyEmailSuccess';
import { VerifyEmailTaken } from '@src/features/account/presentation/verify/VerifyEmailTaken';
import '@src/features/account/presentation/verify/verify-email.css';

export function VerifyEmailPage() {
  const model = useVerifyEmail(submitEmailVerificationConfirm);
  return (
    <LoginLayout clayIcons titleId="verify-title">
      <div className="verify-email">
        {model.stage === 'verifying' && <VerifyEmailPending />}
        {model.stage === 'success' && <VerifyEmailSuccess />}
        {model.stage === 'invalid' && <VerifyEmailInvalid />}
        {model.stage === 'taken' && <VerifyEmailTaken />}
        {model.stage === 'error' && model.error && (
          <VerifyEmailError message={model.error} onRetry={model.retry} />
        )}
      </div>
    </LoginLayout>
  );
}
