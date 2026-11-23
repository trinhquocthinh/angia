import { z } from 'zod';
import { accountErrorMessage } from '@src/features/account/application/accountErrorMessage';
import type { SubmitPasswordResetRequest } from '@src/features/account/application/ports';

type ResetRequestResult = { status: 'sent' } | { status: 'invalid' | 'error'; message: string };

export async function requestPasswordReset(
  email: string,
  submit: SubmitPasswordResetRequest,
): Promise<ResetRequestResult> {
  if (!email.trim()) return { status: 'invalid', message: 'Vui lòng nhập email.' };
  if (!z.email().safeParse(email.trim()).success)
    return { status: 'invalid', message: 'Vui lòng nhập email đúng định dạng.' };
  const result = await submit({ email: email.trim() });
  if (result.ok) return { status: 'sent' };
  return {
    status: result.code === 'ERR_VALIDATION' ? 'invalid' : 'error',
    message: accountErrorMessage(result.code),
  };
}
