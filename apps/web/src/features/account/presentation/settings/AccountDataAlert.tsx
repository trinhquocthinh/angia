import { FormAlert } from '@src/features/account/presentation/FormAlert';
import { AccountSettingsIcon } from '@src/features/account/presentation/settings/AccountSettingsIcon';

type Props = { message: string | null; warning?: boolean };

export function AccountDataAlert({ message, warning = false }: Props) {
  return (
    <FormAlert
      message={message}
      className={warning ? 'account-export-warning-box' : 'account-export-error-box'}
      icon={<AccountSettingsIcon name={warning ? 'warning' : 'error'} className="account-icon-md" />}
    />
  );
}
