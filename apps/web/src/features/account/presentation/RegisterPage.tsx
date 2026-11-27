import { PendingInvitationNotice } from './PendingInvitationNotice';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { completeAccountAccess } from '../application/completeAccountAccess';
import { useRegistrationForm } from '../application/useRegistrationForm';
import { fetchCurrentLegal } from '../infrastructure/fetchCurrentLegal';
import { submitRegistration } from '../infrastructure/submitRegistration';
import { LoginLayout } from './LoginLayout';
import { RegistrationHeading } from './RegistrationHeading';
import { RegistrationFooter } from './RegistrationFooter';
import { LoginSubmitButton } from './LoginSubmitButton';
import { FormAlert } from './FormAlert';
import { RegistrationFields } from './RegistrationFields';
import { RegistrationAgreement } from './RegistrationAgreement';
import { RegistrationClosedNotice } from './RegistrationClosedNotice';
import { shakeRegistrationField } from './shakeRegistrationField';
import './registration-form.css';
export function RegisterPage() {
  const client = useQueryClient();
  const navigate = useNavigate();
  const { form, submit, error, closed, legal, loadingLegal } = useRegistrationForm(
    submitRegistration,
    fetchCurrentLegal,
    () => completeAccountAccess((options) => client.invalidateQueries(options), navigate),
  );
  const busy = form.formState.isSubmitting;
  return (
    <LoginLayout titleId="register-title" clayIcons>
      <RegistrationHeading />
      <PendingInvitationNotice />
      {closed && <RegistrationClosedNotice />}
      <form
        className="registration-form"
        onSubmit={submit}
        onInvalidCapture={shakeRegistrationField}
        aria-busy={busy}
      >
        <fieldset disabled={busy} className="login-fields flex flex-col gap-6">
          <RegistrationFields form={form} />
          <div className="registration-agreement">
            <RegistrationAgreement form={form} legal={legal} />
          </div>
          <div className="registration-submit">
            <LoginSubmitButton
              busy={busy}
              disabled={!legal || loadingLegal}
              label="Tạo tài khoản"
              pending="Đang tạo tài khoản…"
            />
          </div>
          <FormAlert message={error} />
        </fieldset>
      </form>
      <RegistrationFooter />
    </LoginLayout>
  );
}
