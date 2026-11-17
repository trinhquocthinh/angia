import type { UseFormReturn } from 'react-hook-form';
import { Field } from '@src/shared/ui/field/Field';
import type { RegistrationValues } from '../application/ports';
import { PasswordField } from './PasswordField';
import { PasswordStrength } from './PasswordStrength';
export function RegistrationFields({ form }: { form: UseFormReturn<RegistrationValues> }) {
  const errors = form.formState.errors;
  return (
    <>
      <div className="registration-control registration-user">
        <Field
          placeholder="Ví dụ: me.lan"
          label="Tên đăng nhập"
          autoComplete="username"
          required
          error={errors.username?.message}
          {...form.register('username')}
        />
      </div>
      <div className="registration-control registration-password">
        <PasswordField
          label="Mật khẩu"
          autoComplete="new-password"
          required
          hint="Ít nhất 8 ký tự, khác tên đăng nhập."
          error={errors.password?.message}
          {...form.register('password')}
        />
        <PasswordStrength value={form.watch('password')} />
      </div>
      <div className="registration-contact">
        <div className="registration-control registration-name">
          <Field
            placeholder="Lan, Minh…"
            label="Tên của bạn"
            autoComplete="name"
            required
            error={errors.displayName?.message}
            {...form.register('displayName')}
          />
        </div>
        <div className="registration-control registration-email">
          <Field
            label="Email (không bắt buộc)"
            type="email"
            autoComplete="email"
            placeholder="lan@email.com"
            error={errors.email?.message}
            {...form.register('email')}
          />
        </div>
      </div>
    </>
  );
}
