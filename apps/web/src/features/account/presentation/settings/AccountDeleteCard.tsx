import { useRef } from 'react';
import type { AccountProfileDisposition } from '@src/features/account/application/ports';
import { AccountDeleteDialog } from '@src/features/account/presentation/settings/AccountDeleteDialog';
import { AccountSettings3DIcon } from '@src/features/account/presentation/settings/AccountSettings3DIcon';

type Props = {
  hasLinkedProfile: boolean;
  open: boolean;
  password: string;
  disposition: AccountProfileDisposition | null;
  pending: boolean;
  canSubmit: boolean;
  error: string | null;
  errorCode: string | null;
  onOpen: () => void;
  onClose: () => void;
  onPasswordChange: (value: string) => void;
  onDispositionChange: (value: AccountProfileDisposition) => void;
  onSubmit: () => void;
};

export function AccountDeleteCard(props: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <section className="account-card account-delete-card" aria-labelledby="account-delete-heading">
      <div className="account-card-title-group">
        <AccountSettings3DIcon name="shield-danger-3d" />
        <h2 id="account-delete-heading" className="account-card-title account-delete-title">
          Xoá tài khoản
        </h2>
      </div>
      <p className="account-card-copy">
        Xoá tài khoản của bạn khỏi AN GIA. Bản ghi đồng ý pháp lý và nhật ký quản lý còn lại không chứa dữ
        liệu sức khoẻ.
      </p>
      <div className="account-delete-card-footer">
        <button ref={triggerRef} type="button" className="account-delete-trigger" onClick={props.onOpen}>
          Xoá tài khoản…
        </button>
      </div>
      {props.open && (
        <AccountDeleteDialog
          hasLinkedProfile={props.hasLinkedProfile}
          password={props.password}
          disposition={props.disposition}
          pending={props.pending}
          canSubmit={props.canSubmit}
          error={props.error}
          errorCode={props.errorCode}
          returnFocusRef={triggerRef}
          onClose={props.onClose}
          onPasswordChange={props.onPasswordChange}
          onDispositionChange={props.onDispositionChange}
          onSubmit={props.onSubmit}
        />
      )}
    </section>
  );
}
