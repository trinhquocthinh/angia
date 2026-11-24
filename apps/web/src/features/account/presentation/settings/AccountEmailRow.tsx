import type { EmailSettingsState } from '@src/features/account/application/emailSettingsState';
import type { AccountEmailStatus } from '@src/features/account/application/ports';
import { AccountSettingsIcon } from '@src/features/account/presentation/settings/AccountSettingsIcon';

type Props = {
  emailStatus: AccountEmailStatus;
  state: EmailSettingsState;
  editing: boolean;
  verifyBusy: boolean;
  onOpenForm: () => void;
  onVerify: () => void;
};

export function AccountEmailRow({ emailStatus, state, editing, verifyBusy, onOpenForm, onVerify }: Props) {
  const changeLabel = state.mode === 'empty' ? 'Thêm email' : 'Đổi email';
  return (
    <div className="account-email-box">
      <div className="account-email-main">
        <p className={emailStatus.email ? 'account-email-value' : 'account-email-empty'}>
          {emailStatus.email ?? 'Chưa có email'}
        </p>
        {!editing && (
          <div className="account-email-actions">
            {state.canVerify && (
              <button type="button" className="account-primary-btn" disabled={verifyBusy} onClick={onVerify}>
                <AccountSettingsIcon name="send" className="account-icon-sm" />
                <span>{verifyBusy ? 'Đang gửi…' : 'Xác minh email'}</span>
              </button>
            )}
            <button
              type="button"
              className={state.mode === 'empty' ? 'account-primary-btn' : 'account-text-btn'}
              onClick={onOpenForm}
            >
              {state.mode !== 'empty' && <AccountSettingsIcon name="edit" className="account-icon-sm" />}
              <span>{changeLabel}</span>
            </button>
          </div>
        )}
      </div>
      {emailStatus.pendingEmail && (
        <p className="account-pending-note">
          <AccountSettingsIcon name="info" className="account-icon-md" />
          <span>
            Email mới đang chờ xác minh: {emailStatus.pendingEmail}. Cho tới khi đó, email cũ vẫn dùng để đặt
            lại mật khẩu.
          </span>
        </p>
      )}
    </div>
  );
}
