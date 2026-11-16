import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { CURRENT_SESSION_KEY, useCurrentSession } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import { resolveSessionRedirect } from '@src/features/auth/application/resolveSessionRedirect';
import {
  ENROLL_LATER_KEY,
  ENROLL_REAUTH_KEY,
  writeAccountStorage,
} from '../application/accountSessionStorage';
import { useEnrollmentVerification } from '../application/useEnrollmentVerification';
import { AccountLayout } from './AccountLayout';
import { EnrollmentPasswordForm } from './EnrollmentPasswordForm';
import { FormAlert } from './FormAlert';
import { Button } from '@src/shared/ui/button/Button';
export function LocalPasswordPage() {
  const session = useCurrentSession(fetchCurrentSession);
  const verification = useEnrollmentVerification();
  const client = useQueryClient();
  const navigate = useNavigate();
  const eligible =
    session.data?.authMethod === 'oidc' &&
    !session.data.hasLocalCredential &&
    session.data.features.localEnrollmentEnabled;
  useEffect(() => {
    if (session.data && !eligible)
      void navigate({ to: resolveSessionRedirect(session.data, '/') ?? '/', replace: true });
  }, [session.data, eligible, navigate]);
  async function success() {
    writeAccountStorage(ENROLL_REAUTH_KEY, null);
    await client.invalidateQueries({ queryKey: CURRENT_SESSION_KEY });
  }
  function defer() {
    writeAccountStorage(ENROLL_LATER_KEY, '1');
    writeAccountStorage(ENROLL_REAUTH_KEY, null);
    void navigate({ to: '/' });
  }
  if (!eligible) return null;
  return (
    <AccountLayout
      footer={
        <button type="button" onClick={defer} className="account-link inline-flex min-h-14 items-center">
          Để sau
        </button>
      }
    >
      <h2 className="mb-4 text-[22px] leading-[30px] font-semibold">Đặt mật khẩu cho AN GIA</h2>
      <p className="mb-6 text-lg">
        Từ nay bạn đăng nhập bằng mật khẩu riêng của AN GIA. Dữ liệu và gia đình giữ nguyên.
      </p>
      {verification.verified ? (
        <EnrollmentPasswordForm
          token={session.data?.csrfToken ?? ''}
          success={success}
          expire={verification.expire}
          unavailable={defer}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <p className="text-lg">Để bảo vệ tài khoản, bạn cần xác minh lại trước khi đặt mật khẩu.</p>
          <Button type="button" onClick={verification.reauthenticate} className="w-full">
            Xác minh lại
          </Button>
          <FormAlert message={verification.error} />
        </div>
      )}
    </AccountLayout>
  );
}
