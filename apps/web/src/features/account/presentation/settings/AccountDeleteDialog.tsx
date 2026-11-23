import { useId, type RefObject } from 'react';
import type { AccountProfileDisposition } from '@src/features/account/application/ports';
import { PasswordField } from '@src/features/account/presentation/PasswordField';
import { AccountDataAlert } from '@src/features/account/presentation/settings/AccountDataAlert';
import { AccountDeleteDialogActions } from '@src/features/account/presentation/settings/AccountDeleteDialogActions';
import { AccountSettingsIcon } from '@src/features/account/presentation/settings/AccountSettingsIcon';
import { LeaveDispositionOptions } from '@src/features/household/presentation/leave/LeaveDispositionOptions';
import { ModalSurface } from '@src/shared/ui/ModalSurface';

type Props = {
  hasLinkedProfile: boolean;
  password: string;
  disposition: AccountProfileDisposition | null;
  pending: boolean;
  canSubmit: boolean;
  error: string | null;
  errorCode: string | null;
  returnFocusRef?: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onPasswordChange: (value: string) => void;
  onDispositionChange: (value: AccountProfileDisposition) => void;
  onSubmit: () => void;
};

export function AccountDeleteDialog(props: Props) {
  const titleId = useId();
  return (
    <ModalSurface
      className="account-delete-dialog"
      labelledBy={titleId}
      pending={props.pending}
      returnFocusRef={props.returnFocusRef}
      onClose={props.onClose}
    >
      <form
        className="account-delete-dialog-body"
        aria-busy={props.pending}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          props.onSubmit();
        }}
      >
        <span className="account-delete-handle" aria-hidden="true" />
        <div className="account-delete-dialog-head">
          <span className="account-delete-dialog-icon" aria-hidden="true">
            <AccountSettingsIcon name="delete-shield" className="account-icon-md" />
          </span>
          <h3 id={titleId} className="account-delete-dialog-title">
            Xoá tài khoản?
          </h3>
        </div>
        <AccountDataAlert message={props.error} warning={props.errorCode === 'ERR_RATE_LIMITED'} />
        {props.hasLinkedProfile && (
          <LeaveDispositionOptions
            name="delete-account-profile-disposition"
            disposition={props.disposition}
            pending={props.pending}
            onChange={props.onDispositionChange}
          />
        )}
        <PasswordField
          data-autofocus
          label="Nhập mật khẩu để xác nhận"
          value={props.password}
          autoComplete="current-password"
          disabled={props.pending}
          onChange={(event) => props.onPasswordChange(event.target.value)}
        />
        <AccountDeleteDialogActions
          pending={props.pending}
          canSubmit={props.canSubmit}
          onClose={props.onClose}
        />
      </form>
    </ModalSurface>
  );
}
