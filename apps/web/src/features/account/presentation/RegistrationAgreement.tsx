import type { UseFormReturn } from 'react-hook-form';
import type { CurrentLegal, RegistrationValues } from '../application/ports';
import { AccountCheckbox } from './AccountCheckbox';
export function RegistrationAgreement({
  form,
  legal,
}: {
  form: UseFormReturn<RegistrationValues>;
  legal: CurrentLegal | null;
}) {
  return (
    <>
      <AccountCheckbox
        label="Tôi trên 18 tuổi"
        error={form.formState.errors.ageConfirmed?.message}
        {...form.register('ageConfirmed')}
      />
      <AccountCheckbox
        required
        error={form.formState.errors.legalAgreed?.message}
        {...form.register('legalAgreed', { required: true })}
        label={
          <>
            Tôi đồng ý với{' '}
            {legal ? (
              <a href={legal.terms.url} target="_blank" rel="noopener noreferrer" className="account-link">
                Điều khoản sử dụng
              </a>
            ) : (
              'Điều khoản sử dụng'
            )}{' '}
            và{' '}
            {legal ? (
              <a href={legal.privacy.url} target="_blank" rel="noopener noreferrer" className="account-link">
                Chính sách quyền riêng tư
              </a>
            ) : (
              'Chính sách quyền riêng tư'
            )}
          </>
        }
      />
    </>
  );
}
