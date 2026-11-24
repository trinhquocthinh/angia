import type { UseFormReturn } from 'react-hook-form';
import type { PasswordValues } from '../application/passwordValidation';
import { PasswordField } from './PasswordField';
import { PasswordStrength } from './PasswordStrength';

export function NewPasswordFields({
  form,
  showStrength = false,
}: {
  form: UseFormReturn<PasswordValues>;
  showStrength?: boolean;
}) {
  return (
    <>
      <PasswordField
        label="Mật khẩu mới"
        hint="Ít nhất 8 ký tự, khác tên đăng nhập."
        autoComplete="new-password"
        error={form.formState.errors.password?.message}
        {...form.register('password')}
      />
      {showStrength && <PasswordStrength value={form.watch('password')} />}
      <PasswordField
        label="Nhập lại mật khẩu mới"
        autoComplete="new-password"
        error={form.formState.errors.confirmation?.message}
        {...form.register('confirmation')}
      />
    </>
  );
}
