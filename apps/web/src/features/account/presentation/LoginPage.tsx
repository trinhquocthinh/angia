import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { Field } from '@src/shared/ui/field/Field';
import { completePasswordLogin } from '../application/completePasswordLogin';
import { useLoginForm } from '../application/useLoginForm';
import { submitPasswordLogin } from '../infrastructure/submitPasswordLogin';
import { AccountLayout } from './AccountLayout';
import { AccountSubmitButton } from './AccountSubmitButton';
import { FormAlert } from './FormAlert';
import { PasswordField } from './PasswordField';
export function LoginPage({ hasAuthError = false }: { hasAuthError?: boolean }) {
  const client = useQueryClient();
  const navigate = useNavigate();
  const { form, error, submit } = useLoginForm(
    submitPasswordLogin,
    (session) => completePasswordLogin(session, (options) => client.invalidateQueries(options), navigate),
    hasAuthError,
  );
  const busy = form.formState.isSubmitting;
  return (
    <AccountLayout
      admin
      footer={
        <>
          <a href="/forgot-password" className="account-link inline-flex min-h-12 items-center">
            Quên mật khẩu
          </a>
          <p>
            Chưa có tài khoản?{' '}
            <Link to="/register" className="account-link inline-flex min-h-12 items-center">
              Tạo tài khoản
            </Link>
          </p>
        </>
      }
    >
      <h2 className="mb-6 text-[22px] leading-[30px] font-semibold">Đăng nhập</h2>
      <form onSubmit={submit} aria-busy={busy}>
        <fieldset disabled={busy} className="flex flex-col gap-6">
          <Field label="Tên đăng nhập" autoComplete="username" required {...form.register('username')} />
          <PasswordField
            label="Mật khẩu"
            autoComplete="current-password"
            required
            {...form.register('password')}
          />
          <AccountSubmitButton busy={busy} label="Đăng nhập" pending="Đang đăng nhập…" />
          <FormAlert message={error} />
        </fieldset>
      </form>
    </AccountLayout>
  );
}
