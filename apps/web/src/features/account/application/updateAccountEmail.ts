import { z } from 'zod';
import { accountErrorMessage } from '@src/features/account/application/accountErrorMessage';
import type {
  AccountEmailStatus,
  ChangeAccountEmailBody,
  SubmitAccountEmailChange,
} from '@src/features/account/application/ports';

export type UpdateAccountEmailResult =
  | { status: 'updated'; data: AccountEmailStatus }
  | { status: 'invalid'; field: 'email' | 'currentPassword'; message: string }
  | { status: 'error'; message: string };

export async function updateAccountEmail(
  values: ChangeAccountEmailBody,
  csrfToken: string,
  submit: SubmitAccountEmailChange,
): Promise<UpdateAccountEmailResult> {
  const trimmed = values.email.trim();
  if (!trimmed) return { status: 'invalid', field: 'email', message: 'Vui lòng nhập email.' };
  if (trimmed.length > 254 || !z.email().safeParse(trimmed).success) {
    return { status: 'invalid', field: 'email', message: 'Vui lòng nhập email đúng định dạng.' };
  }
  if (!values.currentPassword) {
    return {
      status: 'invalid',
      field: 'currentPassword',
      message: 'Vui lòng nhập mật khẩu hiện tại.',
    };
  }
  const result = await submit({ email: trimmed, currentPassword: values.currentPassword }, csrfToken);
  if (result.ok) return { status: 'updated', data: result.data };
  if (result.code === 'ERR_VALIDATION') {
    return {
      status: 'invalid',
      field: result.field === 'currentPassword' ? 'currentPassword' : 'email',
      message: accountErrorMessage(result.code),
    };
  }
  return { status: 'error', message: accountErrorMessage(result.code) };
}
