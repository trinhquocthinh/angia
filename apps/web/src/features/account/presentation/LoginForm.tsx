import type { FormEventHandler } from 'react';
import { LoginSubmitButton } from './LoginSubmitButton';
import type { useLoginForm } from '../application/useLoginForm';
import { FormAlert } from './FormAlert';
import { LoginField } from './LoginField';
import { LoginPasswordField } from './LoginPasswordField';

type Props = {
  form: ReturnType<typeof useLoginForm>['form'];
  onSubmit: FormEventHandler<HTMLFormElement>;
  error: string | null;
};

export function LoginForm({ form, onSubmit, error }: Props) {
  const busy = form.formState.isSubmitting;
  return (
    <form onSubmit={onSubmit} aria-busy={busy}>
      <fieldset disabled={busy} className="login-fields">
        <LoginField
          label="Tên đăng nhập"
          icon="user"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="Nhập tên đăng nhập"
          required
          {...form.register('identifier')}
        />
        <LoginPasswordField
          autoComplete="current-password"
          placeholder="Nhập mật khẩu"
          required
          {...form.register('password')}
        />
        <div className="login-recovery">
          <a href="/forgot-password">Quên mật khẩu</a>
        </div>
        <LoginSubmitButton busy={busy} />
        <FormAlert message={error} />
      </fieldset>
    </form>
  );
}
