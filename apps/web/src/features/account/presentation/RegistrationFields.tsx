import type { UseFormReturn } from 'react-hook-form';
import { Field } from '@src/shared/ui/field/Field';
import type { RegistrationValues } from '../application/ports';
import { PasswordField } from './PasswordField';
export function RegistrationFields({ form }: { form: UseFormReturn<RegistrationValues> }) {
  const errors = form.formState.errors;
  return (
    <>
      <Field
        label="Tên đăng nhập"
        autoComplete="username"
        required
        error={errors.username?.message}
        {...form.register('username')}
      />
      <PasswordField
        label="Mật khẩu"
        autoComplete="new-password"
        required
        hint="Ít nhất 8 ký tự, khác tên đăng nhập."
        error={errors.password?.message}
        {...form.register('password')}
      />
      <Field
        label="Tên của bạn"
        autoComplete="name"
        required
        error={errors.displayName?.message}
        {...form.register('displayName')}
      />
      <Field
        label="Email (không bắt buộc)"
        type="email"
        autoComplete="email"
        placeholder="ví dụ: lan@email.com"
        error={errors.email?.message}
        {...form.register('email')}
      />
    </>
  );
}
