import { Link } from '@tanstack/react-router';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { AccountMenuIcon } from './AccountMenuIcon';
import { AccountMenuItem } from './AccountMenuItem';
import { AccountMenuIdentity } from './AccountMenuIdentity';
import { AccountMenuDestinations } from './AccountMenuDestinations';
import type { AccountMenuProps } from './accountMenuTypes';
type Props = AccountMenuProps & { onClose?: (() => void) | undefined };
export function AccountMenuPanel({ session, pending, error, onLogout, onClose }: Props) {
  return (
    <div className="account-menu-content">
      <AccountMenuIdentity session={session} onClose={onClose} />
      {!session.family && !session.account.isSystemAdmin && (
        <Link to="/waiting" search={{ step: 'create' }} className="account-menu-context" onClick={onClose}>
          <AccountMenuIcon name="home" />
          <span>
            <strong>Gia đình số AN GIA</strong>
            <span>Tạo nhà đầu tiên để thêm người thân</span>
          </span>
          <b>
            Khởi tạo <AdminIcon name="chevron_right" size={16} />
          </b>
        </Link>
      )}
      <AccountMenuDestinations session={session} onClose={onClose} />
      <div className="account-menu-links">
        <AccountMenuItem
          to="/account"
          icon="account-settings"
          label="Quản lý tài khoản"
          description="Bảo mật & cài đặt"
          onClose={onClose}
        />
      </div>
      <div className="account-menu-divider" />
      <button
        type="button"
        aria-label={pending ? 'Đang đăng xuất…' : 'Đăng xuất'}
        aria-description="Thoát khỏi thiết bị này"
        className="account-menu-logout"
        disabled={pending}
        onClick={onLogout}
      >
        <AccountMenuIcon name="logout" />
        <span>
          <strong>{pending ? 'Đang đăng xuất…' : 'Đăng xuất'}</strong>
          <small>Thoát khỏi thiết bị này</small>
        </span>
        <span className="account-menu-logout-chevron">
          <AdminIcon name="chevron_right" />
        </span>
      </button>
      {error && (
        <p role="alert" className="text-danger">
          Không thể đăng xuất. Vui lòng thử lại.
        </p>
      )}
      <p className="account-menu-footnote">AN GIA • Sổ tay chăm sóc gia đình</p>
    </div>
  );
}
