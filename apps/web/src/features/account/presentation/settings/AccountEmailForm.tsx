import type { FormEventHandler } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { ChangeAccountEmailBody } from '@src/features/account/application/ports';
import { FormAlert } from '@src/features/account/presentation/FormAlert';
import { PasswordField } from '@src/features/account/presentation/PasswordField';
import { Field } from '@src/shared/ui/field/Field';

type Props = {
  form: UseFormReturn<ChangeAccountEmailBody>;
  error: string | null;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onCancel: () => void;
};

export function AccountEmailForm({ form, error, onSubmit, onCancel }: Props) {
  const busy = form.formState.isSubmitting;
  const { errors } = form.formState;
  return (
    <form className="account-email-form" onSubmit={onSubmit} noValidate aria-busy={busy}>
      <fieldset disabled={busy} className="account-email-fieldset">
        <Field
          {...form.register('email')}
          label="Email mới"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          error={errors.email?.message}
        />
        <PasswordField
          {...form.register('currentPassword')}
          label="Mật khẩu hiện tại"
          autoComplete="current-password"
          required
          error={errors.currentPassword?.message}
        />
        <div className="account-email-form-actions">
          <button type="submit" className="account-primary-btn" disabled={busy}>
            {busy ? 'Đang lưu…' : 'Lưu email'}
          </button>
          <button type="button" className="account-secondary-btn" onClick={onCancel} disabled={busy}>
            Huỷ
          </button>
        </div>
        <FormAlert message={error} />
      </fieldset>
    </form>
  );
}
