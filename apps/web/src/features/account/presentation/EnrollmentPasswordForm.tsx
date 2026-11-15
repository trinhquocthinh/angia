import { useNewPasswordForm } from '../application/useNewPasswordForm';
import { submitAccountAction } from '../infrastructure/submitAccountAction';
import { AccountSubmitButton } from './AccountSubmitButton';
import { FormAlert } from './FormAlert';
import { NewPasswordFields } from './NewPasswordFields';
export function EnrollmentPasswordForm({
  token,
  success,
  expire,
  unavailable,
}: {
  token: string;
  success: () => Promise<unknown>;
  expire: () => void;
  unavailable: () => void;
}) {
  const { form, submit, error } = useNewPasswordForm(
    submitAccountAction,
    '/api/me/local-credential',
    token,
    success,
    (failure) => {
      if (failure.status === 403 && failure.code === 'ERR_FORBIDDEN') {
        expire();
        return true;
      }
      if (failure.status === 404) {
        unavailable();
        return true;
      }
      return false;
    },
  );
  const busy = form.formState.isSubmitting;
  return (
    <form onSubmit={submit} aria-busy={busy}>
      <fieldset disabled={busy} className="flex flex-col gap-6">
        <p className="flex items-center gap-2 text-base text-success">
          <svg
            aria-hidden="true"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="m5 12 4 4L19 6" />
          </svg>
          Đã xác minh. Hãy đặt mật khẩu trong 5 phút.
        </p>
        <NewPasswordFields form={form} />
        <AccountSubmitButton busy={busy} disabled={!token} label="Lưu mật khẩu" pending="Đang lưu…" />
        <FormAlert message={error} />
      </fieldset>
    </form>
  );
}
