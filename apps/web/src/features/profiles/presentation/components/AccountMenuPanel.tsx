import { Link } from '@tanstack/react-router';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { AccountMenuIdentity } from './AccountMenuIdentity';
import { AccountThemeSwitch } from './AccountThemeSwitch';
import type { AccountMenuProps } from './accountMenuTypes';
type Props = AccountMenuProps & { onClose?: (() => void) | undefined };
export function AccountMenuPanel({ session, pending, error, onLogout, onClose }: Props) {
  return (
    <div className="account-menu-content">
      <AccountMenuIdentity session={session} onClose={onClose} />
      {!session.family && !session.account.isSystemAdmin && (
        <Link to="/waiting" search={{ step: 'create' }} className="account-menu-context" onClick={onClose}>
          <AdminIcon name="home_health" size={24} />
          <span>
            <strong>Gia đình số AN GIA</strong>
            <span>Tạo nhà đầu tiên để thêm người thân</span>
          </span>
          <b>
            Khởi tạo <AdminIcon name="chevron_right" size={16} />
          </b>
        </Link>
      )}
      {(session.account.healthProfileId || session.account.isSystemAdmin) && (
        <div className="account-menu-links">
          {session.account.healthProfileId && (
            <Link to="/my-profile" onClick={onClose}>
              <AdminIcon name="person" />
              Hồ sơ của tôi
            </Link>
          )}
          {session.account.isSystemAdmin && (
            <Link to="/admin" onClick={onClose}>
              <AdminIcon name="admin_panel_settings" />
              Quản trị hệ thống
            </Link>
          )}
        </div>
      )}
      <AccountThemeSwitch />
      <div className="account-menu-divider" />
      <button type="button" className="account-menu-logout" disabled={pending} onClick={onLogout}>
        <span className="account-menu-logout-icon">
          <AdminIcon name="logout" />
        </span>
        <span>
          <strong>{pending ? 'Đang đăng xuất…' : 'Đăng xuất'}</strong>
          <small>Rời khỏi tài khoản hiện tại</small>
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
