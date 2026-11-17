import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { completePasswordLogin } from '../application/completePasswordLogin';
import { useLoginForm } from '../application/useLoginForm';
import { submitPasswordLogin } from '../infrastructure/submitPasswordLogin';
import { LoginLayout } from './LoginLayout';
import { LoginForm } from './LoginForm';
import { LoginAlternative } from './LoginAlternative';
import { LoginIcon } from './LoginIcon';
export function LoginPage({ hasAuthError = false }: { hasAuthError?: boolean }) {
  const client = useQueryClient();
  const navigate = useNavigate();
  const { form, error, submit } = useLoginForm(
    submitPasswordLogin,
    (session) => completePasswordLogin(session, (options) => client.invalidateQueries(options), navigate),
    hasAuthError,
  );
  return (
    <LoginLayout>
      <div className="login-form-heading">
        <span className="login-heading-icon">
          <LoginIcon name="lock" />
        </span>
        <div>
          <h2 id="login-title">Đăng nhập</h2>
          <p>Chào bạn, mừng bạn về nhà.</p>
        </div>
      </div>
      <LoginForm form={form} onSubmit={submit} error={error} />
      <LoginAlternative />
    </LoginLayout>
  );
}
