import type { UseFormReturn } from 'react-hook-form';
import type { PasswordValues } from '../application/passwordValidation';
import { PasswordField } from './PasswordField';
export function NewPasswordFields({ form }: { form: UseFormReturn<PasswordValues> }) {
  return (
    <>
      <PasswordField
        label="Mật khẩu mới"
        hint="Ít nhất 8 ký tự, khác tên đăng nhập."
        autoComplete="new-password"
        error={form.formState.errors.password?.message}
        {...form.register('password')}
      />
      <PasswordField
        label="Nhập lại mật khẩu mới"
        autoComplete="new-password"
        error={form.formState.errors.confirmation?.message}
        {...form.register('confirmation')}
      />
    </>
  );
}
