import { AccountSettingsIcon } from '@src/features/account/presentation/settings/AccountSettingsIcon';

type Props = {
  pending: boolean;
  canSubmit: boolean;
  onClose: () => void;
};

export function AccountDeleteDialogActions({ pending, canSubmit, onClose }: Props) {
  return (
    <div className="account-delete-dialog-actions">
      <button type="button" className="account-delete-cancel" disabled={pending} onClick={onClose}>
        Huỷ
      </button>
      <button type="submit" className="account-delete-confirm" disabled={!canSubmit}>
        {pending && <AccountSettingsIcon name="spinner" className="account-icon-sm account-spinner" />}
        <span>Xoá tài khoản</span>
      </button>
    </div>
  );
}
