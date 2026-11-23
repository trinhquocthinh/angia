import { useEffect, useState } from 'react';
import type { SubmitAccountAction, SubmitPasswordReset } from '@src/features/account/application/ports';
import { parsePasswordResetToken } from '@src/features/account/application/readPasswordResetToken';
import { scrubPasswordResetHash } from '@src/features/account/application/scrubPasswordResetHash';
import { useNewPasswordForm } from '@src/features/account/application/useNewPasswordForm';

export type ResetPasswordStage = 'form' | 'invalid' | 'done';

export function useResetPasswordForm(submitReset: SubmitPasswordReset) {
  const [token, setToken] = useState<string | null>(() =>
    parsePasswordResetToken(globalThis.location?.hash ?? ''),
  );
  const [stage, setStage] = useState<ResetPasswordStage>(() => (token ? 'form' : 'invalid'));

  useEffect(() => {
    scrubPasswordResetHash();
  }, []);

  const action: SubmitAccountAction = async (_path, body, resetToken) => {
    if (!resetToken) return { ok: false, code: 'ERR_RESET_TOKEN_INVALID', status: 400 };
    const newPassword = 'newPassword' in body ? body.newPassword : '';
    const result = await submitReset({ token: resetToken, newPassword });
    // Lỗi 422 ở màn đặt lại mật khẩu hiển thị dưới nút thay vì gắn vào trường nhập.
    if (!result.ok && result.code === 'ERR_VALIDATION')
      return { ok: false, code: result.code, ...(result.status ? { status: result.status } : {}) };
    return result;
  };

  const { form, submit, error } = useNewPasswordForm(
    action,
    '/api/me/password',
    token ?? '',
    async () => {
      setToken(null);
      setStage('done');
    },
    (failure) => {
      if (failure.code !== 'ERR_RESET_TOKEN_INVALID') return false;
      setToken(null);
      setStage('invalid');
      return true;
    },
  );

  const { reset } = form;
  useEffect(() => {
    if (stage !== 'form') reset();
  }, [stage, reset]);

  return { form, submit, error, stage };
}
