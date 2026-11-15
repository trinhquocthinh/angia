import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { CURRENT_SESSION_KEY } from '@src/features/auth/application/useCurrentSession';
import {
  readAccountStorage,
  RESTRICTED_CSRF_KEY,
  writeAccountStorage,
} from '../application/accountSessionStorage';
import { useNewPasswordForm } from '../application/useNewPasswordForm';
import { submitAccountAction } from '../infrastructure/submitAccountAction';
import { AccountLayout } from './AccountLayout';
import { AccountLogout } from './AccountLogout';
import { AccountSubmitButton } from './AccountSubmitButton';
import { FormAlert } from './FormAlert';
import { NewPasswordFields } from './NewPasswordFields';
export function ChangePasswordPage() {
  const client = useQueryClient();
  const navigate = useNavigate();
  const [token, setToken] = useState(() => readAccountStorage(RESTRICTED_CSRF_KEY));
  const { form, submit, error } = useNewPasswordForm(
    submitAccountAction,
    '/api/me/password',
    token ?? '',
    async () => {
      writeAccountStorage(RESTRICTED_CSRF_KEY, null);
      await client.invalidateQueries({ queryKey: CURRENT_SESSION_KEY });
      await navigate({ to: '/' });
    },
    (failure) => {
      if (failure.status !== 401 && failure.code !== 'ERR_UNAUTHENTICATED') return false;
      writeAccountStorage(RESTRICTED_CSRF_KEY, null);
      setToken(null);
      return true;
    },
  );
  const busy = form.formState.isSubmitting;
  return (
    <AccountLayout footer={token ? <AccountLogout token={token} /> : null}>
      <h2 className="mb-4 text-[22px] leading-[30px] font-semibold">Đặt mật khẩu mới</h2>
      {token ? (
        <>
          <p className="mb-6 text-lg">Mật khẩu của bạn đã được đặt lại. Hãy đặt mật khẩu mới để tiếp tục.</p>
          <form onSubmit={submit} aria-busy={busy}>
            <fieldset disabled={busy} className="flex flex-col gap-6">
              <NewPasswordFields form={form} />
              <AccountSubmitButton busy={busy} label="Lưu mật khẩu mới" pending="Đang lưu…" />
              <FormAlert message={error} />
            </fieldset>
          </form>
        </>
      ) : (
        <>
          <p>Vui lòng đăng nhập lại.</p>
          <Link to="/login" className="account-link inline-flex min-h-14 items-center">
            Đăng nhập
          </Link>
        </>
      )}
    </AccountLayout>
  );
}
