import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { completeAccountAccess } from '../application/completeAccountAccess';
import { useRegistrationForm } from '../application/useRegistrationForm';
import { fetchCurrentLegal } from '../infrastructure/fetchCurrentLegal';
import { submitRegistration } from '../infrastructure/submitRegistration';
import { AccountLayout } from './AccountLayout';
import { AccountSubmitButton } from './AccountSubmitButton';
import { FormAlert } from './FormAlert';
import { RegistrationFields } from './RegistrationFields';
import { RegistrationAgreement } from './RegistrationAgreement';
import { RegistrationClosedNotice } from './RegistrationClosedNotice';
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
    <AccountLayout
      back
      footer={
        <p>
          Đã có tài khoản?{' '}
          <Link to="/login" className="account-link inline-flex min-h-12 items-center">
            Đăng nhập
          </Link>
        </p>
      }
    >
      <h2 className="mb-6 text-[22px] leading-[30px] font-semibold">Tạo tài khoản</h2>
      {closed && <RegistrationClosedNotice />}
      <form onSubmit={submit} aria-busy={busy}>
        <fieldset disabled={busy} className="flex flex-col gap-6">
          <RegistrationFields form={form} />
          <RegistrationAgreement form={form} legal={legal} />
          <AccountSubmitButton
            busy={busy}
            disabled={!legal || loadingLegal}
            label="Tạo tài khoản"
            pending="Đang tạo tài khoản…"
          />
          <FormAlert message={error} />
        </fieldset>
      </form>
    </AccountLayout>
  );
}
